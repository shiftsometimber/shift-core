"""Offline supervised recipe learning. No member collection or production serving.

A verified real-photo manifest is mandatory. Test fixtures exercise mechanics
only and cannot become a trained artifact. Frozen image features are learned
into recipe prototypes; nutrition is never a visual target or output.
"""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import re
import time

from core import digest, local_path, SPLITS

SCHEMA = "shift-recipe-photo-pairs-1"
TOKEN = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9_.-]{0,119}\Z")
PIN = re.compile(r"[a-f0-9]{64}\Z")


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    require(path.stat().st_size <= 30_000_000, "Bounded local JSON required")
    return json.loads(path.read_text(), parse_constant=lambda _: (_ for _ in ()).throw(ValueError("Non-finite JSON")))


def catalogue_at(path):
    catalogue = read_json(path)
    require(catalogue.get("schema") == "shift-recipe-recognition-catalogue-1" and
            catalogue.get("source_kind") == "governed_source_snapshot_not_live_database_readback", "Governed catalogue snapshot required")
    rows = catalogue.get("recipes", [])
    require(rows and len(rows) <= 10_000, "Bounded non-empty recipe catalogue required")
    recipes = {}
    for row in rows:
        require(isinstance(row.get("id"), str) and TOKEN.fullmatch(row["id"]) and
                isinstance(row.get("content_sha256"), str) and PIN.fullmatch(row["content_sha256"]), "Recipe ID/hash required")
        require(row["id"] not in recipes, "Duplicate recipe ID")
        recipes[row["id"]] = row
    return recipes


def qualify(manifest_path, catalogue_path):
    """Verify image bytes, review/rights evidence and leakage before feature use.

    Rights evidence is an attested local record, not an automatic legal opinion.
    Anonymous source groups should identify a household/source session, never a
    member account. Same capture, dish or source group must stay in one split.
    """
    from PIL import Image, ImageOps
    Image.MAX_IMAGE_PIXELS = 1_000_000
    value = read_json(manifest_path)
    require(set(value) <= {"schema", "data_kind", "catalogue_sha256", "test_previously_inspected", "samples"}, "Unknown manifest fields rejected")
    require(value.get("schema") == SCHEMA and value.get("catalogue_sha256") == digest(catalogue_path), "Current pinned catalogue required")
    require(value.get("data_kind") in ("real_recipe_photos", "fixture_only"), "Declare real photos or fixture-only data")
    require(type(value.get("test_previously_inspected")) is bool, "Declare prior test inspection explicitly")
    recipes = catalogue_at(catalogue_path)
    samples = value.get("samples")
    require(isinstance(samples, list) and len(samples) <= 10_000, "Bounded sample list required")
    ids, bytes_seen, pixels_seen, groups, fingerprints, evaluation_dishes = set(), set(), set(), {}, [], set()
    counts = {s: Counter() for s in SPLITS}
    evidence_pins = {}
    for row in samples:
        require(set(row) <= {"id", "path", "sha256", "split", "capture_group", "dish_group", "source_group", "image_kind", "target", "recipe_id", "recipe_hash", "review", "rights"}, "Unknown sample/member identity fields rejected")
        require(isinstance(row.get("id"), str) and TOKEN.fullmatch(row["id"]) and row["id"] not in ids, "Distinct anonymous sample ID required")
        ids.add(row["id"])
        split = row.get("split")
        require(split in SPLITS, "Explicit train/validation/test split required")
        for key in ("capture_group", "dish_group", "source_group"):
            group = row.get(key)
            require(isinstance(group, str) and TOKEN.fullmatch(group), "Anonymous capture/dish/source group required")
            # The namespace stops accidental collisions between different kinds.
            identity = (key, group)
            require(identity not in groups or groups[identity] == split, "Capture/dish/source group leaks across splits")
            groups[identity] = split
        if split != "train":
            require(row["dish_group"] not in evaluation_dishes, "Only one evaluation photo per cooked dish permitted")
            evaluation_dishes.add(row["dish_group"])
        require(row.get("image_kind") == "real_photo", "Real photos required; generated/illustrative references excluded")
        target = row.get("target")
        require(target in ("recipe", "other_food", "non_food"), "Explicit recipe or negative target required")
        if target == "recipe":
            recipe = recipes.get(row.get("recipe_id"))
            require(recipe is not None and row.get("recipe_hash") == recipe["content_sha256"], "Recipe version changed or unknown")
        else:
            require(row.get("recipe_id") is None and row.get("recipe_hash") is None, "Negative photo must not carry a recipe label")
        review = row.get("review", {})
        require(set(review) == {"checked", "ingredients_match", "evidence", "sha256"} and review["checked"] is True and
                review["ingredients_match"] is (target == "recipe"), "Checked exact recipe ingredients or checked negative required")
        rights = row.get("rights", {})
        require(set(rights) == {"basis", "evidence", "sha256", "attribution"} and rights["basis"] in
                ("SHIFT-owned", "CC-BY-4.0", "explicit-member-training-consent") and
                isinstance(rights["attribution"], str) and 0 < len(rights["attribution"]) <= 500, "Explicit photo rights and attribution required")
        for record in (review, rights):
            proof = local_path(manifest_path.parent, record["evidence"])
            require(isinstance(record["sha256"], str) and PIN.fullmatch(record["sha256"]) and digest(proof) == record["sha256"], "Review/rights evidence bytes changed")
            evidence_pins[record["evidence"]] = record["sha256"]
        permission = read_json(local_path(manifest_path.parent, rights["evidence"]))
        require(permission.get("active") is True and permission.get("basis") == rights["basis"] and
                permission.get("photo_sha256") == row.get("sha256") and permission.get("training_reuse") is True and
                permission.get("evaluation_reuse") is True and permission.get("reviewed") is True, "Active reviewed training/evaluation permission for this photo required")
        checked = read_json(local_path(manifest_path.parent, review["evidence"]))
        require(checked.get("photo_sha256") == row.get("sha256") and checked.get("target") == target and
                checked.get("recipe_id") == row.get("recipe_id") and checked.get("recipe_hash") == row.get("recipe_hash") and
                checked.get("ingredients_match") is (target == "recipe") and checked.get("checked") is True,
                "Label review must bind this photo and current recipe version")
        image_path = local_path(manifest_path.parent, row["path"])
        require(image_path.stat().st_size <= 750_000 and digest(image_path) == row.get("sha256"), "Bounded image bytes changed")
        require(row["sha256"] not in bytes_seen, "Duplicate image bytes")
        bytes_seen.add(row["sha256"])
        with Image.open(image_path) as image:
            require(image.format == "JPEG" and 8 <= min(image.size) and max(image.size) <= 768, "Resized JPEG required")
            require(not image.getexif() and not any(image.info.get(k) for k in ("xmp", "comment")), "Strip photo location/metadata before training intake")
            image = ImageOps.exif_transpose(image).convert("RGB")
            pixel_pin = hashlib.sha256(str(image.size).encode() + image.tobytes()).hexdigest()
            require(pixel_pin not in pixels_seen, "Duplicate decoded image pixels")
            pixels_seen.add(pixel_pin)
            small = list(image.convert("L").resize((9, 8)).get_flattened_data())
            signature = sum(int(small[y * 9 + x] > small[y * 9 + x + 1]) << (y * 8 + x) for y in range(8) for x in range(8))
            require(not any(s != split and (signature ^ p).bit_count() <= 4 for p, s in fingerprints), "Near-duplicate across splits needs human resolution")
            fingerprints.append((signature, split))
        counts[split][row.get("recipe_id") if target == "recipe" else target] += 1
    return value, {"schema": "shift-recipe-pair-audit-1", "data_kind": value["data_kind"], "photos": len(samples),
        "counts": {s: dict(c) for s, c in counts.items()}, "rights_review_evidence_files": len(evidence_pins),
        "manifest_sha256": digest(manifest_path), "catalogue_sha256": digest(catalogue_path),
        "production_ready": False, "live_data_collected": False,
        "note": "Intake qualification verifies recorded evidence and bytes, not independent legal review or recipe accuracy."}


def unit(vector):
    require(isinstance(vector, list) and vector and all(type(x) in (int, float) and math.isfinite(x) for x in vector), "Finite feature vector required")
    norm = math.sqrt(sum(x * x for x in vector))
    require(norm > 1e-12, "Non-zero feature vector required")
    return [x / norm for x in vector]


def learn_prototypes(rows, features):
    """Only training photos contribute to centroids; no test/validation fitting."""
    require(len(rows) == len(features), "Features and rows differ")
    dimensions = len(features[0]) if features else 0
    sums, counts = {}, Counter()
    for row, vector in zip(rows, features):
        require(len(vector) == dimensions, "Consistent feature dimensions required")
        vector = unit(vector)
        if row["split"] != "train" or row["target"] != "recipe":
            continue
        label = row["recipe_id"]
        sums.setdefault(label, [0.] * dimensions)
        sums[label] = [a + b for a, b in zip(sums[label], vector)]
        counts[label] += 1
    require(len(sums) >= 2 and min(counts.values()) >= 3, "At least two recipes with three training photos each required")
    return {label: unit(sums[label]) for label in sorted(sums)}


def rank(vector, prototypes):
    vector = unit(vector)
    require(len(prototypes) >= 2 and all(len(v) == len(vector) for v in prototypes.values()), "Known feature dimension and two prototypes required")
    values = sorted(((label, sum(a * b for a, b in zip(vector, p))) for label, p in prototypes.items()), key=lambda x: (-x[1], x[0]))
    return {"recipe_id": values[0][0], "similarity": values[0][1], "margin": values[0][1] - values[1][1]}


def measure(predictions, rows, threshold, margin):
    require(len(predictions) == len(rows) and rows, "Non-empty matching evaluation rows required")
    require(math.isfinite(threshold) and -1 <= threshold <= 2 and math.isfinite(margin) and 0 <= margin <= 2, "Finite calibration required")
    accepted = correct = false_negative_accept = non_food_accept = other_food_accept = 0
    by_recipe = {r["recipe_id"]: {"support": 0, "predictions": 0, "correct": 0} for r in rows if r["target"] == "recipe"}
    positives = sum(r["target"] == "recipe" for r in rows)
    negatives = sum(r["target"] != "recipe" for r in rows)
    for prediction, row in zip(predictions, rows):
        require(math.isfinite(prediction["similarity"]) and math.isfinite(prediction["margin"]), "Finite ranked score required")
        take = prediction["similarity"] >= threshold and prediction["margin"] >= margin
        if row["target"] == "recipe":
            by_recipe[row["recipe_id"]]["support"] += 1
        if take:
            recipe_result = by_recipe.setdefault(prediction["recipe_id"], {"support": 0, "predictions": 0, "correct": 0})
            recipe_result["predictions"] += 1
            recipe_result["correct"] += int(row["target"] == "recipe" and prediction["recipe_id"] == row["recipe_id"])
        accepted += take
        correct += bool(take and row["target"] == "recipe" and prediction["recipe_id"] == row["recipe_id"])
        false_negative_accept += bool(take and row["target"] != "recipe")
        non_food_accept += bool(take and row["target"] == "non_food")
        other_food_accept += bool(take and row["target"] == "other_food")
    return {"photos": len(rows), "accepted": accepted, "correct_recipe": correct,
        "precision": correct / accepted if accepted else None, "recipe_recall": correct / positives if positives else None,
        "negative_photos": negatives, "negative_false_accepts": false_negative_accept,
        "negative_false_accept_rate": false_negative_accept / negatives if negatives else None,
        "non_food_false_accepts": non_food_accept, "other_food_false_accepts": other_food_accept,
        "coverage": accepted / len(rows), "recipes": {k: {**v,
            "precision": v["correct"] / v["predictions"] if v["predictions"] else None,
            "recall": v["correct"] / v["support"] if v["support"] else None} for k, v in sorted(by_recipe.items())}}


def calibrate_recipe(predictions, rows):
    require(rows and all(r["split"] == "validation" for r in rows), "Calibration uses validation only")
    # Require both kinds of negatives; no claimed rejection without examples.
    counts = Counter(r["target"] for r in rows)
    if counts["non_food"] < 5 or counts["other_food"] < 5:
        return {"threshold": 2., "margin": 0., "reason": "Five non-food and five other-food validation examples required"}
    choices = []
    for threshold in (x / 40 for x in range(-40, 41)):
        for margin in (0., .025, .05, .1, .15, .2):
            m = measure(predictions, rows, threshold, margin)
            supported = all(v["support"] >= 5 and v["predictions"] >= 3 and (v["precision"] or 0) >= .85 for v in m["recipes"].values())
            if supported and m["accepted"] >= 5 and (m["precision"] or 0) >= .9 and m["negative_false_accept_rate"] <= .05:
                choices.append((m["correct_recipe"], -m["accepted"], threshold, margin))
    if not choices:
        return {"threshold": 2., "margin": 0., "reason": "No validation setting meets precision/rejection floors"}
    _, _, threshold, margin = max(choices)
    return {"threshold": threshold, "margin": margin, "reason": "Validation-only selection; similarity is not probability"}


def train(manifest_path, catalogue_path, base, output, max_minutes):
    require(not output.exists(), "New artifact directory required")
    value, audit = qualify(manifest_path, catalogue_path)
    require(value["data_kind"] == "real_recipe_photos", "Fixture-only data cannot train a saved recipe artifact")
    counts = Counter(r["split"] for r in value["samples"])
    require(all(counts[s] for s in SPLITS), "Independent train/validation/test photos required")
    labels = {r["recipe_id"] for r in value["samples"] if r["target"] == "recipe"}
    require(len(labels) >= 2, "At least two checked recipes required")
    for label in labels:
        dishes = {r["dish_group"] for r in value["samples"] if r["target"] == "recipe" and r["recipe_id"] == label and r["split"] == "train"}
        validation_count = sum(r["target"] == "recipe" and r["recipe_id"] == label and r["split"] == "validation" for r in value["samples"])
        require(len(dishes) >= 3 and validation_count >= 5, "Each recipe needs three independent training dishes and five validation dishes")
    # Import expensive inference dependencies only after qualification succeeds.
    import torch
    from PIL import Image
    from semantic_model import encoder, view_tensors
    torch.set_num_threads(4)
    model, source = encoder(base)
    start = time.monotonic(); features = []
    for row in value["samples"]:
        require(time.monotonic() - start < max_minutes * 60, "Local training time budget reached")
        with Image.open(local_path(manifest_path.parent, row["path"])) as image, torch.inference_mode():
            features.append(model(pixel_values=view_tensors(image)[:1]).pooler_output[0].tolist())
    rows = value["samples"]
    prototypes = learn_prototypes(rows, features)
    predictions = [rank(v, prototypes) for v in features]
    select = lambda s: ([p for p, r in zip(predictions, rows) if r["split"] == s], [r for r in rows if r["split"] == s])
    vp, vr = select("validation"); calibration = calibrate_recipe(vp, vr)
    tp, tr = select("test")
    catalogue = catalogue_at(catalogue_path)
    report = {"schema": "shift-supervised-recipe-prototypes-1", "method": "Mean frozen visual features of checked training photos by exact recipe",
        "trained_recipes": len(prototypes), "encoder_updated": False, "training_photo_counts": dict(Counter(r["recipe_id"] for r in rows if r["split"] == "train" and r["target"] == "recipe")),
        "calibration": calibration, "validation": measure(vp, vr, calibration["threshold"], calibration["margin"]),
        "test": measure(tp, tr, calibration["threshold"], calibration["margin"]), "test_previously_inspected": value["test_previously_inspected"],
        "production_ready": False, "release_blockers": ["Research-only recipe prototype; independent UK acceptance and serving/privacy review still required"],
        "auto_save": False, "nutrition_predicted": False, "base_source": source, "data_audit": audit,
        "recipe_hashes": {k: catalogue[k]["content_sha256"] for k in prototypes},
        "seconds": round(time.monotonic() - start, 2)}
    output.mkdir(parents=True)
    (output / "prototypes.json").write_text(json.dumps(prototypes, allow_nan=False) + "\n")
    report["prototypes_sha256"] = digest(output / "prototypes.json")
    (output / "report.json").write_text(json.dumps(report, indent=2, allow_nan=False) + "\n")
    print(json.dumps(report))


class LearnedRecipeMatcher:
    def __init__(self, artifact, manifest, catalogue, base, *, research=False):
        require(research is True, "Research-only recipe model; production invocation refused")
        self.report = read_json(artifact / "report.json")
        require(self.report.get("schema") == "shift-supervised-recipe-prototypes-1" and self.report.get("production_ready") is False,
                "Known research artifact required")
        # Re-read recorded permission/review evidence at every local model load.
        # A withdrawn/changed receipt invalidates reuse rather than silently
        # keeping a derivative available. This is not a deployed deletion service.
        _, audit = qualify(manifest, catalogue)
        require(audit["data_kind"] == "real_recipe_photos", "Fixture-only data cannot serve a saved recipe artifact")
        require(audit == self.report["data_audit"], "Training data or permissions changed; rebuild before reuse")
        self.recipes = catalogue_at(catalogue)
        require(all(self.recipes.get(k, {}).get("content_sha256") == v for k, v in self.report["recipe_hashes"].items()), "Recipe version changed")
        require(digest(artifact / "prototypes.json") == self.report["prototypes_sha256"], "Learned prototype bytes changed")
        self.prototypes = read_json(artifact / "prototypes.json")
        require(set(self.prototypes) == set(self.report["recipe_hashes"]), "Recipe identities differ from report")
        self.prototypes = {k: unit(v) for k, v in self.prototypes.items()}
        import torch
        from semantic_model import encoder
        torch.set_num_threads(4)
        self.model, source = encoder(base)
        require(source == self.report["base_source"], "Wrong pinned visual encoder")

    def recognise(self, request):
        import io
        import torch
        from PIL import Image
        from core import parse_request
        from semantic_model import view_tensors
        raw = parse_request(request)
        with Image.open(io.BytesIO(raw)) as image, torch.inference_mode():
            require(image.format == "JPEG" and 8 <= min(image.size) and max(image.size) <= 768, "Resized JPEG required")
            vector = self.model(pixel_values=view_tensors(image)[:1]).pooler_output[0].tolist()
        match = rank(vector, self.prototypes)
        calibration = self.report["calibration"]
        accepted = match["similarity"] >= calibration["threshold"] and match["margin"] >= calibration["margin"]
        recipe = self.recipes[match["recipe_id"]]
        candidate = {"recipeId": recipe["id"], "recipeHash": recipe["content_sha256"], "title": recipe["title"],
                     "similarity": round(match["similarity"], 5)}
        return {"candidates": [candidate] if accepted else [], "abstained": not accepted,
                "requiresRecipeConfirmation": True, "requiresPortion": True, "canSelectNone": True,
                "autoSave": False, "nutrition": None, "scoreKind": "similarity_not_probability"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("qualify", "train", "predict"))
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--catalogue", type=Path, required=True)
    parser.add_argument("--base", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--artifact", type=Path)
    parser.add_argument("--research", action="store_true")
    parser.add_argument("--max-minutes", type=int, default=20, choices=range(1, 61))
    args = parser.parse_args()
    if args.command == "qualify":
        print(json.dumps(qualify(args.manifest, args.catalogue)[1], indent=2))
    elif args.command == "train":
        if not args.base or not args.output:
            parser.error("Training requires the pinned local base and new output directory")
        train(args.manifest, args.catalogue, args.base, args.output, args.max_minutes)
    else:
        if not args.base or not args.artifact:
            parser.error("Prediction requires local base and trained artifact")
        import sys
        raw = sys.stdin.buffer.read(1_100_001)
        require(len(raw) <= 1_100_000, "Bounded request required")
        matcher = LearnedRecipeMatcher(args.artifact, args.manifest, args.catalogue, args.base, research=args.research)
        print(json.dumps(matcher.recognise(json.loads(raw))))
