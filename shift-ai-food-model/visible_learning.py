"""Own visible-food head experiment; public data only, never member photos.

Annotations are used as image-level targets, not oracle crops. At inference the
model sees only the same whole JPEG as the existing head. No nutrition targets
are used. The existing capture-week assignment and acceptance rules survive.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor
import csv
from datetime import datetime, timezone
import hashlib
import io
import json
from pathlib import Path
import re
import shutil
import time

from core import SCHEMA, SPLITS, digest, local_path, split_for, validate_manifest

REVISION = "0997586b5c177fa8f2c0a61eb7f958ab18605362"
SOURCE = "https://github.com/liamhand/ingredient-level-nutrition-regression"
CSV_PIN = "e8f420ccd81c2aa3fa97470d28a2f43a42bdf0a88ba56659c82dfd20c11dbd45"
LICENCE_PIN = "088ec6d5a54123482f9e1cf2ee80f1df12e702cdcd434277d1ea6964f700a40d"
ATTRIBUTION = ("Hand, Camps, da Silva Torres and Salah (2026), Frontiers in Nutrition "
    "13:1927530, doi:10.3389/fnut.2026.1927530; Nutrition5k, Thames et al. "
    "(CVPR 2021). CC BY 4.0, https://creativecommons.org/licenses/by/4.0/. "
    "Changes: image-level visible labels, egg/egg-white union, resized JPEGs and "
    "Shift capture-week splits; no endorsement implied.")
BASELINE_MAP = {"chicken": "poultry", "beef": "meat_red", "fish": "fish",
    "eggs": "eggs", "rice": "rice", "potatoes": "tuber",
    "broccoli": "cruciferous", "cauliflower": "cruciferous",
    "carrots": "root_vegetable", "leafy salad": "leafy_greens",
    "pizza": "pizza", "bacon": "bacon"}


def annotation_groups(csv_path):
    if digest(csv_path) != CSV_PIN:
        raise ValueError("Reviewed annotation CSV pin changed")
    grouped = defaultdict(list)
    identities = set()
    with csv_path.open(newline="") as stream:
        for row in csv.DictReader(stream):
            dish, category = row["dish_id"], row["annotation_name"]
            if not re.fullmatch(r"dish_\d{10}", dish) or not re.fullmatch(r"[a-z_]+", category):
                raise ValueError("Unexpected public identifier or category")
            key = (dish, int(row["label_value"]))
            if key in identities or key[1] <= 0 or int(row["mask_pixels"]) <= 0:
                raise ValueError("Duplicate annotation label or empty visible region")
            if row["mask"] != f"masks/{dish}.png" or row["rgb_image"] != f"rgb_images/{dish}.png":
                raise ValueError("Unexpected annotation path")
            identities.add(key); grouped[dish].append(row)
    if len(grouped) != 1056 or len(identities) != 2922:
        raise ValueError("Reviewed annotation inventory changed")
    return dict(grouped)


def target_labels(rows):
    # Both egg types are pooled, never narrowed to a species or exact recipe.
    return sorted({"eggs" if r["annotation_name"] in ("egg", "egg_whites")
                   else r["annotation_name"] for r in rows})


def check_mask(data, rows):
    from PIL import Image
    with Image.open(io.BytesIO(data)) as image:
        if image.size != (640, 480) or image.mode not in ("L", "P"):
            raise ValueError("Expected original 640x480 indexed mask")
        observed = dict(Counter(image.get_flattened_data()))
    expected = {int(r["label_value"]): int(r["mask_pixels"]) for r in rows}
    observed.pop(0, None)
    if observed != expected:
        raise ValueError("Mask labels or pixel counts differ from pinned annotations")
    return hashlib.sha256(data).hexdigest()


def prepare(args):
    from PIL import Image, ImageOps
    from prepare import Downloader
    groups = annotation_groups(args.annotations / "ingredient_nutrition.csv")
    if digest(args.annotations / "LICENSE-DATA") != LICENCE_PIN:
        raise ValueError("Reviewed attribution licence changed")
    # The metadata preserves identity/splits even if transient RGB caches were
    # pruned. Missing bytes are recovered only from the same pinned public source.
    previous = validate_manifest(args.reuse_manifest, verify_files=False)
    reused = {r["id"]: r for r in previous["samples"]}
    args.output.mkdir(parents=True, exist_ok=args.resume)
    (args.output / "images").mkdir(exist_ok=args.resume); (args.output / "masks").mkdir(exist_ok=args.resume)
    (args.output / "receipts").mkdir(exist_ok=args.resume)
    downloader = Downloader(args.max_download_mb * 1_000_000)

    def image_row(dish):
        group = "nutrition5k:capture-week:" + str(int(dish[5:]) // 604800)
        split = split_for(group)
        url = ("https://storage.googleapis.com/nutrition5k_dataset/nutrition5k_dataset/"
               f"imagery/realsense_overhead/{dish}/rgb.png")
        relative = f"images/{dish}.jpg"; path = args.output / relative
        mask_path = args.output / "masks" / f"{dish}.png"
        receipt = args.output / "receipts" / f"{dish}.json"
        if args.resume and receipt.is_file():
            row = json.loads(receipt.read_text())
            if (row.get("id"), row.get("group_id"), row.get("split"), row.get("labels"), row.get("source_url")) != (dish, group, split, target_labels(groups[dish]), url):
                raise ValueError("Resume receipt differs from pinned source")
            if digest(path) != row["sha256"] or check_mask(mask_path.read_bytes(), groups[dish]) != row["mask_sha256"]:
                raise ValueError("Resume bytes changed")
            return row
        old = reused.get(dish)
        if old is not None:
            if (old["split"], old["group_id"], old["source_url"]) != (split, group, url):
                raise ValueError("Existing split or source changed")
        if old is not None and (args.reuse_manifest.parent / old["path"]).is_file():
            shutil.copyfile(local_path(args.reuse_manifest.parent, old["path"]), path)
            if digest(path) != old["sha256"]:
                raise ValueError("Existing image bytes changed")
            original_pin = old["original_sha256"]
        else:
            raw = downloader.read(url, limit=2_000_000)
            original_pin = hashlib.sha256(raw).hexdigest()
            if old is not None and original_pin != old["original_sha256"]:
                raise ValueError("Recovered public RGB changed")
            with Image.open(io.BytesIO(raw)) as source:
                if source.size != (640, 480):
                    raise ValueError("Original RGB and mask dimensions differ")
                image = ImageOps.exif_transpose(source).convert("RGB")
                image.thumbnail((384, 384)); image.save(path, "JPEG", quality=90)
            if old is not None and digest(path) != old["sha256"]:
                raise ValueError("Recovered JPEG differs from existing experiment")
        mask = ((args.mask_directory / f"{dish}.png").read_bytes() if args.mask_directory else
            downloader.read(f"https://raw.githubusercontent.com/liamhand/ingredient-level-nutrition-regression/{REVISION}/data/masks/{dish}.png", limit=200_000))
        mask_pin = check_mask(mask, groups[dish])
        mask_path.write_bytes(mask)
        row = {"id": dish, "group_id": group, "split": split,
            "labels": target_labels(groups[dish]), "path": relative, "sha256": digest(path),
            "original_sha256": original_pin, "source_url": url,
            "mask_sha256": mask_pin, "licence": "CC-BY-4.0", "attribution": ATTRIBUTION}
        receipt.write_text(json.dumps(row, indent=2) + "\n")
        return row

    rows = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        for row in pool.map(image_row, sorted(groups)):
            rows.append(row)
            if len(rows) % 100 == 0:
                print(json.dumps({"stage": "visible_data", "checked": len(rows), "total": len(groups)}), flush=True)
    manifest = {"schema": SCHEMA, "data_kind": "real_public_research", "source": SOURCE,
        "source_revision": REVISION, "licence": "CC-BY-4.0", "attribution": ATTRIBUTION,
        "annotation_csv_sha256": CSV_PIN, "annotation_licence_sha256": LICENCE_PIN,
        "labels": sorted({label for row in rows for label in row["labels"]}),
        "split_method": "Existing disjoint capture weeks, including all previous samples; publisher CSV splits ignored",
        "reused_manifest_sha256": digest(args.reuse_manifest), "reused_images": sum(r["id"] in reused for r in rows),
        "downloaded_bytes": downloader.used, "mask_checks": {"checked": len(rows), "pixel_counts": True,
            "manual_quality_review": "Eight earlier samples only; full annotation quality not independently adjudicated"},
        "limitations": ["US cafeteria meals, not UK field acceptance", "Coarse categories do not identify exact recipes or hidden ingredients",
            "No real non-food benchmark", "No portion or nutrient prediction", "Public annotation quality not fully independently adjudicated",
            "Development subset of test images previously inspected; not a fresh acceptance benchmark"], "samples": rows}
    (args.output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    (args.output / "ATTRIBUTION.txt").write_text(ATTRIBUTION + "\n" + SOURCE + "\n")
    shutil.copyfile(args.annotations / "LICENSE-DATA", args.output / "ANNOTATION-LICENSE")
    validate_manifest(args.output / "manifest.json")
    print(json.dumps({"prepared": len(rows), "counts": dict(Counter(r["split"] for r in rows)), "bytes": downloader.used}), flush=True)


def baseline_decisions(scores, labels, thresholds, common):
    result = []
    for row in scores:
        predicted = {BASELINE_MAP[label] for label, p, t in zip(labels, row, thresholds) if p >= t}
        result.append([int(label in predicted) for label in common])
    return result


def stream_features(args):
    """Cache frozen, label-independent embeddings while public RGBs arrive."""
    import numpy as np
    from PIL import Image
    import torch
    from semantic_model import encoder, view_tensors, WEIGHT_SHA256
    torch.set_num_threads(4)
    model, _ = encoder(args.base)
    expected = set(annotation_groups(args.annotations / "ingredient_nutrition.csv"))
    args.output.mkdir(parents=True, exist_ok=False)
    deadline = time.monotonic() + args.max_minutes * 60
    finished = set()
    while len(finished) < len(expected):
        if time.monotonic() > deadline:
            raise TimeoutError("Bounded incremental feature extraction expired")
        ready = sorted(p.stem for p in (args.data / "receipts").glob("*.json") if p.stem in expected - finished)
        if not ready:
            time.sleep(2)
            continue
        for offset in range(0, len(ready), 4):
            if time.monotonic() > deadline:
                raise TimeoutError("Bounded incremental feature extraction expired")
            batch = ready[offset:offset + 4]; pixels = []; rows = []
            for dish in batch:
                row = json.loads((args.data / "receipts" / f"{dish}.json").read_text())
                path = local_path(args.data, row["path"])
                if row["id"] != dish or digest(path) != row["sha256"]:
                    raise ValueError("Streaming source changed")
                with Image.open(path) as image:
                    pixels.append(view_tensors(image))
                rows.append(row)
            with torch.inference_mode():
                vectors = model(pixel_values=torch.cat(pixels)).pooler_output.reshape(len(batch), -1).numpy()
            for dish, row, vector in zip(batch, rows, vectors):
                path = args.output / f"{dish}.npy"; np.save(path, vector, allow_pickle=False)
                receipt = {"image_sha256": row["sha256"], "base_weight_sha256": WEIGHT_SHA256,
                    "preprocess": "semantic_model.view_tensors/full-and-centre-three-quarters-v1",
                    "sha256": digest(path)}
                (args.output / f"{dish}.json").write_text(json.dumps(receipt) + "\n")
                finished.add(dish)
            if len(finished) % 100 < 4:
                print(json.dumps({"stage": "streamed_features", "images": len(finished), "total": len(expected)}), flush=True)
    print(json.dumps({"stage": "features_complete", "images": len(finished), "label_independent": True}), flush=True)


def cached_features(rows, directory):
    import numpy as np
    import torch
    from semantic_model import WEIGHT_SHA256
    values = []
    for row in rows:
        path = directory / f"{row['id']}.npy"
        receipt = json.loads((directory / f"{row['id']}.json").read_text())
        if (receipt.get("image_sha256"), receipt.get("base_weight_sha256"), receipt.get("preprocess"), receipt.get("sha256")) != (
            row["sha256"], WEIGHT_SHA256, "semantic_model.view_tensors/full-and-centre-three-quarters-v1", digest(path)):
            raise ValueError("Frozen feature cache differs from pinned input/base/preprocessing")
        value = np.load(path, allow_pickle=False)
        if value.shape != (1536,) or value.dtype != np.float32 or not np.isfinite(value).all():
            raise ValueError("Invalid frozen feature cache")
        values.append(torch.from_numpy(value.copy()))
    return torch.stack(values)


def train(args):
    import numpy as np
    import torch
    from safetensors.torch import load_file, save_file
    from core import metrics, release_blockers
    from semantic_model import FoodHead, PREPROCESS, WEIGHT_SHA256, MODEL_ID, REVISION as BASE_REVISION, encoder, features, fit_head
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    torch.set_num_threads(4); torch.use_deterministic_algorithms(True)
    manifest = validate_manifest(args.manifest)
    if manifest.get("annotation_csv_sha256") != CSV_PIN or manifest.get("source_revision") != REVISION:
        raise ValueError("Pinned visible annotation manifest required")
    if args.output.exists():
        raise ValueError("New research candidate directory required")
    args.output.mkdir(parents=True)
    labels = manifest["labels"]
    splits = {s: [r for r in manifest["samples"] if r["split"] == s] for s in SPLITS}
    model, source = encoder(args.base)
    xs, ys = {}, {}
    for split in ("train", "validation"):
        xs[split] = (cached_features(splits[split], args.feature_cache) if args.feature_cache else
            features(model, splits[split], args.manifest.parent, deadline))
        ys[split] = torch.tensor([[int(l in r["labels"]) for l in labels] for r in splits[split]], dtype=torch.float32)
    width = xs["train"].shape[1] // 2
    candidates = []
    # Predeclared comparison, validation-only selection, unchanged calibration.
    for views in (1, 2):
        head, thresholds, result, epoch = fit_head(xs["train"][:, :width * views], ys["train"],
            xs["validation"][:, :width * views], ys["validation"], labels, deadline)
        candidates.append((result["micro_f1"], -views, head, thresholds, result, epoch))
        print(json.dumps({"stage": "visible_validation", "views": views, "metrics": result}), flush=True)
    _, minus_views, head, thresholds, validation, epoch = max(candidates, key=lambda c: c[:2])
    views = -minus_views
    # Test targets and predictions are used only after choosing weights and
    # thresholds. The frozen label-independent image cache may be built earlier.
    xs["test"] = (cached_features(splits["test"], args.feature_cache) if args.feature_cache else
        features(model, splits["test"], args.manifest.parent, deadline))
    targets = [[int(l in r["labels"]) for l in labels] for r in splits["test"]]
    old_artifact = json.loads((args.baseline / "artifact.json").read_text())
    if old_artifact.get("model_family") != "shift-siglip-food-head-1":
        raise ValueError("Expected pinned existing semantic head")
    for name, pin in old_artifact["files"].items():
        if digest(local_path(args.baseline, name)) != pin:
            raise ValueError("Existing baseline bytes changed")
    old_meta = json.loads((args.baseline / "head.json").read_text())
    old = FoodHead(old_meta["width"], len(old_meta["labels"]))
    old.load_state_dict(load_file(args.baseline / "head.safetensors")); old.eval()
    with torch.no_grad():
        scores = torch.sigmoid(head(xs["test"][:, :width * views])).tolist()
        old_scores = torch.sigmoid(old(xs["test"][:, :old_meta["width"]])).tolist()
    common = sorted(set(BASELINE_MAP.values()) & set(labels))
    indices = [labels.index(label) for label in common]
    common_y = [[row[j] for j in indices] for row in targets]
    old_decisions = baseline_decisions(old_scores, old_meta["labels"], old_meta["thresholds"], common)
    new_common = [[row[j] for j in indices] for row in scores]
    common_thresholds = [thresholds[j] for j in indices]
    by_week = []
    for group in sorted({r["group_id"] for r in splits["test"]}):
        offsets = [i for i, r in enumerate(splits["test"]) if r["group_id"] == group]
        y = [common_y[i] for i in offsets]
        by_week.append({"capture_group": group, "images": len(offsets),
            "baseline": metrics([old_decisions[i] for i in offsets], y, [.5] * len(common), common),
            "candidate": metrics([new_common[i] for i in offsets], y, common_thresholds, common)})
    report = {"schema": SCHEMA, "candidate": args.output.name, "model_family": "shift-visible-food-head-1",
        "created_utc": datetime.now(timezone.utc).isoformat(), "data_kind": manifest["data_kind"],
        "source_manifest_sha256": digest(args.manifest), "labels": labels, "thresholds": thresholds,
        "disabled_classes": [l for l, t in zip(labels, thresholds) if t > 1],
        "base": {"id": MODEL_ID, "revision": BASE_REVISION, "weight_sha256": WEIGHT_SHA256, "licence": "Apache-2.0"},
        "annotations": {"source": SOURCE, "revision": REVISION, "csv_sha256": CSV_PIN, "licence": "CC-BY-4.0", "attribution": ATTRIBUTION},
        "training": {"method": "Shift visible-food linear head on frozen SigLIP; whole-image inputs, no masks at inference",
            "encoder_updated": False, "trained_from_scratch": False, "selected_views": views, "selected_epoch": epoch,
            "selection": "Highest validation micro F1; existing minimum 5 predictions and 85% validation precision per-class rule",
            "trainable_parameters": sum(p.numel() for p in head.parameters()),
            "split_images": {s: len(rows) for s, rows in splits.items()}, "cpu_threads": 4,
            "split_capture_weeks": {s: len({r["group_id"] for r in rows}) for s, rows in splits.items()},
            "seconds": round(time.monotonic() - start, 2), "seconds_scope": "Loading and head fitting; streamed frozen feature extraction is separate",
            "feature_cache_used": args.feature_cache is not None, "new_paid_services": False},
        "validation": validation, "validation_candidates": [{"views": -c[1], "metrics": c[4]} for c in candidates],
        "test": metrics(scores, targets, thresholds, labels),
        "same_images_shared_categories": {"labels": common,
            "comparison": "Both heads, same JPEGs, pinned original thresholds; narrow old labels mapped to containing coarse category; egg types unioned",
            "baseline": metrics(old_decisions, common_y, [.5] * len(common), common),
            "candidate": metrics(new_common, common_y, common_thresholds, common),
            "by_capture_week": by_week},
        "test_previously_inspected": True, "non_food_test": None, "production_privacy_reviewed": False,
        "production_ready": False, "limitations": manifest["limitations"] + ["Broader categories cannot be claimed as exact ingredients", "No gate applied to either head in this comparison"]}
    report["release_blockers"] = release_blockers(report)
    save_file(head.state_dict(), args.output / "head.safetensors")
    (args.output / "head.json").write_text(json.dumps({"family": "shift-visible-food-head-1", "width": width * views,
        "views": views, "preprocess": PREPROCESS, "labels": labels, "thresholds": thresholds}, indent=2) + "\n")
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    (args.output / "base-source.json").write_text(json.dumps(source, indent=2) + "\n")
    shutil.copyfile(args.base / "LICENSE", args.output / "BASE-LICENSE")
    (args.output / "ATTRIBUTION.txt").write_text(ATTRIBUTION + "\n" + SOURCE + "\n")
    shutil.copyfile(args.manifest, args.output / "research-manifest.json")
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": r["id"], "targets": y, "scores": p} for r, y, p in zip(splits["test"], targets, scores)], indent=2) + "\n")
    # Reproducible development cache, keyed to exact images/manifest. Not model acceptance.
    np.savez_compressed(args.output / "development-features.npz", **{s: xs[s].numpy() for s in SPLITS})
    pins = {p.name: digest(p) for p in args.output.iterdir() if p.is_file() and p.suffix != ".npz"}
    (args.output / "artifact.json").write_text(json.dumps({"schema": SCHEMA,
        "model_family": "shift-visible-food-head-1", "status": "research_candidate_only",
        "files": pins, "base_weights_embedded": False}, indent=2) + "\n")
    print(json.dumps({"stage": "complete", "report": str(args.output / "evaluation.json"), "test": report["test"],
        "comparison": report["same_images_shared_categories"]}), flush=True)


def load_visible_predictor(directory, base, *, research=False):
    """Explicit separate research loader; existing runtime candidate unchanged."""
    if not research:
        raise ValueError("Visible-food candidate remains research only")
    if json.loads((directory / "artifact.json").read_text()).get("model_family") == "shift-visible-food-routed-1":
        from routed_learning import load_routed_predictor
        return load_routed_predictor(directory, base, research=True)
    import torch
    from safetensors.torch import load_file
    from semantic_model import SemanticPredictor, FoodHead, PREPROCESS, encoder
    pins = json.loads((directory / "artifact.json").read_text())
    required = {"head.json", "head.safetensors", "evaluation.json", "base-source.json", "research-manifest.json", "ATTRIBUTION.txt", "BASE-LICENSE", "test-predictions.json"}
    if (pins.get("model_family"), pins.get("status")) != ("shift-visible-food-head-1", "research_candidate_only") or set(pins.get("files", {})) != required:
        raise ValueError("Complete pinned visible-food research candidate required")
    for name, pin in pins["files"].items():
        if digest(local_path(directory, name)) != pin:
            raise ValueError("Visible candidate bytes changed")
    settings = json.loads((directory / "head.json").read_text())
    report = json.loads((directory / "evaluation.json").read_text())
    if settings.get("family") != "shift-visible-food-head-1" or settings.get("preprocess") != PREPROCESS or settings.get("views") not in (1, 2) or settings.get("width") != 768 * settings["views"]:
        raise ValueError("Known whole-image preprocessing required")
    if settings["labels"] != report["labels"] or settings["thresholds"] != report["thresholds"] or report.get("production_ready") is not False:
        raise ValueError("Candidate contract differs from research evaluation")
    if digest(directory / "research-manifest.json") != report["source_manifest_sha256"]:
        raise ValueError("Training provenance differs from evaluation")
    torch.set_num_threads(4)
    model, source = encoder(base)
    if source != json.loads((directory / "base-source.json").read_text()):
        raise ValueError("Wrong visual base")
    # Reuse the existing strict image/request and response contract, after the
    # distinct candidate family and all artefact bytes have been checked here.
    predictor = SemanticPredictor.__new__(SemanticPredictor)
    predictor.settings = settings; predictor.report = report; predictor.model = model
    predictor.head = FoodHead(settings["width"], len(settings["labels"]))
    predictor.head.load_state_dict(load_file(directory / "head.safetensors"), strict=True)
    predictor.head.eval()
    return predictor


class VisibleGatedPredictor:
    """Same research transport and fixed rejection gate, new pinned food head."""
    def __init__(self, candidate, base, gate, *, research=False):
        from food_gate import FoodGate
        self.model = load_visible_predictor(candidate, base, research=research)
        self.gate = FoodGate(gate)

    def inspect(self, request):
        from core import food_response
        features = self.model.encode(request)
        decision = self.gate.inspect(features)
        scores = self.model.score_features(features)
        response = food_response(scores, self.model.settings["labels"], self.model.settings["thresholds"]) if decision["accept"] else {"items": [], "nutrition": {}}
        return response, decision, scores

    def recognise(self, request):
        return self.inspect(request)[0]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    p = commands.add_parser("prepare")
    p.add_argument("--annotations", type=Path, required=True); p.add_argument("--reuse-manifest", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True); p.add_argument("--max-download-mb", type=int, required=True, choices=range(1, 501))
    p.add_argument("--mask-directory", type=Path); p.add_argument("--resume", action="store_true")
    t = commands.add_parser("train")
    for name in ("manifest", "base", "baseline", "output"):
        t.add_argument("--" + name, type=Path, required=True)
    t.add_argument("--max-minutes", type=int, required=True, choices=range(1, 31))
    t.add_argument("--feature-cache", type=Path)
    f = commands.add_parser("stream-features")
    for name in ("base", "annotations", "data", "output"):
        f.add_argument("--" + name, type=Path, required=True)
    f.add_argument("--max-minutes", type=int, required=True, choices=range(1, 31))
    args = parser.parse_args()
    if args.command == "prepare": prepare(args)
    elif args.command == "stream-features": stream_features(args)
    else: train(args)
