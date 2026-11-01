"""Generated JPEG/vector fixtures test contracts, never recipe accuracy."""
import copy
import json
from pathlib import Path
import random
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core import digest
from recipe_learning import (SCHEMA, LearnedRecipeMatcher, qualify, learn_prototypes,
                             rank, measure, calibrate_recipe, train)


class RecipeLearningChecks(unittest.TestCase):
    def setup_data(self, root):
        catalogue = {"schema": "shift-recipe-recognition-catalogue-1",
            "source_kind": "governed_source_snapshot_not_live_database_readback",
            "recipes": [{"id": "beans", "content_sha256": "a" * 64, "title": "Beans"},
                        {"id": "eggs", "content_sha256": "b" * 64, "title": "Eggs"}]}
        cp = root / "catalogue.json"; cp.write_text(json.dumps(catalogue))
        rows = []
        for i, split in enumerate(("train", "validation", "test")):
            image = Image.new("RGB", (64, 64)); rng = random.Random(i)
            image.putdata([tuple(rng.randrange(256) for _ in range(3)) for _ in range(64 * 64)])
            image.save(root / (split + ".jpg"), quality=90)
            rows.append({"id": split, "path": split + ".jpg", "sha256": digest(root / (split + ".jpg")),
                "split": split, "capture_group": "capture-" + split, "dish_group": "dish-" + split,
                "source_group": "source-" + split, "image_kind": "real_photo", "target": "recipe",
                "recipe_id": "beans", "recipe_hash": "a" * 64})
        manifest = {"schema": SCHEMA, "data_kind": "fixture_only", "catalogue_sha256": digest(cp),
            "test_previously_inspected": True, "samples": rows}
        self.proofs(root, manifest)
        return manifest, cp

    def proofs(self, root, manifest):
        for row in manifest["samples"]:
            checked = {k: row.get(k) for k in ("target", "recipe_id", "recipe_hash")}
            checked.update(photo_sha256=row["sha256"], checked=True, ingredients_match=row["target"] == "recipe")
            rights = {"active": True, "basis": "SHIFT-owned", "photo_sha256": row["sha256"],
                "training_reuse": True, "evaluation_reuse": True, "reviewed": True}
            rp, lp = row["id"] + "-rights.json", row["id"] + "-review.json"
            (root / rp).write_text(json.dumps(rights)); (root / lp).write_text(json.dumps(checked))
            row["rights"] = {"basis": "SHIFT-owned", "evidence": rp, "sha256": digest(root / rp),
                "attribution": "Generated test fixture; not a real food photo or accuracy evidence"}
            row["review"] = {"checked": True, "ingredients_match": row["target"] == "recipe",
                "evidence": lp, "sha256": digest(root / lp)}

    def save(self, root, value):
        p = root / "pairs.json"; p.write_text(json.dumps(value)); return p

    def test_qualified_fixture_is_explicit_and_never_trains_an_artifact(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); value, cp = self.setup_data(root); mp = self.save(root, value)
            _, audit = qualify(mp, cp)
            self.assertEqual(audit["photos"], 3); self.assertEqual(audit["data_kind"], "fixture_only")
            with self.assertRaisesRegex(ValueError, "Fixture-only"):
                train(mp, cp, root / "unused-base", root / "not-created", 1)
            self.assertFalse((root / "not-created").exists())

    def test_recipe_version_and_ingredient_review_must_match(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); value, cp = self.setup_data(root)
            value["samples"][0]["recipe_hash"] = "c" * 64
            with self.assertRaisesRegex(ValueError, "version changed"):
                qualify(self.save(root, value), cp)
            value, cp = self.setup_data(root); value["samples"][0]["review"]["ingredients_match"] = False
            with self.assertRaisesRegex(ValueError, "ingredients"):
                qualify(self.save(root, value), cp)

    def test_capture_dish_and_source_groups_cannot_cross_splits(self):
        for key in ("capture_group", "dish_group", "source_group"):
            with self.subTest(key=key), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); value, cp = self.setup_data(root)
                value["samples"][1][key] = value["samples"][0][key]
                with self.assertRaisesRegex(ValueError, "leaks"):
                    qualify(self.save(root, value), cp)

    def test_raw_and_reencoded_duplicate_photos_are_rejected(self):
        for suffix, message in ((b"", "Duplicate image bytes"), (b"trailing-fixture-bytes", "Duplicate decoded")):
            with self.subTest(message=message), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); value, cp = self.setup_data(root)
                (root / "validation.jpg").write_bytes((root / "train.jpg").read_bytes() + suffix)
                value["samples"][1]["sha256"] = digest(root / "validation.jpg"); self.proofs(root, value)
                with self.assertRaisesRegex(ValueError, message):
                    qualify(self.save(root, value), cp)

    def test_near_duplicate_across_splits_is_not_blind_evaluation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); value, cp = self.setup_data(root)
            with Image.open(root / "train.jpg") as image: image.save(root / "validation.jpg", quality=88)
            value["samples"][1]["sha256"] = digest(root / "validation.jpg"); self.proofs(root, value)
            with self.assertRaisesRegex(ValueError, "Near-duplicate"):
                qualify(self.save(root, value), cp)

    def test_revoked_or_unscoped_permission_is_rejected_even_with_updated_pin(self):
        for key in ("active", "training_reuse", "evaluation_reuse", "reviewed"):
            with self.subTest(key=key), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); value, cp = self.setup_data(root); row = value["samples"][0]
                path = root / row["rights"]["evidence"]; proof = json.loads(path.read_text()); proof[key] = False
                path.write_text(json.dumps(proof)); row["rights"]["sha256"] = digest(path)
                with self.assertRaisesRegex(ValueError, "permission"):
                    qualify(self.save(root, value), cp)

    def test_photo_label_review_cannot_be_reused_for_a_different_photo(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); value, cp = self.setup_data(root)
            value["samples"][1]["review"] = copy.deepcopy(value["samples"][0]["review"])
            with self.assertRaisesRegex(ValueError, "Label review"):
                qualify(self.save(root, value), cp)

    def test_generated_photos_member_ids_and_stale_catalogues_are_rejected(self):
        cases = [("image_kind", "ai_generated", "Real photos"), ("memberId", 123, "identity")]
        for field, val, message in cases:
            with self.subTest(field=field), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); value, cp = self.setup_data(root); value["samples"][0][field] = val
                with self.assertRaisesRegex(ValueError, message): qualify(self.save(root, value), cp)
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); value, cp = self.setup_data(root); cp.write_text(cp.read_text() + "\n")
            with self.assertRaisesRegex(ValueError, "pinned catalogue"): qualify(self.save(root, value), cp)

    def test_image_paths_and_location_metadata_are_checked(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); value, cp = self.setup_data(root); value["samples"][0]["path"] = "../escape.jpg"
            with self.assertRaisesRegex(ValueError, "inside"): qualify(self.save(root, value), cp)
            value, cp = self.setup_data(root)
            with Image.open(root / "train.jpg") as image:
                exif = Image.Exif(); exif[270] = "private fixture metadata"
                image.save(root / "train-private.jpg", exif=exif)
            value["samples"][0].update(path="train-private.jpg", sha256=digest(root / "train-private.jpg")); self.proofs(root, value)
            with self.assertRaisesRegex(ValueError, "metadata"): qualify(self.save(root, value), cp)

    def learned(self):
        rows = [{"split": "train", "target": "recipe", "recipe_id": label} for label in ("beans",) * 3 + ("eggs",) * 3]
        return rows, [[1., 0.]] * 3 + [[0., 1.]] * 3

    def test_recipe_prototypes_learn_from_train_only(self):
        rows, features = self.learned(); expected = learn_prototypes(rows, features)
        rows += [{"split": "test", "target": "recipe", "recipe_id": "beans"}, {"split": "validation", "target": "recipe", "recipe_id": "eggs"}]
        features += [[0., 1.], [1., 0.]]
        self.assertEqual(learn_prototypes(rows, features), expected)
        self.assertEqual(rank([1., 0.], expected)["recipe_id"], "beans")
        self.assertEqual(rank([0., 1.], expected)["recipe_id"], "eggs")
        with self.assertRaisesRegex(ValueError, "three training"): learn_prototypes(rows[:4], features[:4])

    def test_calibration_needs_validation_and_both_negative_types(self):
        rows, features = self.learned(); prototypes = learn_prototypes(rows, features)
        val = [{"split": "validation", "target": "recipe", "recipe_id": "beans"}] * 6
        predictions = [rank([1., 0.], prototypes)] * 6
        self.assertEqual(calibrate_recipe(predictions, val)["threshold"], 2.)
        val += [{"split": "validation", "target": "recipe", "recipe_id": "eggs"}] * 6
        predictions += [rank([0., 1.], prototypes)] * 6
        for kind in ("non_food", "other_food"):
            val += [{"split": "validation", "target": kind}] * 5
            predictions += [rank([1., 1.], prototypes)] * 5
        selected = calibrate_recipe(predictions, val)
        result = measure(predictions, val, selected["threshold"], selected["margin"])
        self.assertEqual(result["precision"], 1.); self.assertEqual(result["negative_false_accepts"], 0)
        with self.assertRaisesRegex(ValueError, "validation only"):
            calibrate_recipe(predictions, [{**r, "split": "test"} for r in val])

    def test_repeated_evaluation_dish_does_not_inflate_the_test(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); value, cp = self.setup_data(root)
            row = copy.deepcopy(value["samples"][1]); row["id"] = "repeat"; value["samples"].append(row)
            with self.assertRaisesRegex(ValueError, "one evaluation photo"):
                qualify(self.save(root, value), cp)

    def test_good_recipe_cannot_hide_an_unsupported_or_wrong_recipe(self):
        rows = [{"split": "validation", "target": "recipe", "recipe_id": "beans"}] * 50
        predictions = [{"recipe_id": "beans", "similarity": .99, "margin": .8}] * 50
        rows += [{"split": "validation", "target": "recipe", "recipe_id": "eggs"}] * 5
        predictions += [{"recipe_id": "beans", "similarity": .99, "margin": .8}] * 5
        for kind in ("non_food", "other_food"):
            rows += [{"split": "validation", "target": kind}] * 5
            predictions += [{"recipe_id": "beans", "similarity": .2, "margin": .01}] * 5
        self.assertEqual(calibrate_recipe(predictions, rows)["threshold"], 2.)

    def test_wrong_recipe_counts_as_error_and_zero_coverage_is_not_perfect_precision(self):
        rows = [{"target": "recipe", "recipe_id": "beans"}, {"target": "non_food"}]
        predictions = [{"recipe_id": "eggs", "similarity": .99, "margin": .8}] * 2
        result = measure(predictions, rows, .9, .1)
        self.assertEqual(result["precision"], 0); self.assertEqual(result["non_food_false_accepts"], 1)
        self.assertIsNone(measure(predictions, rows, 2., 0.)["precision"])

    def test_production_invocation_refuses_before_reading_files(self):
        with self.assertRaisesRegex(ValueError, "production invocation refused"):
            LearnedRecipeMatcher(Path("absent"), Path("absent"), Path("absent"), Path("absent"))


if __name__ == "__main__":
    unittest.main()
