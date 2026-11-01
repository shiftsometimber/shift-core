"""Unlabelled or contradictory public objects cannot become negative food truth."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from nonfood_benchmark import FOOD, verified_negative_ids, unreviewed_report


class NonFoodTruthChecks(unittest.TestCase):
    def test_explicit_human_negative_required_and_contradictions_removed(self):
        rows = [{"ImageID": "a", "Source": "verification", "LabelName": FOOD, "Confidence": "0"},
                {"ImageID": "b", "Source": "machine", "LabelName": FOOD, "Confidence": "0"},
                {"ImageID": "c", "Source": "verification", "LabelName": FOOD, "Confidence": "0"},
                {"ImageID": "c", "Source": "verification", "LabelName": "pizza", "Confidence": "1"},
                {"ImageID": "d", "Source": "verification", "LabelName": "car", "Confidence": "1"}]
        self.assertEqual(verified_negative_ids(rows, {FOOD, "pizza"}), {"a"})

    def test_food_class_absence_alone_cannot_produce_a_valid_false_food_rate(self):
        report = unreviewed_report([{"image_id": "a", "unavailable": False, "food_suggestion": True,
            "gate_accept": True, "items": ["eggs"]}], "fixture", "a" * 64)
        self.assertIsNone(report["valid_false_food_suggestion_rate"])
        self.assertFalse(report["food_absence_truth_adjudicated"])
        self.assertEqual(report["food_suggestion_fraction_on_candidates"], 1)


if __name__ == '__main__':
    unittest.main()
