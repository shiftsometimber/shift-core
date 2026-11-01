"""Four fixed regional heads, one frozen visual encoder, validation-only pooling.

Members are fixed before execution: existing candidate 10 plus seeds 20261102-4.
No test-ranked member selection, new service, photo upload or production change.
"""
import argparse
import copy
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys

from core import SCHEMA, calibrate, digest, metrics, release_blockers, validate_manifest


def mark(path, **value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps({"pid": os.getpid(), **value}, indent=2) + "\n"); temporary.replace(path)


def build(args):
    import numpy as np
    import torch
    from safetensors.torch import load_file, save_file
    from spatial_features import read
    from spatial_model import architecture, pooled_scores, ENSEMBLE_FAMILY
    torch.set_num_threads(4)
    members = [args.initial]
    progress = args.progress_path or args.work / "results/spatial-ensemble-progress.json"
    for number, seed in zip(range(args.start_member, args.start_member + 3), range(args.seed_start, args.seed_start + 3)):
        destination = args.work / ("shift-spatial-candidate-" + str(number))
        if destination.exists():
            raise ValueError("New ensemble member directory required; no implicit replay")
        mark(progress, stage="training_member", member=number, seed=seed, completed_members=len(members), total_members=4,
            production_ready=False)
        command = [sys.executable, str(Path(__file__).with_name("spatial_model.py")),
            "--manifest", str(args.manifest), "--feature-cache", str(args.feature_cache),
            "--annotations", str(args.annotations), "--incumbent", str(args.incumbent), "--output", str(destination),
            "--hidden", "128", "--image-weight", "0.2", "--seed", str(seed), "--max-minutes", "8"]
        if args.aux_manifest:
            command += ["--aux-manifest", str(args.aux_manifest), "--initial-head", str(args.initial)]
        with (args.work / ("results/spatial-member-" + str(number) + ".log")).open("w") as log:
            result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, timeout=9 * 60)
        if result.returncode:
            mark(progress, stage="failed", member=number, exit_code=result.returncode, production_ready=False)
            raise RuntimeError("Regional ensemble member failed; receipt retained")
        members.append(destination)
    mark(progress, stage="validation_selection", completed_members=4, total_members=4, production_ready=False)
    manifest = validate_manifest(args.manifest)
    report = json.loads((members[0] / "evaluation.json").read_text()); labels = report["labels"]
    aux_pin = report.get("training", {}).get("auxiliary_manifest_sha256")
    head = architecture(len(labels) + 1, 128, 4)
    for index, member in enumerate(members):
        art = json.loads((member / "artifact.json").read_text())
        for name, pin in art["files"].items():
            if digest(member / name) != pin:
                raise ValueError("Source regional member bytes changed")
        settings = json.loads((member / "head.json").read_text())
        if settings["labels"] != labels or settings.get("hidden") != 128 or (member / "base-source.json").read_bytes() != (members[0] / "base-source.json").read_bytes():
            raise ValueError("Same spatial/base contract required across all fixed members")
        if json.loads((member / "evaluation.json").read_text())["source_manifest_sha256"] != digest(args.manifest):
            raise ValueError("All members need the exact same training split")
        if json.loads((member / "evaluation.json").read_text()).get("training", {}).get("auxiliary_manifest_sha256") != aux_pin:
            raise ValueError("All members must preserve the same auxiliary-data provenance")
        head.heads[index].load_state_dict(load_file(member / "head.safetensors"), strict=True)
    head.eval()
    rows = {s: [r for r in manifest["samples"] if r["split"] == s] for s in ("validation", "test")}
    validation_x = torch.from_numpy(np.stack([read(r, args.feature_cache) for r in rows["validation"]]))
    validation_y = [[int(l in r["labels"]) for l in labels] for r in rows["validation"]]
    choices = []
    for k in (1, 3, 6):
        scores = pooled_scores(head, validation_x, k); thresholds = calibrate(scores, validation_y, labels)
        result = metrics(scores, validation_y, thresholds, labels); choices.append((result["micro_f1"], -k, thresholds, result))
    _, minus_k, thresholds, validation = max(choices, key=lambda c: c[:2]); k = -minus_k
    mark(progress, stage="fixed_ensemble_development_evaluation", completed_members=4, top_k=k, production_ready=False)
    test_x = torch.from_numpy(np.stack([read(r, args.feature_cache) for r in rows["test"]]))
    test_y = [[int(l in r["labels"]) for l in labels] for r in rows["test"]]
    scores = pooled_scores(head, test_x, k)
    final = copy.deepcopy(report)
    final.update(candidate=args.output.name, model_family=ENSEMBLE_FAMILY, thresholds=thresholds,
        created_utc=datetime.now(timezone.utc).isoformat(), validation=validation,
        test=metrics(scores, test_y, thresholds, labels), disabled_classes=[l for l, t in zip(labels, thresholds) if t > 1],
        training={"method": "Fixed average of four separately seeded own regional heads; no encoder update or test-ranked member choice",
            "source_members": [{"candidate": p.name, "artifact_sha256": digest(p / "artifact.json")} for p in members],
            "member_seeds": [json.loads((p / "evaluation.json").read_text())["training"].get("seed", 20261101) for p in members],
            "unique_training_mask_images": 574,
            "validation_masks_read": 0, "test_masks_read": 0, "encoder_passes_per_photo": 1,
            "pooling_selection": "Maximum validation F1 for fixed top-k 1/3/6, original calibration rule",
            "new_paid_services": False}, promoted=False, production_ready=False)
    if aux_pin:
        final["training"].update(auxiliary_manifest_sha256=aux_pin,
            auxiliary_positive_images=report["training"]["auxiliary_positive_images"],
            auxiliary_unknown_labels_used_as_negatives=False)
    final["limitations"] += ["Multiple initialisations do not create more independent training data", "Same previously inspected development test; no UK acceptance claim"]
    final["release_blockers"] = release_blockers(final)
    args.output.mkdir(parents=True, exist_ok=False)
    save_file(head.state_dict(), args.output / "head.safetensors")
    settings = json.loads((members[0] / "head.json").read_text())
    settings.update(family=ENSEMBLE_FAMILY, ensemble_members=4, thresholds=thresholds, top_k=k)
    (args.output / "head.json").write_text(json.dumps(settings, indent=2) + "\n")
    (args.output / "evaluation.json").write_text(json.dumps(final, indent=2) + "\n")
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": r["id"], "targets": y, "scores": p} for r, y, p in zip(rows["test"], test_y, scores)], indent=2) + "\n")
    for name in ("research-manifest.json", "base-source.json", "BASE-LICENSE", "ATTRIBUTION.txt"):
        shutil.copyfile(members[0] / name, args.output / name)
    if aux_pin:
        shutil.copyfile(members[0] / "auxiliary-data.json", args.output / "auxiliary-data.json")
    pins = {p.name: digest(p) for p in args.output.iterdir() if p.is_file()}
    (args.output / "artifact.json").write_text(json.dumps({"schema": SCHEMA, "model_family": ENSEMBLE_FAMILY,
        "status": "research_candidate_only", "files": pins, "base_weights_embedded": False}, indent=2) + "\n")
    mark(progress, stage="complete", candidate=args.output.name, report=str(args.output / "evaluation.json"),
        precision=final["test"]["micro_precision"], recall=final["test"]["micro_recall"], production_ready=False)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("initial", "manifest", "feature-cache", "annotations", "incumbent", "work", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--aux-manifest", type=Path)
    parser.add_argument("--progress-path", type=Path)
    parser.add_argument("--start-member", type=int, default=12, choices=range(12, 40))
    parser.add_argument("--seed-start", type=int, default=20261102, choices=range(20261102, 20261108))
    build(parser.parse_args())
