"""Train a real food classifier, optionally adapting the last visual layers.

Runs locally on CPU; no hosted training or inference. The research candidate is
never automatically installed, published, bound to a Worker or activated.
"""
from __future__ import annotations

import argparse
import copy
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import random
import shutil
import statistics
import time

# These apply before model libraries are imported. Neither inference nor training
# can fetch code, weights, telemetry or a service when given local model files.
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
import numpy as np
from PIL import Image, ImageOps
import torch
from transformers import AutoModelForImageClassification

from core import SCHEMA, SPLITS, calibrate, canonical_hash, digest, local_path, metrics, release_blockers, validate_manifest
from prepare import BASE_ID, BASE_REVISION

PREPROCESS = {"size": 224, "method": "whole-image-letterbox", "resample": "bicubic",
              "padding_rgb": [127, 127, 127], "mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]}


def image_tensor(image):
    image = ImageOps.exif_transpose(image).convert("RGB")
    fitted = ImageOps.pad(image, (224, 224), method=Image.Resampling.BICUBIC, color=(127, 127, 127))
    array = np.asarray(fitted, dtype=np.float32) / 255
    array = (array - np.array(PREPROCESS["mean"], dtype=np.float32)) / np.array(PREPROCESS["std"], dtype=np.float32)
    return torch.from_numpy(array.transpose(2, 0, 1).copy())


def verify_base(directory):
    source = json.loads((directory / "source.json").read_text())
    if source.get("id") != BASE_ID or source.get("revision") != BASE_REVISION or source.get("licence") != "Apache-2.0":
        raise ValueError("Reviewed base identity required")
    for name, pin in source["files"].items():
        if digest(local_path(directory, name)) != pin:
            raise ValueError("Pinned base source changed: " + name)
    return source


def extract_features(model, rows, root, batch_size, deadline):
    result = []
    model.eval()
    with torch.inference_mode():
        for start in range(0, len(rows), batch_size):
            if time.monotonic() >= deadline:
                raise TimeoutError("Explicit local compute time budget reached")
            images = []
            for row in rows[start:start + batch_size]:
                with Image.open(local_path(root, row["path"])) as image:
                    images.append(image_tensor(image))
            outputs = model.base_model(pixel_values=torch.stack(images))
            result.append(outputs.last_hidden_state[:, 0].detach().clone())
    return torch.cat(result)


def targets_for(rows, labels):
    return torch.tensor([[int(label in row["labels"]) for label in labels] for row in rows], dtype=torch.float32)


def train(args):
    started = time.monotonic()
    deadline = started + args.max_minutes * 60
    torch.set_num_threads(args.threads)
    random.seed(args.seed); np.random.seed(args.seed); torch.manual_seed(args.seed)
    torch.use_deterministic_algorithms(True)
    manifest = validate_manifest(args.manifest)
    base = verify_base(args.base)
    if args.output.exists():
        raise ValueError("New candidate directory required; existing evidence is never overwritten")
    labels = manifest["labels"]
    splits = {s: [r for r in manifest["samples"] if r["split"] == s] for s in SPLITS}
    for label in labels:
        if sum(label in r["labels"] for r in splits["train"]) < 3:
            raise ValueError("Insufficient training support for " + label)
    # The current Transformers loader authenticates the legacy ViT tensor-name
    # migration. Its restricted weights-only loader is mandatory. Missing,
    # unexpected or resized tensors are errors, never silently random features.
    model, loading = AutoModelForImageClassification.from_pretrained(args.base, local_files_only=True,
        trust_remote_code=False, use_safetensors=False, weights_only=True, output_loading_info=True)
    if any(loading.get(key) for key in ("missing_keys", "unexpected_keys", "mismatched_keys", "error_msgs")):
        raise ValueError("Incomplete pinned base weight load: " + str(loading))
    hidden = model.classifier.in_features
    model.classifier = torch.nn.Linear(hidden, len(labels))
    model.config.num_labels = len(labels)
    model.config.id2label = dict(enumerate(labels))
    model.config.label2id = {label: i for i, label in enumerate(labels)}
    model.config.problem_type = "multi_label_classification"
    for parameter in model.base_model.parameters():
        parameter.requires_grad = False
    train_y = targets_for(splits["train"], labels)
    validation_y = targets_for(splits["validation"], labels)
    feature_started = time.monotonic()
    if args.strategy == "frozen-head":
        train_x = extract_features(model, splits["train"], args.manifest.parent, args.batch_size, deadline).clone()
        validation_x = extract_features(model, splits["validation"], args.manifest.parent, args.batch_size, deadline).clone()
        forward = model.classifier
        optimiser = torch.optim.AdamW(model.classifier.parameters(), lr=.01, weight_decay=.01)
        loss_function = torch.nn.BCEWithLogitsLoss()
    else:
        # Learn the new food head before allowing its gradients to alter visual
        # layers. A random head must not immediately distort pretrained features.
        warm_x = extract_features(model, splits["train"], args.manifest.parent, args.batch_size, deadline).clone()
        warm_optimiser = torch.optim.AdamW(model.classifier.parameters(), lr=.005, weight_decay=.01)
        warm_loss = torch.nn.BCEWithLogitsLoss()
        for _ in range(10):
            for batch in torch.randperm(len(warm_x)).split(64):
                warm_optimiser.zero_grad()
                warm_loss(model.classifier(warm_x[batch]), train_y[batch]).backward()
                warm_optimiser.step()
        del warm_x
        layers = getattr(model.base_model, "layers", None)
        if layers is None:
            layers = model.base_model.encoder.layer
        for layer in layers[-2:]:
            for parameter in layer.parameters():
                parameter.requires_grad = True
        for parameter in model.base_model.layernorm.parameters():
            parameter.requires_grad = True
        def pixels(rows):
            values = []
            for row in rows:
                with Image.open(local_path(args.manifest.parent, row["path"])) as image:
                    values.append(image_tensor(image))
            return torch.stack(values)
        train_x, validation_x = pixels(splits["train"]), pixels(splits["validation"])
        forward = lambda x: model(pixel_values=x).logits
        optimiser = torch.optim.AdamW([
            {"params": [p for p in model.base_model.parameters() if p.requires_grad], "lr": .00003},
            {"params": model.classifier.parameters(), "lr": .0005}], weight_decay=.01)
        positive = train_y.sum(0)
        loss_function = torch.nn.BCEWithLogitsLoss(pos_weight=((len(train_y) - positive) / positive.clamp_min(1)).clamp_max(5))
    print(json.dumps({"stage": "real_image_training_inputs", "strategy": args.strategy,
                      "train": len(train_x), "validation": len(validation_x),
                      "seconds": round(time.monotonic() - feature_started, 2)}), flush=True)
    best_loss, best_state, best_epoch = math.inf, None, 0
    history = []
    for epoch in range(args.epochs):
        if time.monotonic() >= deadline:
            raise TimeoutError("Explicit local compute time budget reached")
        order = torch.randperm(len(train_x))
        model.train()
        batch_size = 64 if args.strategy == "frozen-head" else args.batch_size
        for batch in order.split(batch_size):
            if time.monotonic() >= deadline:
                raise TimeoutError("Explicit local compute time budget reached")
            optimiser.zero_grad()
            inputs = train_x[batch]
            if args.strategy != "frozen-head" and random.random() < .5:
                inputs = inputs.flip(-1)
            loss = loss_function(forward(inputs), train_y[batch])
            loss.backward(); optimiser.step()
        model.eval()
        with torch.no_grad():
            validation_logits = torch.cat([forward(batch) for batch in validation_x.split(batch_size)])
            validation_loss = float(loss_function(validation_logits, validation_y))
        history.append(validation_loss)
        if validation_loss < best_loss:
            best_loss, best_state, best_epoch = validation_loss, copy.deepcopy(model.state_dict()), epoch + 1
        if args.strategy != "frozen-head":
            print(json.dumps({"stage": "epoch", "epoch": epoch + 1, "validation_bce": round(validation_loss, 6)}), flush=True)
        if epoch + 1 - best_epoch >= args.patience:
            break
    model.load_state_dict(best_state, strict=True)
    model.eval()
    with torch.no_grad():
        validation_scores = torch.sigmoid(torch.cat([forward(batch) for batch in validation_x.split(batch_size)])).tolist()
    # The untouched test split is first interpreted after model selection and
    # validation-only threshold calibration. It never selects an epoch/threshold.
    thresholds = calibrate(validation_scores, validation_y.int().tolist(), labels)
    test_x = extract_features(model, splits["test"], args.manifest.parent, args.batch_size, deadline)
    test_y = targets_for(splits["test"], labels).int().tolist()
    with torch.no_grad():
        test_scores = torch.sigmoid(model.classifier(test_x)).tolist()
    test = metrics(test_scores, test_y, thresholds, labels)
    prevalence = train_y.mean(0)
    common = torch.topk(prevalence, k=2).indices.tolist()
    baseline = [[int(j in common) for j in range(len(labels))] for _ in test_scores]
    durations = []
    with Image.open(local_path(args.manifest.parent, splits["test"][0]["path"])) as image:
        benchmark_input = image_tensor(image).unsqueeze(0)
    with torch.inference_mode():
        model(pixel_values=benchmark_input)
        for _ in range(10):
            before = time.monotonic(); model(pixel_values=benchmark_input); durations.append(time.monotonic() - before)
    report = {"schema": SCHEMA, "candidate": args.output.name, "created_utc": datetime.now(timezone.utc).isoformat(),
        "data_kind": manifest["data_kind"], "source_manifest_sha256": digest(args.manifest),
        "source_manifest_identity": canonical_hash(manifest), "base": {"id": BASE_ID, "revision": BASE_REVISION, "licence": "Apache-2.0"},
        "training": {"method": args.strategy, "trained_from_scratch": False,
            "encoder_updated": args.strategy != "frozen-head", "seed": args.seed,
            "epochs_requested": args.epochs, "epochs_run": epoch + 1, "patience": args.patience,
            "head_warmup_epochs": 10 if args.strategy != "frozen-head" else 0,
            "selected_epoch": best_epoch, "validation_bce": best_loss, "split_images": {s: len(r) for s, r in splits.items()},
            "cpu_threads": args.threads, "cuda_used": False, "seconds": round(time.monotonic() - started, 2),
            "new_paid_services": False},
        "labels": labels, "thresholds": thresholds, "disabled_classes": [l for l, t in zip(labels, thresholds) if t > 1],
        "validation": metrics(validation_scores, validation_y.int().tolist(), thresholds, labels), "test": test,
        "test_at_fixed_half_threshold": metrics(test_scores, test_y, [.5] * len(labels), labels),
        "baseline_top_two_training_foods": metrics(baseline, test_y, [.5] * len(labels), labels),
        "non_food_test": None, "production_privacy_reviewed": False,
        "local_latency_ms": {"median": round(statistics.median(durations) * 1000, 2), "maximum": round(max(durations) * 1000, 2),
                             "scope": "Ten warm CPU forwards of one real held-out image; not production or phone latency"},
        "limitations": manifest["limitations"] + (["Research development test previously inspected; not blind production acceptance"]
            if args.development_test_seen else []), "test_previously_inspected": args.development_test_seen,
        "production_ready": False}
    report["release_blockers"] = release_blockers(report)
    args.output.mkdir(parents=True)
    model.save_pretrained(args.output, safe_serialization=True)
    (args.output / "preprocess.json").write_text(json.dumps(PREPROCESS, indent=2) + "\n")
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    (args.output / "base-source.json").write_text(json.dumps(base, indent=2) + "\n")
    shutil.copyfile(args.base / "LICENSE", args.output / "BASE-LICENSE")
    shutil.copyfile(args.base / "README.md", args.output / "BASE-MODEL-CARD.md")
    shutil.copyfile(args.manifest.parent / "ATTRIBUTION.txt", args.output / "DATA-ATTRIBUTION.txt")
    shutil.copyfile(args.manifest, args.output / "research-manifest.json")
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": row["id"], "targets": targets, "scores": probabilities}
        for row, targets, probabilities in zip(splits["test"], test_y, test_scores)], indent=2) + "\n")
    pins = {p.name: digest(p) for p in args.output.iterdir() if p.is_file()}
    (args.output / "artifact.json").write_text(json.dumps({"schema": SCHEMA, "files": pins,
        "status": "research_candidate_only", "production_activated": False}, indent=2) + "\n")
    print(json.dumps({"candidate": str(args.output), "test": test, "disabled_classes": report["disabled_classes"],
                      "training": report["training"], "latency_ms": report["local_latency_ms"],
                      "release_blockers": report["release_blockers"]}), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", required=True, type=Path)
    parser.add_argument("--manifest", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--max-minutes", required=True, type=int, choices=range(1, 61))
    parser.add_argument("--threads", type=int, default=4, choices=range(1, 9))
    parser.add_argument("--epochs", type=int, default=100, choices=range(1, 501))
    parser.add_argument("--batch-size", type=int, default=16, choices=range(1, 33))
    parser.add_argument("--seed", type=int, default=20261101)
    parser.add_argument("--strategy", choices=("frozen-head", "last-two-blocks"), default="frozen-head")
    parser.add_argument("--development-test-seen", action="store_true")
    parser.add_argument("--patience", type=int, default=5, choices=range(1, 21))
    train(parser.parse_args())
