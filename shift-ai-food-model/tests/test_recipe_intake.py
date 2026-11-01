"""Generated fixtures exercise intake, not real recipe training or accuracy."""
import json
from pathlib import Path
import random
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core import digest
from recipe_intake import prepare, label, export
from recipe_learning import qualify, train


class RecipeIntakeChecks(unittest.TestCase):
    def setup_data(self, root, count=2):
        catalogue = {"schema": "shift-recipe-recognition-catalogue-1",
            "source_kind": "governed_source_snapshot_not_live_database_readback",
            "recipes": [{"id": "beans", "content_sha256": "a" * 64, "title": "Beans on toast"},
                        {"id": "eggs", "content_sha256": "b" * 64, "title": "Eggs on toast"}]}
        cp = root / "catalogue.json"; cp.write_text(json.dumps(catalogue))
        source = root / "source"; source.mkdir()
        photos = []
        for i in range(count):
            rng = random.Random(i); image = Image.new("RGB", (96, 64))
            image.putdata([tuple(rng.randrange(256) for _ in range(3)) for _ in range(96 * 64)])
            image.save(source / ("private-original-" + str(i) + ".png"))
            photos.append({"id": "photo-" + str(i), "path": "private-original-" + str(i) + ".png", "recipe_hint": "beans"})
        batch = root / "import.json"; batch.write_text(json.dumps({"schema": "shift-recipe-photo-import-1", "data_kind": "fixture_only", "photos": photos}))
        out = root / "queue"
        prepare(batch, source, cp, out)
        return cp, source, batch, out / "queue.json"

    def permission(self, queue, identity, **changes):
        row = next(r for r in json.loads(queue.read_text())["photos"] if r["id"] == identity)
        proof = {"photo_sha256": row["sha256"], "active": True, "reviewed": True,
            "basis": "SHIFT-owned", "training_reuse": True, "evaluation_reuse": True,
            "attribution": "Generated test fixture, never food accuracy evidence", **changes}
        path = queue.parent / (identity + "-permission.json"); path.write_text(json.dumps(proof)); return path.name

    def review(self, queue, cp, identity, **changes):
        permission = changes.pop("permission", None)
        if permission is None:
            permission = self.permission(queue, identity)
        args = {"target": "recipe", "recipe_id": "beans", "split": "train", "capture_group": identity,
            "dish_group": identity, "source_group": identity, "permission": permission,
            "real_photo_confirmed": True, "ingredients_confirmed": True, "privacy_checked": True, **changes}
        return label(queue, cp, identity, **args)

    def test_preparation_strips_metadata_orients_resizes_and_leaves_source_intact(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, source, batch, queue = self.setup_data(root)
            image = Image.new("RGB", (900, 1600), "red")
            exif = Image.Exif(); exif[274] = 6; exif[270] = "Private fixture EXIF"
            original = source / "private-phone-name.jpg"; image.save(original, exif=exif)
            before = digest(original)
            batch.write_text(json.dumps({"schema": "shift-recipe-photo-import-1", "data_kind": "fixture_only",
                "photos": [{"id": "phone", "path": original.name}]}))
            result = prepare(batch, source, cp, root / "clean-queue")
            self.assertEqual(result["training_ready"], 0); self.assertEqual(digest(original), before)
            value = json.loads((root / "clean-queue/queue.json").read_text()); row = value["photos"][0]
            self.assertNotIn(original.name, json.dumps(value)); self.assertFalse(value["automatically_trainable"])
            with Image.open(root / "clean-queue" / row["path"]) as clean:
                self.assertEqual(clean.format, "JPEG"); self.assertFalse(clean.getexif())
                self.assertEqual(clean.size, (768, 432)); self.assertNotIn("exif", clean.info)

    def test_pending_queue_cannot_export_or_infer_confirmation(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, _, _, queue = self.setup_data(root)
            with self.assertRaisesRegex(ValueError, "No reviewed photos"):
                export(queue, cp, root / "dataset", test_previously_inspected=True)
            with self.assertRaisesRegex(ValueError, "Explicit real-photo"):
                self.review(queue, cp, "photo-0", privacy_checked=False)
            with self.assertRaisesRegex(ValueError, "ingredient confirmation"):
                self.review(queue, cp, "photo-0", ingredients_confirmed=False)
            self.assertFalse((queue.parent / "labels").exists())

    def test_existing_active_permission_is_required_before_review(self):
        for field in ("active", "reviewed", "training_reuse", "evaluation_reuse"):
            with self.subTest(field=field), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); cp, _, _, queue = self.setup_data(root)
                p = self.permission(queue, "photo-0", **{field: False})
                with self.assertRaisesRegex(ValueError, "permission"):
                    self.review(queue, cp, "photo-0", permission=p)

    def test_prepared_reviewed_exported_fixtures_qualify_but_never_train(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, _, _, queue = self.setup_data(root)
            self.review(queue, cp, "photo-0")
            receipt = export(queue, cp, root / "one", test_previously_inspected=True)
            self.assertEqual(receipt["exported_reviewed_photos"], 1); self.assertEqual(receipt["remaining_pending_photos"], 1)
            self.review(queue, cp, "photo-1", target="non_food", recipe_id=None, ingredients_confirmed=False, split="test")
            receipt = export(queue, cp, root / "two", test_previously_inspected=True)
            self.assertEqual(receipt["audit"]["photos"], 2)
            manifest, _ = qualify(root / "two/manifest.json", cp)
            self.assertEqual(manifest["data_kind"], "fixture_only")
            self.assertFalse(receipt["training_started"])
            with self.assertRaisesRegex(ValueError, "Fixture-only"):
                train(root / "two/manifest.json", cp, root / "absent-base", root / "absent-model", 1)

    def test_duplicates_and_failed_imports_leave_no_final_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, source, batch, _ = self.setup_data(root)
            value = json.loads(batch.read_text()); value["photos"][1]["path"] = value["photos"][0]["path"]
            batch.write_text(json.dumps(value))
            with self.assertRaisesRegex(ValueError, "Duplicate original"):
                prepare(batch, source, cp, root / "failed")
            self.assertFalse((root / "failed").exists())
            self.assertFalse(list(root.glob(".recipe-photo-import-*")))

    def test_export_rejects_capture_leak_and_never_publishes_partial_dataset(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, _, _, queue = self.setup_data(root)
            self.review(queue, cp, "photo-0", source_group="same-source")
            self.review(queue, cp, "photo-1", source_group="same-source", split="test")
            with self.assertRaisesRegex(ValueError, "leaks"):
                export(queue, cp, root / "bad-split", test_previously_inspected=True)
            self.assertFalse((root / "bad-split").exists())

    def test_photo_and_permission_changes_invalidate_export(self):
        for kind in ("photo", "permission"):
            with self.subTest(kind=kind), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); cp, _, _, queue = self.setup_data(root); self.review(queue, cp, "photo-0")
                path = queue.parent / ("images/photo-0.jpg" if kind == "photo" else "photo-0-permission.json")
                path.write_bytes(path.read_bytes() + b"\n")
                with self.assertRaisesRegex(ValueError, "bytes changed"):
                    export(queue, cp, root / "changed", test_previously_inspected=True)
                self.assertFalse((root / "changed").exists())

    def test_current_catalogue_and_no_overwrite_preserve_existing_reviews(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, source, batch, queue = self.setup_data(root)
            self.review(queue, cp, "photo-0")
            before = digest(queue.parent / "reviews/photo-0.json")
            with self.assertRaisesRegex(ValueError, "already reviewed"):
                self.review(queue, cp, "photo-0")
            self.assertEqual(digest(queue.parent / "reviews/photo-0.json"), before)
            with self.assertRaisesRegex(ValueError, "never overwritten"):
                prepare(batch, source, cp, queue.parent)
            cp.write_text(cp.read_text() + "\n")
            with self.assertRaisesRegex(ValueError, "catalogue changed"):
                export(queue, cp, root / "stale", test_previously_inspected=True)

    def test_source_paths_and_original_member_identifiers_are_rejected(self):
        for change in ({"path": "../outside.jpg"}, {"memberId": 123}):
            with self.subTest(change=change), tempfile.TemporaryDirectory() as directory:
                root = Path(directory); cp, source, batch, _ = self.setup_data(root)
                value = json.loads(batch.read_text()); value["photos"][0].update(change); batch.write_text(json.dumps(value))
                with self.assertRaises(ValueError): prepare(batch, source, cp, root / "bad")
                self.assertFalse((root / "bad").exists())

    def test_a_wrong_recipe_label_cannot_reuse_the_original_review(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, _, _, queue = self.setup_data(root); self.review(queue, cp, "photo-0")
            path = queue.parent / "labels/photo-0.json"; record = json.loads(path.read_text())
            record["sample"].update(recipe_id="eggs", recipe_hash="b" * 64); path.write_text(json.dumps(record))
            with self.assertRaisesRegex(ValueError, "Label review"):
                export(queue, cp, root / "wrong-label", test_previously_inspected=True)

    def test_oversized_source_is_rejected_without_copying_it(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, source, batch, _ = self.setup_data(root)
            large = source / "oversized.jpg"
            with large.open("wb") as stream: stream.truncate(30_000_001)
            batch.write_text(json.dumps({"schema": "shift-recipe-photo-import-1", "data_kind": "fixture_only",
                "photos": [{"id": "oversized", "path": large.name}]}))
            with self.assertRaisesRegex(ValueError, "30 MB"):
                prepare(batch, source, cp, root / "too-large")
            self.assertFalse((root / "too-large").exists())

    def test_animated_images_are_not_silently_reduced_to_one_training_frame(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); cp, source, batch, _ = self.setup_data(root)
            animation = source / "animated.png"
            Image.new("RGB", (16, 16), "red").save(animation, save_all=True,
                append_images=[Image.new("RGB", (16, 16), "blue")], duration=100, loop=0)
            batch.write_text(json.dumps({"schema": "shift-recipe-photo-import-1", "data_kind": "fixture_only",
                "photos": [{"id": "animation", "path": animation.name}]}))
            with self.assertRaisesRegex(ValueError, "Single JPEG"):
                prepare(batch, source, cp, root / "animated")
            self.assertFalse((root / "animated").exists())


if __name__ == "__main__":
    unittest.main()
