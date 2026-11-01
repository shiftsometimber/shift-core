"""Prevent a strong pooled score from concealing weak capture-week behaviour."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from spatial_calibration import grouped_threshold


class GroupedSpatialCalibrationChecks(unittest.TestCase):
    def test_one_week_of_perfect_predictions_is_insufficient(self):
        self.assertGreater(grouped_threshold([[.9]] * 20, [[1]] * 20, ["same-week"] * 20, 0), 1)

    def test_large_strong_week_cannot_hide_small_weak_week(self):
        scores = [[.9]] * 103
        targets = [[1]] * 102 + [[0]]
        groups = ["strong-week"] * 100 + ["weak-week"] * 3
        self.assertGreater(grouped_threshold(scores, targets, groups, 0), 1)

    def test_supported_predictions_across_weeks_can_qualify_for_research(self):
        threshold = grouped_threshold([[.9]] * 12, [[1]] * 12, ["week-a"] * 6 + ["week-b"] * 6, 0)
        self.assertLessEqual(threshold, 1)


if __name__ == "__main__":
    unittest.main()
