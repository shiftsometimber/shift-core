"""Bounded, validation-selected own-head ablation on existing public features.

Four predeclared variants; never choose weights, thresholds or architecture from
test results. This does not provision a service or accept any member photo.
"""
import argparse
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import time

from core import SCHEMA, calibrate, digest, metrics, release_blockers, validate_manifest
from visible_learning import cached_features

CONFIGS = (("linear_sqrt", 0, .5), ("linear_ratio", 0, 1.),
           ("mlp128_sqrt", 128, .5), ("mlp128_ratio", 128, 1.))


def seal(directory, incumbent, manifest):
    """Attach the same verified public-data/base provenance to saved weights."""
    from semantic_model import PREPROCESS
    meta = json.loads((directory / "head.json").read_text())
    meta.update(family="shift-balanced-food-head-1", preprocess=PREPROCESS)
    (directory / "head.json").write_text(json.dumps(meta, indent=2) + "\n")
    for name in ("base-source.json", "BASE-LICENSE", "ATTRIBUTION.txt"):
        shutil.copyfile(incumbent / name, directory / name)
    shutil.copyfile(manifest, directory / "research-manifest.json")
    pins = {p.name: digest(p) for p in directory.iterdir() if p.is_file() and p.name != "artifact.json"}
    (directory / "artifact.json").write_text(json.dumps({"schema": SCHEMA, "model_family": "shift-balanced-food-head-1",
        "status": "research_candidate_only", "files": pins, "base_weights_embedded": False}, indent=2) + "\n")


def architecture(width, labels, hidden):
    import torch

    class BalancedHead(torch.nn.Module):
        def __init__(self):
            super().__init__()
            self.register_buffer("mean", torch.zeros(width)); self.register_buffer("std", torch.ones(width))
            self.network = (torch.nn.Sequential(torch.nn.Linear(width, hidden), torch.nn.GELU(),
                torch.nn.Dropout(.2), torch.nn.Linear(hidden, labels)) if hidden else torch.nn.Linear(width, labels))

        def forward(self, values):
            return self.network((values - self.mean) / self.std)

    return BalancedHead()


def run(args):
    import torch
    from safetensors.torch import load_file, save_file
    torch.set_num_threads(4); torch.use_deterministic_algorithms(True)
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    manifest = validate_manifest(args.manifest)
    incumbent = json.loads((args.incumbent / "evaluation.json").read_text())
    if digest(args.manifest) != incumbent["source_manifest_sha256"]:
        raise ValueError("Exact same visible dataset required")
    labels = manifest["labels"]
    rows = {s: [r for r in manifest["samples"] if r["split"] == s] for s in ("train", "validation", "test")}
    x = {s: cached_features(rows[s], args.feature_cache)[:, :768] for s in ("train", "validation")}
    y = {s: torch.tensor([[int(l in r["labels"]) for l in labels] for r in rows[s]], dtype=torch.float32) for s in x}
    candidates = []
    for name, hidden, power in CONFIGS:
        torch.manual_seed(20261101)
        head = architecture(768, len(labels), hidden)
        head.mean.copy_(x["train"].mean(0)); head.std.copy_(x["train"].std(0).clamp_min(.05))
        positives = y["train"].sum(0)
        weights = ((len(y["train"]) - positives) / positives.clamp_min(1)).pow(power).clamp(1, 10)
        loss = torch.nn.BCEWithLogitsLoss(pos_weight=weights)
        validation_loss = torch.nn.BCEWithLogitsLoss()
        optimiser = torch.optim.AdamW(head.parameters(), lr=.001, weight_decay=.03)
        best, best_loss, epoch_best = None, float("inf"), 0
        for epoch in range(200):
            if time.monotonic() > deadline:
                raise TimeoutError("Bounded own-head experiment exceeded computation budget")
            head.train()
            for indices in torch.randperm(len(x["train"])).split(64):
                optimiser.zero_grad(); loss(head(x["train"][indices]), y["train"][indices]).backward(); optimiser.step()
            head.eval()
            with torch.no_grad():
                value = float(validation_loss(head(x["validation"]), y["validation"]))
            if value < best_loss:
                best, best_loss, epoch_best = copy.deepcopy(head.state_dict()), value, epoch + 1
            if epoch + 1 - epoch_best >= 15:
                break
        head.load_state_dict(best); head.eval()
        with torch.no_grad():
            scores = torch.sigmoid(head(x["validation"])).tolist()
        thresholds = calibrate(scores, y["validation"].int().tolist(), labels)
        validation = metrics(scores, y["validation"].int().tolist(), thresholds, labels)
        candidate = {"name": name, "hidden": hidden, "positive_weight_power": power,
            "selected_epoch": epoch_best, "validation": validation, "thresholds": thresholds,
            "parameters": sum(p.numel() for p in head.parameters())}
        candidates.append((candidate, head))
        print(json.dumps({"stage": "validation", "name": name,
            "precision": validation["micro_precision"], "recall": validation["micro_recall"], "f1": validation["micro_f1"]}), flush=True)
    # All four architectures and thresholds are fixed before test evaluation.
    chosen, head = max(candidates, key=lambda v: (v[0]["validation"]["micro_f1"], -v[0]["parameters"]))
    test_x = cached_features(rows["test"], args.feature_cache)[:, :768]
    test_y = [[int(l in r["labels"]) for l in labels] for r in rows["test"]]
    with torch.no_grad():
        scores = torch.sigmoid(head(test_x)).tolist()
    result = metrics(scores, test_y, chosen["thresholds"], labels)
    report = {"schema": SCHEMA, "candidate": args.output.name, "model_family": "shift-balanced-food-head-1",
        "created_utc": datetime.now(timezone.utc).isoformat(), "source_manifest_sha256": digest(args.manifest),
        "data_kind": manifest["data_kind"], "labels": labels, "thresholds": chosen["thresholds"],
        "training": {"selected": chosen, "variants": [v[0] for v in candidates],
            "selection": "Maximum validation micro F1, ties to smaller head; no test selection",
            "cpu_threads": 4, "seconds": time.monotonic() - start, "encoder_updated": False,
            "source_features": "Same pinned full-image frozen SigLIP; no masks needed at inference", "new_paid_services": False},
        "validation": chosen["validation"], "test": result,
        "same_39_category_incumbent": incumbent["test"],
        "test_previously_inspected": True, "non_food_test": None, "production_privacy_reviewed": False,
        "production_ready": False, "promoted": False,
        "limitations": manifest["limitations"] + ["Public development ablation, not fresh UK acceptance", "Standalone head has not been integrated into the photo worker"]}
    report["release_blockers"] = release_blockers(report)
    args.output.mkdir(parents=True, exist_ok=False)
    save_file(head.state_dict(), args.output / "head.safetensors")
    settings = {"width": 768, "labels": labels, "hidden": chosen["hidden"], "views": 1, "thresholds": chosen["thresholds"]}
    (args.output / "head.json").write_text(json.dumps(settings, indent=2) + "\n")
    # Saved head must reproduce every test score; no extra model choice follows.
    restored = architecture(768, len(labels), chosen["hidden"])
    restored.load_state_dict(load_file(args.output / "head.safetensors"), strict=True); restored.eval()
    with torch.no_grad():
        restored_scores = torch.sigmoid(restored(test_x)).tolist()
    difference = max(abs(a - b) for p, q in zip(scores, restored_scores) for a, b in zip(p, q))
    if difference > .000001:
        raise AssertionError("Saved own-head weights changed predictions")
    report["saved_head_roundtrip"] = {"images": len(test_y), "maximum_score_difference": difference,
        "scope": "Frozen JPEG-derived feature cache; not a new worker/camera acceptance check"}
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": r["id"], "targets": y, "scores": p} for r, y, p in zip(rows["test"], test_y, scores)], indent=2) + "\n")
    seal(args.output, args.incumbent, args.manifest)
    print(json.dumps({"stage": "complete", "selected": chosen["name"], "test_precision": result["micro_precision"],
        "test_recall": result["micro_recall"], "test_f1": result["micro_f1"], "incumbent_f1": incumbent["test"]["micro_f1"],
        "promoted": False}), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("manifest", "feature-cache", "incumbent", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--max-minutes", type=int, required=True, choices=range(1, 16))
    run(parser.parse_args())
