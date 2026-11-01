"""Synthetic negative smoke checks, never real non-food accuracy acceptance."""
import argparse
import base64
import io
import json
from pathlib import Path
import random

from PIL import Image
from semantic_model import SemanticPredictor
from core import digest


def verify(candidate, base, *, research=False):
    model = SemanticPredictor(candidate, base, research=research)
    results = []
    for name in ("black", "white", "grey", "random-noise"):
        image = Image.new("RGB", (224, 224), "black" if name == "random-noise" else name)
        if name == "random-noise":
            rng = random.Random(191)
            image.putdata([tuple(rng.randrange(256) for _ in range(3)) for _ in range(224 * 224)])
        raw = io.BytesIO(); image.save(raw, "JPEG", quality=85)
        request = {"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(raw.getvalue()).decode(), "maxOutputTokens": 400}
        response = model.recognise(request)
        results.append({"synthetic_control": name, "response": response, "suggested_food": bool(response["items"])})
    failed = sum(r["suggested_food"] for r in results)
    return {"scope": "Four synthetic non-food smoke controls, not real non-food acceptance or recipe accuracy",
        "learned_head_sha256": digest(candidate / "head.safetensors"), "controls": results,
        "false_food_suggestions": failed, "passes_smoke_test": failed == 0,
        "real_non_food_test_performed": False, "production_ready": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--research", action="store_true")
    args = parser.parse_args()
    report = verify(args.candidate, args.base, research=args.research)
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report["passes_smoke_test"] else 1)
