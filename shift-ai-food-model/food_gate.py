"""Experimental text/image food-presence gate. Not calibrated confidence.

Fixed concepts are defined before this experiment. No image labels, test scores,
member captions or nutrition select them. Passing the four known controls is
development evidence only; real non-food and UK acceptance remain outstanding.
"""
import argparse
import json
from pathlib import Path
import shutil
import math

from core import digest, food_response

FOOD = ("food served on a plate", "a bowl of food", "a meal", "a sandwich",
        "fruit and vegetables", "a packaged food product")
OTHER = ("a blank image", "a random noise pattern", "an out of focus image", "a screenshot",
         "a person", "an animal", "a vehicle", "clothing", "an electronic device",
         "a document", "an empty plate", "a landscape")


def build(base, output):
    import numpy as np
    import torch
    from recipe_bank import text_encoder, text_features
    from semantic_model import MODEL_ID, REVISION, WEIGHT_SHA256
    if output.exists():
        raise ValueError("New gate directory required")
    torch.set_num_threads(4)
    tokenizer, model, _ = text_encoder(base)
    prompts = ["This is a photo of " + p + "." for p in FOOD + OTHER]
    embeddings = text_features(tokenizer, model, prompts)
    output.mkdir(parents=True)
    np.save(output / "embeddings.npy", embeddings, allow_pickle=False)
    shutil.copyfile(base / "LICENSE", output / "BASE-LICENSE")
    meta = {"schema": "shift-food-presence-gate-1", "model_id": MODEL_ID, "revision": REVISION,
        "weight_sha256": WEIGHT_SHA256, "base_licence": "Apache-2.0", "food": list(FOOD), "other": list(OTHER),
        "embeddings_sha256": digest(output / "embeddings.npy"), "threshold": 0.,
        "method": "Fixed food versus other text/image maximum cosine similarity; not supervised image training",
        "production_ready": False, "real_non_food_accuracy_measured": False}
    (output / "gate.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(json.dumps(meta))


class FoodGate:
    def __init__(self, directory):
        import numpy as np
        from semantic_model import MODEL_ID, REVISION, WEIGHT_SHA256
        self.meta = json.loads((directory / "gate.json").read_text())
        expected = {"schema": "shift-food-presence-gate-1", "model_id": MODEL_ID,
            "revision": REVISION, "weight_sha256": WEIGHT_SHA256, "food": list(FOOD), "other": list(OTHER)}
        if any(self.meta.get(k) != v for k, v in expected.items()) or self.meta.get("production_ready") is not False:
            raise ValueError("Known experimental gate required")
        threshold = self.meta.get("threshold")
        if type(threshold) not in (int, float) or not math.isfinite(threshold) or not -1 <= threshold <= 0:
            raise ValueError("Bounded gate margin required")
        if threshold != 0 and (self.meta.get("calibration", {}).get("split") != "validation" or
                               self.meta["calibration"].get("target_food_retention") != .95):
            raise ValueError("Validation-only food-retention calibration required")
        if digest(directory / "embeddings.npy") != self.meta["embeddings_sha256"]:
            raise ValueError("Gate reference bytes changed")
        self.embeddings = np.load(directory / "embeddings.npy", allow_pickle=False)
        if self.embeddings.shape != (len(FOOD) + len(OTHER), 768) or not np.isfinite(self.embeddings).all():
            raise ValueError("Bounded finite gate references required")

    def inspect(self, embedding):
        import numpy as np
        vector = embedding.detach().cpu().numpy().reshape(-1)[:768]
        norm = np.linalg.norm(vector)
        if vector.shape != (768,) or not np.isfinite(vector).all() or norm < 1e-8:
            raise ValueError("Known finite image features required")
        scores = self.embeddings @ (vector / norm)
        food, other = float(scores[:len(FOOD)].max()), float(scores[len(FOOD):].max())
        return {"accept": food - other > self.meta["threshold"], "food_similarity": food, "other_similarity": other,
                "margin": food - other, "score_kind": "similarity_not_probability"}


class GatedPredictor:
    def __init__(self, candidate, base, gate, *, research=False):
        if not research:
            raise ValueError("Research-only gated model; production invocation refused")
        from semantic_model import SemanticPredictor
        self.model = SemanticPredictor(candidate, base, research=True)
        self.gate = FoodGate(gate)

    def inspect(self, request):
        features = self.model.encode(request)
        decision = self.gate.inspect(features)
        scores = self.model.score_features(features)
        response = food_response(scores, self.model.settings["labels"], self.model.settings["thresholds"]) if decision["accept"] else {"items": [], "nutrition": {}}
        return response, decision, scores

    def recognise(self, request):
        return self.inspect(request)[0]


def calibrate(base, candidate, gate, manifest_path, output):
    import base64
    if output.exists():
        raise ValueError("New calibrated gate directory required")
    report = json.loads((candidate / "evaluation.json").read_text())
    if digest(manifest_path) != report["source_manifest_sha256"]:
        raise ValueError("Exact candidate dataset required")
    manifest = json.loads(manifest_path.read_text())
    rows = [r for r in manifest["samples"] if r["split"] == "validation"]
    if manifest.get("data_kind") != "real_public_research" or len(rows) < 100:
        raise ValueError("At least 100 real validation food images required")
    model = GatedPredictor(candidate, base, gate, research=True)
    margins = []
    for row in rows:
        path = manifest_path.parent / row["path"]
        if digest(path) != row["sha256"]:
            raise ValueError("Validation image changed")
        request = {"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode(), "maxOutputTokens": 400}
        features = model.model.encode(request)
        margins.append(model.gate.inspect(features)["margin"])
    # Fixed objective: preserve at least 95% of positive validation photos.
    # Neither test rows nor negative-control results select this threshold.
    index = max(0, math.floor(.05 * len(margins)) - 1)
    threshold = min(0., sorted(margins)[index] - 1e-7)
    retained = sum(m > threshold for m in margins)
    if retained < math.ceil(.95 * len(margins)):
        raise AssertionError("Food retention objective not met")
    output.mkdir(parents=True)
    for name in ("embeddings.npy", "BASE-LICENSE"):
        shutil.copyfile(gate / name, output / name)
    meta = dict(model.gate.meta)
    meta["threshold"] = threshold
    meta["calibration"] = {"split": "validation", "images": len(rows), "target_food_retention": .95,
        "retained": retained, "manifest_sha256": digest(manifest_path), "negative_images_used": 0,
        "note": "Positive-food retention only. Not calibrated non-food rejection accuracy."}
    (output / "gate.json").write_text(json.dumps(meta, indent=2) + "\n")
    print(json.dumps(meta))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--candidate", type=Path)
    parser.add_argument("--gate", type=Path)
    parser.add_argument("--manifest", type=Path)
    args = parser.parse_args()
    if args.manifest:
        if not args.candidate or not args.gate:
            parser.error("Calibration needs candidate and initial gate")
        calibrate(args.base, args.candidate, args.gate, args.manifest, args.output)
    else:
        build(args.base, args.output)
