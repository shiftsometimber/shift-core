"""Unlabelled or contradictory public objects cannot become negative food truth."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from nonfood_benchmark import FOOD, verified_negative_ids


class NonFoodTruthChecks(unittest.TestCase):
    def test_explicit_human_negative_required_and_contradictions_removed(self):
        rows = [{"ImageID": "a", "Source": "verification", "LabelName": FOOD, "Confidence": "0"},
                {"ImageID": "b", "Source": "machine", "LabelName": FOOD, "Confidence": "0"},
                {"ImageID": "c", "Source": "verification", "LabelName": FOOD, "Confidence": "0"},
                {"ImageID": "c", "Source": "verification", "LabelName": "pizza", "Confidence": "1"},
                {"ImageID": "d", "Source": "verification", "LabelName": "car", "Confidence": "1"}]
        self.assertEqual(verified_negative_ids(rows, {FOOD, "pizza"}), {"a"})


if __name__ == '__main__':
    unittest.main()
