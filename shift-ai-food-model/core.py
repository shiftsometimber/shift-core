"""Offline data, evaluation and request contract for Shift's food candidate.

No accounts, member records, remote inference, automatic uploads or diary writes.
This module deliberately needs only the Python standard library.
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
from pathlib import Path

SCHEMA = "shift-food-model-1"
SPLITS = ("train", "validation", "test")
MAX_IMAGE_BYTES = 750_000


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1_048_576), b""):
            h.update(block)
    return h.hexdigest()


def canonical_hash(value) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()).hexdigest()


def split_for(group_id: str) -> str:
    # Assign a whole capture week, never individual frames, to one split.
    bucket = int(hashlib.sha256(("shift-food-v1:" + group_id).encode()).hexdigest()[:8], 16) % 10
    return "test" if bucket < 2 else "validation" if bucket < 4 else "train"


def local_path(root: Path, relative: str) -> Path:
    if not isinstance(relative, str) or not relative or Path(relative).is_absolute():
        raise ValueError("Relative local image path required")
    result = (root / relative).resolve()
    if not result.is_relative_to(root.resolve()) or not result.is_file():
        raise ValueError("Image must exist inside the dataset directory")
    return result


def validate_manifest(path: Path, *, verify_files=True) -> dict:
    value = json.loads(path.read_text())
    if value.get("schema") != SCHEMA or value.get("data_kind") not in ("real_public_research", "consented_uk_field"):
        raise ValueError("Real research or explicitly consented field manifest required")
    labels = value.get("labels", [])
    if not 2 <= len(labels) <= 50 or len(set(labels)) != len(labels) or not all(isinstance(x, str) and 0 < len(x) <= 90 for x in labels):
        raise ValueError("Distinct bounded labels required")
    rows = value.get("samples", [])
    if not rows:
        raise ValueError("No real food images")
    identities, hashes, groups = set(), {}, {}
    counts = {split: 0 for split in SPLITS}
    for row in rows:
        split, group = row.get("split"), row.get("group_id")
        if split not in SPLITS or not isinstance(group, str) or not group:
            raise ValueError("Explicit split and capture group required")
        if group in groups and groups[group] != split:
            raise ValueError("Capture group leaks across splits")
        groups[group] = split
        identity = row.get("id")
        if not isinstance(identity, str) or identity in identities:
            raise ValueError("Duplicate or missing image identity")
        identities.add(identity)
        targets = row.get("labels")
        if not isinstance(targets, list) or len(set(targets)) != len(targets) or not set(targets) <= set(labels):
            raise ValueError("Unrecognised or duplicate target label")
        if row.get("licence") not in ("CC-BY-4.0", "SHIFT-consented-field-1") or not row.get("source_url") or not row.get("attribution"):
            raise ValueError("Image rights and attribution required")
        pin = row.get("sha256", "")
        if len(pin) != 64 or any(c not in "0123456789abcdef" for c in pin):
            raise ValueError("SHA256 image pin required")
        if pin in hashes:
            raise ValueError("Duplicate image bytes, including across splits")
        hashes[pin] = split
        if verify_files and digest(local_path(path.parent, row["path"])) != pin:
            raise ValueError("Image bytes changed")
        counts[split] += 1
    if any(counts[s] == 0 for s in SPLITS):
        raise ValueError("All three independent splits are required")
    return value


def validate_scores(scores, targets, label_count):
    if len(scores) != len(targets) or not scores:
        raise ValueError("Matching non-empty predictions and targets required")
    for probabilities, expected in zip(scores, targets):
        if len(probabilities) != label_count or len(expected) != label_count:
            raise ValueError("Prediction width differs from vocabulary")
        if any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) or not 0 <= x <= 1 for x in probabilities):
            raise ValueError("Finite bounded scores required")
        if any(x not in (0, 1) for x in expected):
            raise ValueError("Binary ingredient targets required")


def metrics(scores, targets, thresholds, labels):
    validate_scores(scores, targets, len(labels))
    if len(thresholds) != len(labels) or any(not math.isfinite(t) or not 0 <= t <= 1.01 for t in thresholds):
        raise ValueError("Explicit bounded class thresholds required")
    tp = fp = fn = accepted = exact = 0
    by_class = []
    for j, label in enumerate(labels):
        a = b = c = support = predictions = 0
        for p, y in zip(scores, targets):
            predicted = p[j] >= thresholds[j]
            a += bool(predicted and y[j]); b += bool(predicted and not y[j]); c += bool(not predicted and y[j])
            support += y[j]; predictions += predicted
        tp += a; fp += b; fn += c
        by_class.append({"label": label, "support": support, "predictions": predictions,
                         "precision": a / (a + b) if a + b else None,
                         "recall": a / support if support else None,
                         "f1": 2 * a / (2 * a + b + c) if 2 * a + b + c else 0})
    for p, y in zip(scores, targets):
        predicted = [int(x >= t) for x, t in zip(p, thresholds)]
        accepted += any(predicted); exact += predicted == y
    return {"images": len(scores), "micro_precision": tp / (tp + fp) if tp + fp else None,
            "micro_recall": tp / (tp + fn) if tp + fn else None,
            "micro_f1": 2 * tp / (2 * tp + fp + fn) if 2 * tp + fp + fn else 0,
            "exact_match": exact / len(scores), "coverage": accepted / len(scores), "classes": by_class}


def calibrate(scores, targets, labels, *, minimum_predictions=5, minimum_precision=.85):
    """Thresholds come from validation only; unsupported classes are disabled."""
    validate_scores(scores, targets, len(labels))
    thresholds = []
    for j in range(len(labels)):
        eligible = []
        for threshold in (x / 100 for x in range(10, 100, 5)):
            predicted = [i for i, p in enumerate(scores) if p[j] >= threshold]
            true = sum(targets[i][j] for i in predicted)
            if len(predicted) >= minimum_predictions and true / len(predicted) >= minimum_precision:
                eligible.append((true, -len(predicted), threshold))
        thresholds.append(max(eligible)[2] if eligible else 1.01)
    return thresholds


def release_blockers(report):
    # Proposed acceptance floors are deliberately independent of the pilot's result.
    # A research-only run cannot qualify production even if every metric is perfect.
    reasons = []
    if report.get("data_kind") != "consented_uk_field":
        reasons.append("Independent representative UK meal evaluation missing")
    if report.get("test_previously_inspected") is True:
        reasons.append("Fresh held-out confirmation required after development-test inspection")
    if report.get("test", {}).get("images", 0) < 200:
        reasons.append("At least 200 independent UK evaluation images required")
    result = report.get("test", {})
    if (result.get("micro_precision") or 0) < .90:
        reasons.append("Food suggestion precision below proposed 90% floor")
    if (result.get("micro_recall") or 0) < .60:
        reasons.append("Food coverage below proposed 60% recall floor")
    classes = result.get("classes", [])
    if not classes or any(c.get("support", 0) < 20 for c in classes):
        reasons.append("Each advertised food class needs 20 independent evaluation examples")
    if classes and any(c.get("predictions", 0) < 5 or (c.get("precision") or 0) < .85 for c in classes):
        reasons.append("Every advertised food class needs measured suggestion precision")
    negative = report.get("non_food_test") or {}
    if negative.get("images", 0) < 100 or negative.get("false_accept_rate", 1) > .05:
        reasons.append("Independent non-food rejection evaluation missing or below floor")
    if report.get("production_privacy_reviewed") is not True:
        reasons.append("Production hosting and photo privacy review outstanding")
    return reasons


def parse_request(value):
    if not isinstance(value, dict) or value.get("task") != "recognise_food":
        raise ValueError("recognise_food task required")
    if set(value) - {"task", "image", "caption", "maxOutputTokens"}:
        raise ValueError("Member identity or unknown fields rejected")
    if not isinstance(value.get("caption", ""), str) or len(value.get("caption", "")) > 500:
        raise ValueError("Bounded caption required")
    image = value.get("image")
    prefix = "data:image/jpeg;base64,"
    if not isinstance(image, str) or not image.startswith(prefix) or len(image) > 1_050_000:
        raise ValueError("Bounded JPEG data required")
    try:
        raw = base64.b64decode(image[len(prefix):], validate=True)
    except (ValueError, TypeError) as exc:
        raise ValueError("Invalid JPEG encoding") from exc
    if not 4 <= len(raw) <= MAX_IMAGE_BYTES or raw[:2] != b"\xff\xd8":
        raise ValueError("Bounded JPEG required")
    # Caption is accepted for wire compatibility but never becomes a model input.
    return raw


def food_response(scores, labels, thresholds):
    validate_scores([scores], [[0] * len(labels)], len(labels))
    if len(thresholds) != len(labels) or any(not math.isfinite(t) or not 0 <= t <= 1.01 for t in thresholds):
        raise ValueError("Invalid calibration")
    ranked = sorted(zip(labels, scores, thresholds), key=lambda x: -x[1])
    return {"items": [name for name, score, threshold in ranked if score >= threshold][:12], "nutrition": {}}
