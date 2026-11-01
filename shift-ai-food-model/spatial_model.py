"""Train a food localiser on mask-labelled spatial features, not oracle crops.

Only training masks are opened. Validation/test prediction takes RGB-derived
features only; the original full visible vocabulary and capture groups survive.
"""
import argparse
import copy
from datetime import datetime, timezone
import io
import json
from pathlib import Path
import shutil
import time

from core import SCHEMA, calibrate, digest, food_response, local_path, metrics, parse_request, release_blockers, validate_manifest
from spatial_features import PREPROCESS_ID, read
from visible_learning import annotation_groups, check_mask

FAMILY = "shift-spatial-food-localiser-1"
ENSEMBLE_FAMILY = "shift-spatial-food-ensemble-1"


def training_patch_targets(row, root, annotation_rows, labels):
    """196 soft pixel-distribution targets; mask access refused outside train."""
    if row.get("split") != "train":
        raise ValueError("Only training masks may enter localiser fitting")
    from PIL import Image
    from collections import Counter
    path = local_path(root, "masks/" + row["id"] + ".png")
    raw = path.read_bytes()
    if digest(path) != row["mask_sha256"] or check_mask(raw, annotation_rows) != row["mask_sha256"]:
        raise ValueError("Pinned training mask changed")
    mapping = [0] * 256
    for r in annotation_rows:
        label = "eggs" if r["annotation_name"] in ("egg", "egg_whites") else r["annotation_name"]
        mapping[int(r["label_value"])] = labels.index(label) + 1
    with Image.open(io.BytesIO(raw)) as image:
        # Preserve indexed pixel identities; palette luminance is not a label.
        indexed = Image.frombytes("L", image.size, image.tobytes())
        target = indexed.point(mapping).resize((224, 224), Image.Resampling.NEAREST)
    values = []
    for y in range(0, 224, 16):
        for x in range(0, 224, 16):
            counts = Counter(target.crop((x, y, x + 16, y + 16)).get_flattened_data())
            values.append([counts[i] / 256 for i in range(len(labels) + 1)])
    return values


def architecture(classes, hidden=0, members=1):
    import torch

    if members > 1:
        class AverageHeads(torch.nn.Module):
            def __init__(self):
                super().__init__()
                self.heads = torch.nn.ModuleList([architecture(classes, hidden) for _ in range(members)])

            def forward(self, patches, context):
                probabilities = torch.stack([h(patches, context).softmax(-1) for h in self.heads]).mean(0)
                return probabilities.clamp_min(1e-12).log()

        return AverageHeads()

    class SpatialHead(torch.nn.Module):
        def __init__(self):
            super().__init__()
            for name in ("patch_mean", "context_mean"):
                self.register_buffer(name, torch.zeros(768))
            for name in ("patch_std", "context_std"):
                self.register_buffer(name, torch.ones(768))
            self.patch = (torch.nn.Sequential(torch.nn.Linear(768, hidden), torch.nn.GELU(),
                torch.nn.Linear(hidden, classes)) if hidden else torch.nn.Linear(768, classes))
            self.context = torch.nn.Linear(768, classes, bias=False)

        def forward(self, patches, context):
            return self.patch((patches - self.patch_mean) / self.patch_std) + self.context(
                (context - self.context_mean) / self.context_std)[:, None, :]

    return SpatialHead()


def pooled_scores(head, values, k):
    import torch
    result = []
    with torch.no_grad():
        for batch in values.split(16):
            probabilities = head(batch[:, :196], batch[:, 196]).softmax(-1)[:, :, 1:]
            result.extend(probabilities.topk(k, dim=1).values.mean(1).tolist())
    return result


def train(args):
    import numpy as np
    import torch
    from safetensors.torch import save_file
    from semantic_model import MODEL_ID, REVISION, WEIGHT_SHA256
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    torch.set_num_threads(4); torch.use_deterministic_algorithms(True); torch.manual_seed(args.seed)
    manifest = validate_manifest(args.manifest)
    completed = json.loads((args.feature_cache / "complete.json").read_text())
    if completed["manifest_sha256"] != digest(args.manifest) or completed["masks_read"] != 0:
        raise ValueError("Exact label-independent spatial features required")
    annotations = annotation_groups(args.annotations / "ingredient_nutrition.csv")
    labels = manifest["labels"]
    rows = {s: [r for r in manifest["samples"] if r["split"] == s] for s in ("train", "validation", "test")}
    xs = {s: torch.from_numpy(np.stack([read(r, args.feature_cache) for r in rows[s]])) for s in ("train", "validation")}
    target = torch.tensor([training_patch_targets(r, args.manifest.parent, annotations[r["id"]], labels) for r in rows["train"]])
    validation_y = [[int(l in r["labels"]) for l in labels] for r in rows["validation"]]
    head = architecture(len(labels) + 1, args.hidden)
    head.patch_mean.copy_(xs["train"][:, :196].mean((0, 1)))
    head.patch_std.copy_(xs["train"][:, :196].std((0, 1)).clamp_min(.05))
    head.context_mean.copy_(xs["train"][:, 196].mean(0)); head.context_std.copy_(xs["train"][:, 196].std(0).clamp_min(.05))
    auxiliary = []; aux_x = None
    if args.aux_manifest:
        from auxiliary_features import qualified_records
        auxiliary_manifest = json.loads(args.aux_manifest.read_text())
        if auxiliary_manifest.get("schema") != "shift-partial-positive-training-1":
            raise ValueError("Explicit partial-positive training schema required")
        auxiliary = qualified_records(auxiliary_manifest)
        if any(r["known_positive"] not in labels for r in auxiliary):
            raise ValueError("Fixed visible vocabulary required for auxiliary positives")
        aux_x = torch.from_numpy(np.stack([read(r, args.aux_manifest.parent) for r in auxiliary]))
    if args.initial_head:
        initial = json.loads((args.initial_head / "artifact.json").read_text())
        for name, pin in initial["files"].items():
            if digest(args.initial_head / name) != pin:
                raise ValueError("Initial own regional head changed")
        meta = json.loads((args.initial_head / "head.json").read_text())
        if meta["labels"] != labels or meta.get("hidden", 0) != args.hidden:
            raise ValueError("Matching own spatial architecture required")
        from safetensors.torch import load_file
        head.load_state_dict(load_file(args.initial_head / "head.safetensors"), strict=True)
    frequencies = target.sum((0, 1))
    weights = (frequencies.sum() / frequencies.clamp_min(1)).sqrt()
    weights /= weights[1:][frequencies[1:] > 0].median()
    weights = weights.clamp(.25, 8)
    learning_rate = .0003 if args.initial_head else .003
    optimiser = torch.optim.AdamW(head.parameters(), lr=learning_rate, weight_decay=.03)
    training_y = torch.tensor([[int(l in r["labels"]) for l in labels] for r in rows["train"]], dtype=torch.float32)
    best, best_loss, best_epoch = None, float("inf"), 0
    if args.initial_head:
        head.eval()
        initial_p = torch.tensor(pooled_scores(head, xs["validation"], 3)).clamp(1e-6, 1 - 1e-6)
        best_loss = float(torch.nn.functional.binary_cross_entropy(initial_p, torch.tensor(validation_y, dtype=torch.float32)))
        best = copy.deepcopy(head.state_dict())
    for epoch in range(40):
        if time.monotonic() > deadline:
            raise TimeoutError("Bounded dense localiser fitting expired")
        head.train(); training_loss = 0.
        for indices in torch.randperm(len(xs["train"])).split(8):
            optimiser.zero_grad()
            logits = head(xs["train"][indices, :196], xs["train"][indices, 196])
            loss = -(logits.log_softmax(-1) * target[indices] * weights).sum(-1).mean()
            if args.image_weight:
                image_probabilities = logits.softmax(-1)[:, :, 1:].topk(3, dim=1).values.mean(1).clamp(1e-6, 1 - 1e-6)
                loss = loss + args.image_weight * torch.nn.functional.binary_cross_entropy(image_probabilities, training_y[indices])
            if auxiliary:
                chosen = torch.randint(len(auxiliary), (2,))
                probabilities = head(aux_x[chosen, :196], aux_x[chosen, 196]).softmax(-1)
                positive_loss = []
                for offset, index in enumerate(chosen.tolist()):
                    row = auxiliary[index]; x0, y0, x1, y1 = row["box"]
                    positions = [y * 14 + x for y in range(14) for x in range(14)
                        if x0 <= (x + .5) / 14 <= x1 and y0 <= (y + .5) / 14 <= y1]
                    if not positions:
                        positions = [min(13, int((y0 + y1) * 7)) * 14 + min(13, int((x0 + x1) * 7))]
                    p = probabilities[offset, positions, labels.index(row["known_positive"]) + 1]
                    positive_loss.append(-p.topk(min(3, len(positions))).values.mean().clamp_min(1e-6).log())
                # Only known positive boxes contribute: no unlabelled food is
                # assigned a false negative label in the new public photos.
                loss = loss + .1 * torch.stack(positive_loss).mean()
            loss.backward(); optimiser.step(); training_loss += float(loss.detach())
        head.eval()
        # Validation uses image-level labels, never validation segmentation masks.
        probabilities = torch.tensor(pooled_scores(head, xs["validation"], 3)).clamp(1e-6, 1 - 1e-6)
        loss = float(torch.nn.functional.binary_cross_entropy(probabilities, torch.tensor(validation_y, dtype=torch.float32)))
        if loss < best_loss:
            best, best_loss, best_epoch = copy.deepcopy(head.state_dict()), loss, epoch + 1
        if (epoch + 1) % 5 == 0:
            print(json.dumps({"stage": "dense_mask_training", "epoch": epoch + 1, "validation_image_loss": loss,
                "training_mask_images": len(rows["train"]), "validation_masks_read": 0}), flush=True)
        if epoch + 1 - best_epoch >= 10:
            break
    head.load_state_dict(best); head.eval()
    choices = []
    for k in (1, 3, 6):
        p = pooled_scores(head, xs["validation"], k)
        thresholds = calibrate(p, validation_y, labels)
        result = metrics(p, validation_y, thresholds, labels)
        choices.append((result["micro_f1"], -k, thresholds, result))
    _, minus_k, thresholds, validation = max(choices, key=lambda c: c[:2]); k = -minus_k
    # No test prediction, label, crop or mask selects weights/pooling/thresholds.
    test_x = torch.from_numpy(np.stack([read(r, args.feature_cache) for r in rows["test"]]))
    test_y = [[int(l in r["labels"]) for l in labels] for r in rows["test"]]
    scores = pooled_scores(head, test_x, k)
    report = {"schema": SCHEMA, "candidate": args.output.name, "model_family": FAMILY,
        "created_utc": datetime.now(timezone.utc).isoformat(), "data_kind": manifest["data_kind"],
        "source_manifest_sha256": digest(args.manifest), "labels": labels, "thresholds": thresholds,
        "base": {"id": MODEL_ID, "revision": REVISION, "weight_sha256": WEIGHT_SHA256, "licence": "Apache-2.0"},
        "training": {"method": "Own soft pixel-distribution food/background head on 196 frozen spatial vectors plus global context",
            "trainable_parameters": sum(p.numel() for p in head.parameters()), "encoder_updated": False,
            "hidden_width": args.hidden, "training_image_loss_weight": args.image_weight,
            "seed": args.seed,
            "auxiliary_positive_images": len(auxiliary), "auxiliary_unknown_labels_used_as_negatives": False,
            "learning_rate": learning_rate, "initial_head_used": args.initial_head.name if args.initial_head else None,
            "trained_from_scratch": False, "selected_epoch": best_epoch, "selected_top_k_patches": k,
            "selection": "Minimum validation image BCE at fixed top-3, then highest validation F1 for fixed pooling 1/3/6; original calibration rule",
            "training_masks_read": len(rows["train"]), "validation_masks_read": 0, "test_masks_read": 0,
            "oracle_crops_used": False, "encoder_passes_per_photo": 1,
            "split_images": {s: len(v) for s, v in rows.items()}, "seconds": time.monotonic() - start,
            "new_paid_services": False, "cpu_threads": 4},
        "validation": validation, "pooling_candidates": [{"top_k": -c[1], "validation": c[3]} for c in choices],
        "test": metrics(scores, test_y, thresholds, labels),
        "disabled_classes": [l for l, t in zip(labels, thresholds) if t > 1],
        "test_previously_inspected": True, "non_food_test": None, "production_privacy_reviewed": False,
        "production_ready": False, "promoted": False,
        "limitations": manifest["limitations"] + ["Four previously inspected development-test capture weeks; not fresh UK acceptance",
            "A 14x14 localiser is coarse localisation, not precise ingredient delineation", "No quantity or calorie prediction"]}
    report["release_blockers"] = release_blockers(report)
    args.output.mkdir(parents=True, exist_ok=False)
    save_file(head.state_dict(), args.output / "head.safetensors")
    (args.output / "head.json").write_text(json.dumps({"family": FAMILY, "labels": labels, "thresholds": thresholds,
        "top_k": k, "hidden": args.hidden, "preprocess": PREPROCESS_ID, "classes_including_background": len(labels) + 1}, indent=2) + "\n")
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": r["id"], "targets": y, "scores": p} for r, y, p in zip(rows["test"], test_y, scores)], indent=2) + "\n")
    shutil.copyfile(args.manifest, args.output / "research-manifest.json")
    for name in ("base-source.json", "BASE-LICENSE", "ATTRIBUTION.txt"):
        shutil.copyfile(args.incumbent / name, args.output / name)
    if auxiliary:
        shutil.copyfile(args.aux_manifest, args.output / "auxiliary-data.json")
        report["training"]["auxiliary_manifest_sha256"] = digest(args.aux_manifest)
        (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
        with (args.output / "ATTRIBUTION.txt").open("a") as credit:
            credit.write("\nAuxiliary positive-only object training: Open Images annotations CC BY 4.0. Photo credits, CC BY 2.0; resized and metadata removed:\n")
            for row in auxiliary:
                credit.write(row["attribution"] + "\n")
    pins = {p.name: digest(p) for p in args.output.iterdir() if p.is_file()}
    (args.output / "artifact.json").write_text(json.dumps({"schema": SCHEMA, "model_family": FAMILY,
        "status": "research_candidate_only", "files": pins, "base_weights_embedded": False}, indent=2) + "\n")
    print(json.dumps({"stage": "complete", "selected_epoch": best_epoch, "top_k": k,
        "precision": report["test"]["micro_precision"], "recall": report["test"]["micro_recall"], "f1": report["test"]["micro_f1"]}), flush=True)


class SpatialPredictor:
    def __init__(self, candidate, base, *, research=False):
        if not research:
            raise ValueError("Spatial localiser remains research only")
        import torch
        from safetensors.torch import load_file
        from semantic_model import encoder
        art = json.loads((candidate / "artifact.json").read_text())
        required = {"head.json", "head.safetensors", "evaluation.json", "test-predictions.json", "research-manifest.json", "base-source.json", "BASE-LICENSE", "ATTRIBUTION.txt"}
        if "auxiliary-data.json" in art.get("files", {}):
            required.add("auxiliary-data.json")
        if art.get("model_family") not in (FAMILY, ENSEMBLE_FAMILY) or art.get("status") != "research_candidate_only" or set(art.get("files", {})) != required:
            raise ValueError("Complete pinned spatial research bundle required")
        for name, pin in art["files"].items():
            if digest(local_path(candidate, name)) != pin:
                raise ValueError("Spatial bundle bytes changed")
        self.settings = json.loads((candidate / "head.json").read_text()); self.report = json.loads((candidate / "evaluation.json").read_text())
        aux_pin = self.report.get("training", {}).get("auxiliary_manifest_sha256")
        if (aux_pin is not None) != ("auxiliary-data.json" in art["files"]) or (aux_pin and digest(candidate / "auxiliary-data.json") != aux_pin):
            raise ValueError("Auxiliary data provenance differs from training receipt")
        members = self.settings.get("ensemble_members", 1)
        if self.settings.get("family") != art["model_family"] or type(members) is not int or not 1 <= members <= 4 or (
            art["model_family"] == FAMILY and members != 1) or (art["model_family"] == ENSEMBLE_FAMILY and members < 2):
            raise ValueError("Known explicit spatial head count required")
        if self.settings.get("preprocess") != PREPROCESS_ID or self.settings.get("top_k") not in (1, 3, 6) or self.settings.get("hidden", 0) not in (0, 128):
            raise ValueError("Known spatial preprocessing required")
        if self.settings["labels"] != self.report["labels"] or self.settings["thresholds"] != self.report["thresholds"] or self.report.get("production_ready") is not False:
            raise ValueError("Spatial contract differs from report")
        if digest(candidate / "research-manifest.json") != self.report["source_manifest_sha256"]:
            raise ValueError("Training provenance changed")
        torch.set_num_threads(4); self.model, source = encoder(base)
        if source != json.loads((candidate / "base-source.json").read_text()):
            raise ValueError("Wrong pinned image base")
        self.head = architecture(len(self.settings["labels"]) + 1, self.settings.get("hidden", 0), members)
        self.head.load_state_dict(load_file(candidate / "head.safetensors"), strict=True); self.head.eval()

    def encode(self, request):
        from PIL import Image
        import torch
        from semantic_model import view_tensors
        raw = parse_request(request)
        Image.MAX_IMAGE_PIXELS = 1_000_000
        with Image.open(io.BytesIO(raw)) as image:
            if image.format != "JPEG" or max(image.size) > 768 or min(image.size) < 8:
                raise ValueError("Resized JPEG required")
            pixels = view_tensors(image)[0].unsqueeze(0)
        with torch.inference_mode():
            output = self.model(pixel_values=pixels)
        return output.last_hidden_state, output.pooler_output

    def score_features(self, features):
        import torch
        with torch.no_grad():
            probabilities = self.head(*features).softmax(-1)[:, :, 1:]
            return probabilities.topk(self.settings["top_k"], dim=1).values.mean(1)[0].tolist()

    def recognise(self, request):
        return food_response(self.score_features(self.encode(request)), self.settings["labels"], self.settings["thresholds"])


class GatedSpatialPredictor:
    def __init__(self, candidate, base, gate, *, research=False):
        from food_gate import FoodGate
        self.model = SpatialPredictor(candidate, base, research=research); self.gate = FoodGate(gate)

    def inspect(self, request):
        features = self.model.encode(request); decision = self.gate.inspect(features[1])
        scores = self.model.score_features(features)
        response = food_response(scores, self.model.settings["labels"], self.model.settings["thresholds"]) if decision["accept"] else {"items": [], "nutrition": {}}
        return response, decision, scores

    def recognise(self, request):
        return self.inspect(request)[0]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("manifest", "feature-cache", "annotations", "incumbent", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--max-minutes", type=int, required=True, choices=range(1, 31))
    parser.add_argument("--hidden", type=int, choices=(0, 128), default=0)
    parser.add_argument("--image-weight", type=float, choices=(0, .2), default=0)
    parser.add_argument("--seed", type=int, default=20261101, choices=range(20261101, 20261111))
    parser.add_argument("--aux-manifest", type=Path)
    parser.add_argument("--initial-head", type=Path)
    train(parser.parse_args())
