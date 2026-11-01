"""Stronger frozen visual encoder, with a Shift-trained food classifier.

Public pinned weights only; local CPU inference, no paid or remote model API.
The general encoder remains licensed third-party work. Our trained head is a
derivative model component, not foundation-model pretraining.
"""
from __future__ import annotations

import argparse
import copy
from datetime import datetime, timezone
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import sys
import time
import urllib.request

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["HF_HUB_DISABLE_TELEMETRY"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"
import numpy as np
from PIL import Image, ImageOps
import torch
from safetensors.torch import load_file, save_file
from transformers import SiglipVisionModel
from transformers.utils import logging

from core import SCHEMA, SPLITS, calibrate, digest, food_response, local_path, metrics, parse_request, release_blockers, validate_manifest

MODEL_ID = "google/siglip-base-patch16-224"
REVISION = "7fd15f0689c79d79e38b1c2e2e2370a7bf2761ed"
WEIGHT_SHA256 = "2c63cb7d1f2e95ba501893cbb8faeb4ea9a3af295498d35097126228659c2af8"
FAMILY = "shift-siglip-food-head-1"
PREPROCESS = {"size": 224, "method": "full-and-centre-three-quarters", "resize": "bicubic-stretch",
              "mean": [.5, .5, .5], "std": [.5, .5, .5]}


def fetch_base(destination, maximum_mb):
    destination.mkdir(parents=True, exist_ok=False)
    total, pins = 0, {}
    sources = {name: "https://huggingface.co/" + MODEL_ID + "/resolve/" + REVISION + "/" + name
               for name in ("config.json", "preprocessor_config.json", "model.safetensors", "README.md")}
    sources["LICENSE"] = "https://raw.githubusercontent.com/google-research/big_vision/main/LICENSE"
    for name, url in sources.items():
        h = hashlib.sha256(); size = 0
        with urllib.request.urlopen(url, timeout=60) as response, (destination / name).open("wb") as output:
            if not response.url.startswith("https://"):
                raise ValueError("HTTPS weights required")
            while block := response.read(1_048_576):
                size += len(block); total += len(block)
                if total > maximum_mb * 1_000_000 or size > (850_000_000 if name == "model.safetensors" else 1_000_000):
                    raise ValueError("Explicit public download budget exhausted")
                h.update(block); output.write(block)
        pins[name] = h.hexdigest()
        if name == "model.safetensors" and pins[name] != WEIGHT_SHA256:
            raise ValueError("Publisher's immutable weight pin does not match")
        print(json.dumps({"downloaded": name, "bytes": size}), flush=True)
    if "license: apache-2.0" not in (destination / "README.md").read_text().lower():
        raise ValueError("Reviewed published Apache licence declaration missing")
    source = {"id": MODEL_ID, "revision": REVISION, "licence": "Apache-2.0", "files": pins, "downloaded_bytes": total}
    (destination / "source.json").write_text(json.dumps(source, indent=2) + "\n")


def encoder(directory):
    source = json.loads((directory / "source.json").read_text())
    if (source.get("id"), source.get("revision"), source.get("licence")) != (MODEL_ID, REVISION, "Apache-2.0"):
        raise ValueError("Reviewed base required")
    if source.get("files", {}).get("model.safetensors") != WEIGHT_SHA256:
        raise ValueError("Reviewed base weight pin required")
    for name, pin in source["files"].items():
        if digest(local_path(directory, name)) != pin:
            raise ValueError("Base bytes changed: " + name)
    logging.set_verbosity_error()
    model, info = SiglipVisionModel.from_pretrained(directory, local_files_only=True,
        trust_remote_code=False, use_safetensors=True, output_loading_info=True)
    if any(info.get(k) for k in ("missing_keys", "mismatched_keys", "error_msgs")):
        raise ValueError("Incomplete visual weight load")
    # This source contains a text tower as well. Only its known text weights and
    # scalar image/text comparison parameters may be unused by the vision tower.
    if any(not key.startswith(("text_model.", "logit_scale", "logit_bias")) for key in info.get("unexpected_keys", [])):
        raise ValueError("Unexpected non-text model weights")
    model.eval()
    for parameter in model.parameters():
        parameter.requires_grad = False
    return model, source


def view_tensors(image):
    image = ImageOps.exif_transpose(image).convert("RGB")
    width, height = image.size
    crop = image.crop((width // 8, height // 8, width - width // 8, height - height // 8))
    result = []
    for view in (image, crop):
        array = np.asarray(view.resize((224, 224), Image.Resampling.BICUBIC), dtype=np.float32) / 127.5 - 1
        result.append(torch.from_numpy(array.transpose(2, 0, 1).copy()))
    return torch.stack(result)


def features(model, rows, root, deadline):
    values = []
    with torch.inference_mode():
        for offset in range(0, len(rows), 4):
            if time.monotonic() > deadline:
                raise TimeoutError("Explicit local computation budget reached")
            batch = []
            for row in rows[offset:offset + 4]:
                with Image.open(local_path(root, row["path"])) as image:
                    batch.append(view_tensors(image))
            pixels = torch.cat(batch)
            output = model(pixel_values=pixels).pooler_output
            values.append(output.reshape(len(batch), -1).clone())
            if offset % 100 == 0:
                print(json.dumps({"stage": "visual_features", "completed": offset, "images": len(rows)}), flush=True)
    return torch.cat(values).clone()


class FoodHead(torch.nn.Module):
    def __init__(self, width, labels):
        super().__init__()
        self.register_buffer("mean", torch.zeros(width))
        self.register_buffer("std", torch.ones(width))
        self.linear = torch.nn.Linear(width, labels)

    def forward(self, x):
        return self.linear((x - self.mean) / self.std)


def fit_head(train_x, train_y, validation_x, validation_y, labels, deadline):
    torch.manual_seed(20261101)
    head = FoodHead(train_x.shape[1], len(labels))
    head.mean.copy_(train_x.mean(0)); head.std.copy_(train_x.std(0).clamp_min(.05))
    optimiser = torch.optim.AdamW(head.parameters(), lr=.003, weight_decay=.03)
    loss = torch.nn.BCEWithLogitsLoss()
    best_loss, best, best_epoch = float("inf"), None, 0
    for epoch in range(200):
        if time.monotonic() > deadline:
            raise TimeoutError("Explicit local computation budget reached")
        for batch in torch.randperm(len(train_x)).split(64):
            optimiser.zero_grad(); loss(head(train_x[batch]), train_y[batch]).backward(); optimiser.step()
        with torch.no_grad():
            score = float(loss(head(validation_x), validation_y))
        if score < best_loss:
            best_loss, best, best_epoch = score, copy.deepcopy(head.state_dict()), epoch + 1
        if epoch + 1 - best_epoch >= 15:
            break
    head.load_state_dict(best); head.eval()
    with torch.no_grad():
        probabilities = torch.sigmoid(head(validation_x)).tolist()
    thresholds = calibrate(probabilities, validation_y.int().tolist(), labels)
    return head, thresholds, metrics(probabilities, validation_y.int().tolist(), thresholds, labels), best_epoch


def train(args):
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    torch.set_num_threads(4); torch.use_deterministic_algorithms(True)
    manifest = validate_manifest(args.manifest)
    if args.output.exists():
        raise ValueError("New candidate directory required")
    labels = manifest["labels"]
    splits = {s: [r for r in manifest["samples"] if r["split"] == s] for s in SPLITS}
    model, source = encoder(args.base)
    xs, ys = {}, {}
    for split in ("train", "validation"):
        xs[split] = features(model, splits[split], args.manifest.parent, deadline)
        ys[split] = torch.tensor([[int(label in row["labels"]) for label in labels] for row in splits[split]], dtype=torch.float32)
    width = xs["train"].shape[1] // 2
    candidates = []
    # Predeclared comparison, chosen using validation only. The original twelve
    # food labels, split and calibration rules are unchanged.
    for views in (1, 2):
        used = width * views
        head, thresholds, result, selected_epoch = fit_head(xs["train"][:, :used], ys["train"],
            xs["validation"][:, :used], ys["validation"], labels, deadline)
        candidates.append((result["micro_f1"], views, head, thresholds, result, selected_epoch))
        print(json.dumps({"stage": "validation", "views": views, "metrics": result}), flush=True)
    _, views, head, thresholds, validation, selected_epoch = max(candidates, key=lambda c: (c[0], -c[1]))
    used = width * views
    test_x = features(model, splits["test"], args.manifest.parent, deadline)[:, :used]
    test_y = [[int(label in row["labels"]) for label in labels] for row in splits["test"]]
    with torch.no_grad():
        test_scores = torch.sigmoid(head(test_x)).tolist()
    report = {"schema": SCHEMA, "candidate": args.output.name, "model_family": FAMILY,
        "created_utc": datetime.now(timezone.utc).isoformat(), "data_kind": manifest["data_kind"],
        "source_manifest_sha256": digest(args.manifest), "labels": labels, "thresholds": thresholds,
        "disabled_classes": [l for l, t in zip(labels, thresholds) if t > 1],
        "base": {"id": MODEL_ID, "revision": REVISION, "weight_sha256": WEIGHT_SHA256, "licence": "Apache-2.0"},
        "training": {"method": "Shift food head on frozen SigLIP visual embeddings", "encoder_updated": False,
            "trained_from_scratch": False, "selected_views": views, "selected_epoch": selected_epoch,
            "selection": "Maximum validation F1; same 85% validation precision calibration rule",
            "trainable_parameters": sum(p.numel() for p in head.parameters()),
            "split_images": {s: len(rows) for s, rows in splits.items()},
            "seconds": round(time.monotonic() - start, 2), "new_paid_services": False, "cpu_threads": 4},
        "validation": validation, "validation_candidates": [{"views": c[1], "metrics": c[4]} for c in candidates],
        "test": metrics(test_scores, test_y, thresholds, labels),
        "test_at_fixed_half_threshold": metrics(test_scores, test_y, [.5] * len(labels), labels),
        "test_previously_inspected": True, "non_food_test": None, "production_privacy_reviewed": False,
        "production_ready": False, "limitations": manifest["limitations"] + ["Development test previously inspected; not independent UK acceptance",
            "Base remains licensed third-party work; only our food head is trained here", "Twelve food groups are not complete meal coverage"]}
    report["release_blockers"] = release_blockers(report)
    args.output.mkdir(parents=True)
    save_file(head.state_dict(), args.output / "head.safetensors")
    (args.output / "head.json").write_text(json.dumps({"family": FAMILY, "width": used, "views": views,
        "labels": labels, "preprocess": PREPROCESS, "thresholds": thresholds}, indent=2) + "\n")
    (args.output / "evaluation.json").write_text(json.dumps(report, indent=2) + "\n")
    (args.output / "base-source.json").write_text(json.dumps(source, indent=2) + "\n")
    shutil.copyfile(args.base / "LICENSE", args.output / "BASE-LICENSE")
    shutil.copyfile(args.base / "README.md", args.output / "BASE-MODEL-CARD.md")
    shutil.copyfile(args.manifest, args.output / "research-manifest.json")
    shutil.copyfile(args.manifest.parent / "ATTRIBUTION.txt", args.output / "DATA-ATTRIBUTION.txt")
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": r["id"], "targets": y, "scores": p} for r, y, p in zip(splits["test"], test_y, test_scores)], indent=2) + "\n")
    pins = {p.name: digest(p) for p in args.output.iterdir() if p.is_file()}
    (args.output / "artifact.json").write_text(json.dumps({"schema": SCHEMA, "model_family": FAMILY,
        "status": "research_candidate_only", "files": pins, "base_weights_embedded": False}, indent=2) + "\n")
    print(json.dumps({"candidate": str(args.output), "validation": validation, "test": report["test"],
                      "training": report["training"], "disabled": report["disabled_classes"]}), flush=True)


class SemanticPredictor:
    def __init__(self, directory, base, *, research=False):
        if not research:
            raise ValueError("Research candidate only; production serving not approved")
        pins = json.loads((directory / "artifact.json").read_text())
        if pins.get("model_family") != FAMILY or pins.get("status") != "research_candidate_only":
            raise ValueError("Known semantic candidate required")
        for name, pin in pins["files"].items():
            if digest(local_path(directory, name)) != pin:
                raise ValueError("Candidate bytes changed")
        self.settings = json.loads((directory / "head.json").read_text())
        self.report = json.loads((directory / "evaluation.json").read_text())
        if self.settings["preprocess"] != PREPROCESS or self.settings["labels"] != self.report["labels"] or self.settings["thresholds"] != self.report["thresholds"]:
            raise ValueError("Candidate contract differs from evaluation")
        torch.set_num_threads(4)
        self.model, source = encoder(base)
        if source != json.loads((directory / "base-source.json").read_text()):
            raise ValueError("Wrong pinned visual base")
        self.head = FoodHead(self.settings["width"], len(self.settings["labels"]))
        self.head.load_state_dict(load_file(directory / "head.safetensors"), strict=True); self.head.eval()

    def encode(self, request):
        raw = parse_request(request)
        Image.MAX_IMAGE_PIXELS = 1_000_000
        with Image.open(io.BytesIO(raw)) as image:
            if image.format != "JPEG" or max(image.size) > 768 or min(image.size) < 8:
                raise ValueError("Resized JPEG required")
            x = view_tensors(image)[:self.settings["views"]]
        with torch.inference_mode():
            return self.model(pixel_values=x).pooler_output.reshape(1, -1)

    def score_features(self, embedding):
        with torch.inference_mode():
            return torch.sigmoid(self.head(embedding))[0].tolist()

    def scores(self, request):
        return self.score_features(self.encode(request))

    def recognise(self, request):
        return food_response(self.scores(request), self.settings["labels"], self.settings["thresholds"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("fetch", "train", "predict"))
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--candidate", type=Path)
    parser.add_argument("--manifest", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--max-download-mb", type=int, default=850, choices=range(813, 1001))
    parser.add_argument("--max-minutes", type=int, default=30, choices=range(1, 61))
    parser.add_argument("--research", action="store_true")
    args = parser.parse_args()
    if args.command == "fetch":
        fetch_base(args.base, args.max_download_mb)
    elif args.command == "train":
        if not args.manifest or not args.output:
            parser.error("Training requires manifest and new output directory")
        train(args)
    else:
        if not args.candidate:
            parser.error("Prediction requires a candidate")
        raw = sys.stdin.buffer.read(1_100_001)
        if len(raw) > 1_100_000:
            raise ValueError("Bounded request required")
        predictor = SemanticPredictor(args.candidate, args.base, research=args.research)
        print(json.dumps(predictor.recognise(json.loads(raw))))
