"""Training-mask provenance, palette identities and held-out isolation."""
from pathlib import Path
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from core import digest
from spatial_model import training_patch_targets, SpatialPredictor


class SpatialMaskChecks(unittest.TestCase):
    def test_validation_and_test_masks_cannot_enter_fitting(self):
        for split in ("validation", "test"):
            with self.assertRaisesRegex(ValueError, "Only training masks"):
                training_patch_targets({"split": split}, Path("missing"), [], [])

    def test_palette_colours_do_not_replace_ingredient_identities(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); (root / "masks").mkdir()
            image = Image.new("P", (640, 480), 7)
            image.putpalette([0] * 768)  # All colours look black; labels are still 7.
            path = root / "masks/dish_fixture.png"; image.save(path)
            row = {"id": "dish_fixture", "split": "train", "mask_sha256": digest(path)}
            annotations = [{"label_value": "7", "mask_pixels": str(640 * 480), "annotation_name": "poultry"}]
            targets = training_patch_targets(row, root, annotations, ["poultry", "rice"])
            self.assertEqual(len(targets), 196)
            self.assertTrue(all(t == [0, 1, 0] for t in targets))
            path.write_bytes(path.read_bytes() + b"changed")
            with self.assertRaisesRegex(ValueError, "mask changed"):
                training_patch_targets(row, root, annotations, ["poultry", "rice"])

    def test_mixed_region_patch_keeps_both_food_fractions(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory); (root / "masks").mkdir()
            image = Image.new("L", (640, 480), 9)
            image.paste(7, (0, 0, 160, 480))
            path = root / "masks/dish_fixture.png"; image.save(path)
            row = {"id": "dish_fixture", "split": "train", "mask_sha256": digest(path)}
            annotations = [{"label_value": "7", "mask_pixels": str(160 * 480), "annotation_name": "poultry"},
                           {"label_value": "9", "mask_pixels": str(480 * 480), "annotation_name": "rice"}]
            targets = training_patch_targets(row, root, annotations, ["poultry", "rice"])
            self.assertEqual(targets[3], [0, .5, .5])
            self.assertTrue(all(sum(t) == 1 for t in targets))

    def test_production_loading_refused_before_accessing_any_files(self):
        with self.assertRaisesRegex(ValueError, "research only"):
            SpatialPredictor(Path("missing"), Path("missing"))


if __name__ == "__main__":
    unittest.main()
