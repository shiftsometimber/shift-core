"""Stricter, grouped-validation-only operating point for a trained localiser."""
import argparse
from collections import Counter
import copy
import json
from pathlib import Path
import shutil

from core import digest, metrics, release_blockers, validate_manifest


def grouped_threshold(scores, targets, groups, j):
    eligible = []
    for threshold in (x / 100 for x in range(10, 100, 5)):
        predicted = [i for i, p in enumerate(scores) if p[j] >= threshold]
        true = sum(targets[i][j] for i in predicted)
        distribution = Counter(groups[i] for i in predicted)
        if len(predicted) < 10 or true / len(predicted) < .95 or len(distribution) < 2:
            continue
        unstable = False
        for group, count in distribution.items():
            if count >= 3 and sum(targets[i][j] for i in predicted if groups[i] == group) / count < .8:
                unstable = True
        if not unstable:
            eligible.append((true, -len(predicted), threshold))
    return max(eligible)[2] if eligible else 1.01


def calibrate(args):
    import numpy as np
    import torch
    from safetensors.torch import load_file
    from spatial_model import architecture, pooled_scores
    from spatial_features import read
    torch.set_num_threads(4)
    manifest = validate_manifest(args.manifest)
    report = json.loads((args.source / "evaluation.json").read_text()); settings = json.loads((args.source / "head.json").read_text())
    if digest(args.manifest) != report["source_manifest_sha256"]:
        raise ValueError("Exact visible validation manifest required")
    art = json.loads((args.source / "artifact.json").read_text())
    for name, pin in art["files"].items():
        if digest(args.source / name) != pin:
            raise ValueError("Source localiser bytes changed")
    labels = settings["labels"]
    rows = {s: [r for r in manifest["samples"] if r["split"] == s] for s in ("validation", "test")}
    head = architecture(len(labels) + 1, settings.get("hidden", 0))
    head.load_state_dict(load_file(args.source / "head.safetensors"), strict=True); head.eval()
    validation_x = torch.from_numpy(np.stack([read(r, args.feature_cache) for r in rows["validation"]]))
    validation_y = [[int(l in r["labels"]) for l in labels] for r in rows["validation"]]
    groups = [r["group_id"] for r in rows["validation"]]
    candidates = []
    for k in (1, 3, 6):
        scores = pooled_scores(head, validation_x, k)
        thresholds = [grouped_threshold(scores, validation_y, groups, j) for j in range(len(labels))]
        result = metrics(scores, validation_y, thresholds, labels)
        candidates.append((result["micro_f1"], -k, thresholds, result))
    _, minus_k, thresholds, validation = max(candidates, key=lambda c: c[:2]); k = -minus_k
    test_x = torch.from_numpy(np.stack([read(r, args.feature_cache) for r in rows["test"]]))
    test_y = [[int(l in r["labels"]) for l in labels] for r in rows["test"]]
    test_scores = pooled_scores(head, test_x, k)
    final = copy.deepcopy(report)
    final.update(candidate=args.output.name, thresholds=thresholds, validation=validation,
        test=metrics(test_scores, test_y, thresholds, labels), disabled_classes=[l for l, t in zip(labels, thresholds) if t > 1])
    final["calibration"] = {"method": "At least 10 predictions, 95% validation point precision, at least two capture weeks; >=80% within weeks with >=3 predictions",
        "selection": "Validation F1 across fixed top-k 1/3/6 after grouped screening", "validation_images": len(rows["validation"]),
        "validation_capture_weeks": len(set(groups)), "test_used_to_select": False,
        "warning": "These small-sample point constraints are not 95% confidence or proof of real-world 95%/99.99% accuracy"}
    final["training"]["selected_top_k_patches"] = k
    final["limitations"] += ["Stricter grouped calibration still uses the same small public validation set; not acceptance"]
    final["release_blockers"] = release_blockers(final)
    args.output.mkdir(parents=True, exist_ok=False)
    for name in art["files"]:
        shutil.copyfile(args.source / name, args.output / name)
    settings.update(top_k=k, thresholds=thresholds)
    (args.output / "head.json").write_text(json.dumps(settings, indent=2) + "\n")
    (args.output / "evaluation.json").write_text(json.dumps(final, indent=2) + "\n")
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": r["id"], "targets": y, "scores": p} for r, y, p in zip(rows["test"], test_y, test_scores)], indent=2) + "\n")
    pins = {p.name: digest(p) for p in args.output.iterdir() if p.is_file() and p.name != "artifact.json"}
    art["files"] = pins
    (args.output / "artifact.json").write_text(json.dumps(art, indent=2) + "\n")
    print(json.dumps({"validation": validation, "test": final["test"], "calibration": final["calibration"]}, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("source", "manifest", "feature-cache", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    calibrate(parser.parse_args())
