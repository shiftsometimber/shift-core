"""Compare the experimental gate with the unchanged food head on development data."""
import argparse
import base64
import io
import json
from pathlib import Path
import random
import time

from PIL import Image
from core import digest, metrics
from food_gate import GatedPredictor


def verify(candidate, base, gate, manifest_path, *, research=False, predictor_factory=None):
    model = (predictor_factory or GatedPredictor)(candidate, base, gate, research=research)
    original = json.loads((candidate / "evaluation.json").read_text())
    if digest(manifest_path) != original["source_manifest_sha256"]:
        raise ValueError("Exact previously evaluated manifest required")
    manifest = json.loads(manifest_path.read_text())
    expected = {r["id"]: r for r in json.loads((candidate / "test-predictions.json").read_text())}
    baseline, gated, targets, accepted, durations = [], [], [], [], []
    maximum = 0.
    rows = [r for r in manifest["samples"] if r["split"] == "test"]
    for row in rows:
        path = manifest_path.parent / row["path"]
        if digest(path) != row["sha256"]:
            raise ValueError("Test image changed")
        request = {"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode(), "maxOutputTokens": 400}
        start = time.monotonic(); response, decision, scores = model.inspect(request)
        durations.append((time.monotonic() - start) * 1000)
        if response["nutrition"] != {}:
            raise AssertionError("Invented nutrition")
        maximum = max(maximum, max(abs(a - b) for a, b in zip(scores, expected[row["id"]]["scores"])))
        baseline.append(scores); gated.append(scores if decision["accept"] else [0.] * len(scores))
        targets.append([int(label in row["labels"]) for label in original["labels"]]); accepted.append(decision["accept"])
    if maximum > .00002:
        raise AssertionError("Unchanged classifier differs from saved evaluation")
    controls = []
    for name in ("black", "white", "grey", "random-noise"):
        image = Image.new("RGB", (224, 224), "black" if name == "random-noise" else name)
        if name == "random-noise":
            rng = random.Random(191)
            image.putdata([tuple(rng.randrange(256) for _ in range(3)) for _ in range(224 * 224)])
        raw = io.BytesIO(); image.save(raw, "JPEG", quality=85)
        response, decision, _ = model.inspect({"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(raw.getvalue()).decode(), "maxOutputTokens": 400})
        controls.append({"synthetic_control": name, "response": response, "gate": decision})
    return {"scope": "Development comparison only: previously inspected public food photos and four known synthetic controls; not independent UK or real non-food acceptance",
        "test_previously_inspected": True, "food_images": len(rows), "accepted_as_food": sum(accepted),
        "baseline": metrics(baseline, targets, original["thresholds"], original["labels"]),
        "gated": metrics(gated, targets, original["thresholds"], original["labels"]),
        "maximum_baseline_probability_difference": maximum, "warm_mean_ms": sum(durations) / len(durations),
        "controls": controls, "synthetic_false_food_suggestions": sum(bool(c["response"]["items"]) for c in controls),
        "gate_metadata": model.gate.meta, "head_weights_changed": False, "head_thresholds_changed": False,
        "production_ready": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("candidate", "base", "gate", "manifest"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--research", action="store_true")
    args = parser.parse_args()
    print(json.dumps(verify(args.candidate, args.base, args.gate, args.manifest, research=args.research), indent=2))
