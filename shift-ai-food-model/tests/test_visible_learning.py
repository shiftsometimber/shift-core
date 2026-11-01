"""Guard against false data joins and unsafe narrowing; no accuracy fixtures."""
import io
from pathlib import Path
import sys
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from visible_learning import check_mask, target_labels, baseline_decisions, load_visible_predictor


class VisibleLearningChecks(unittest.TestCase):
    def mask(self, *, extra=False, size=(640, 480)):
        image = Image.new("L", size)
        image.putpixel((0, 0), 1)
        if extra:
            image.putpixel((1, 0), 2)
        stream = io.BytesIO(); image.save(stream, "PNG"); return stream.getvalue()

    def test_wrong_mask_counts_labels_and_dimensions_fail(self):
        rows = [{"label_value": "1", "mask_pixels": "1"}]
        self.assertEqual(len(check_mask(self.mask(), rows)), 64)
        for raw, annotation in ((self.mask(extra=True), rows), (self.mask(size=(320, 240)), rows),
                                (self.mask(), [{"label_value": "1", "mask_pixels": "2"}])):
            with self.assertRaises(ValueError):
                check_mask(raw, annotation)

    def test_coarse_targets_are_never_narrowed_to_chicken_or_beef(self):
        rows = [{"annotation_name": x} for x in ("poultry", "meat_red", "cruciferous", "egg", "egg_whites")]
        self.assertEqual(target_labels(rows), ["cruciferous", "eggs", "meat_red", "poultry"])

    def test_shared_baseline_uses_original_decisions_before_pooling(self):
        # Cauliflower can pass its own cutoff while broccoli fails its cutoff.
        # Unsupported old classes remain disabled even with a probability of 1.
        actual = baseline_decisions([[.5, .9, 1]], ["cauliflower", "broccoli", "chicken"],
            [.3, .95, 1.01], ["cruciferous", "poultry"])
        self.assertEqual(actual, [[1, 0]])

    def test_no_accidental_production_loading(self):
        with self.assertRaisesRegex(ValueError, "research only"):
            load_visible_predictor(Path("missing"), Path("missing"))


if __name__ == "__main__":
    unittest.main()
