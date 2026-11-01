"""Actual-JPEG reload proof for the visible-food research candidate."""
import argparse
import base64
import io
import json
from pathlib import Path
import random
import time

from PIL import Image
from core import digest, food_response, metrics
from food_gate import FoodGate
from visible_learning import load_visible_predictor


def verify(args):
    start = time.monotonic()
    model = load_visible_predictor(args.candidate, args.base, research=args.research)
    ready_ms = (time.monotonic() - start) * 1000
    gate = FoodGate(args.gate)
    report = model.report
    if digest(args.manifest) != report["source_manifest_sha256"]:
        raise ValueError("Exact training provenance required")
    manifest = json.loads(args.manifest.read_text())
    expected = {r["id"]: r for r in json.loads((args.candidate / "test-predictions.json").read_text())}
    rows = [r for r in manifest["samples"] if r["split"] == "test"]
    maximum = 0.; timings = []; scores = []; gated = []; targets = []; accepted = 0
    for row in rows:
        path = args.manifest.parent / row["path"]
        if digest(path) != row["sha256"]:
            raise ValueError("Test image changed")
        request = {"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode(), "maxOutputTokens": 400}
        start = time.monotonic()
        features = model.encode(request); probabilities = model.score_features(features)
        decision = gate.inspect(features)
        response = food_response(probabilities, model.settings["labels"], model.settings["thresholds"]) if decision["accept"] else {"items": [], "nutrition": {}}
        timings.append((time.monotonic() - start) * 1000)
        if response["nutrition"] != {}:
            raise AssertionError("Invented photo nutrition")
        maximum = max(maximum, max(abs(a - b) for a, b in zip(probabilities, expected[row["id"]]["scores"])))
        scores.append(probabilities); gated.append(probabilities if decision["accept"] else [0.] * len(probabilities))
        targets.append([int(l in row["labels"]) for l in report["labels"]]); accepted += decision["accept"]
    if maximum > .00002:
        raise AssertionError("Reloaded image predictions differ from evaluation")
    controls = []
    for name in ("black", "white", "grey", "random-noise"):
        image = Image.new("RGB", (224, 224), "black" if name == "random-noise" else name)
        if name == "random-noise":
            rng = random.Random(191)
            image.putdata([tuple(rng.randrange(256) for _ in range(3)) for _ in range(224 * 224)])
        raw = io.BytesIO(); image.save(raw, "JPEG", quality=85)
        request = {"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(raw.getvalue()).decode(), "maxOutputTokens": 400}
        features = model.encode(request); decision = gate.inspect(features)
        response = food_response(model.score_features(features), report["labels"], report["thresholds"]) if decision["accept"] else {"items": [], "nutrition": {}}
        controls.append({"synthetic_control": name, "gate": decision, "response": response})
    try:
        model.recognise({**request, "memberId": "fictional-contract-check"})
    except ValueError:
        private_fields_refused = True
    else:
        raise AssertionError("Private member fields accepted")
    return {"scope": "Local research candidate reload, same development photos, unchanged known synthetic controls; not UK/non-food acceptance",
        "food_images": len(rows), "accepted_as_food": accepted,
        "maximum_probability_difference": maximum, "startup_ms": ready_ms,
        "warm_mean_ms": sum(timings) / len(timings), "warm_max_ms": max(timings),
        "ungated": metrics(scores, targets, report["thresholds"], report["labels"]),
        "gated": metrics(gated, targets, report["thresholds"], report["labels"]),
        "gate_source": {"gate_json_sha256": digest(args.gate / "gate.json"), "threshold_changed": False},
        "controls": controls, "synthetic_false_food_suggestions": sum(bool(c["response"]["items"]) for c in controls),
        "private_fields_refused": private_fields_refused, "nutrition_invented": False,
        "production_ready": False, "deployed": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("candidate", "base", "manifest", "gate"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--research", action="store_true")
    print(json.dumps(verify(parser.parse_args()), indent=2))
