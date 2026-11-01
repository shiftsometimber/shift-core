"""Prevent selective reporting from manufacturing a 99.99% claim."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from quality_contract import count_foods, assess, zero_error_required


class QualityContractChecks(unittest.TestCase):
    def test_abstaining_or_disabling_a_hard_food_does_not_remove_the_miss(self):
        result = count_foods([[.99, .99], [0, 0]], [[1, 1], [1, 1]], [.9, 1.01], ["eggs", "rice"])
        self.assertEqual(result["true_positive"], 1)
        self.assertEqual(result["false_negative"], 3)
        self.assertEqual(result["precision"], 1)
        self.assertEqual(result["recall"], .25)
        self.assertEqual(result["photos_without_suggestions"], 1)
        self.assertFalse(assess(result)["point_target_met"])

    def test_perfect_small_development_set_cannot_verify_the_claim(self):
        result = count_foods([[1]] * 208, [[1]] * 208, [.5], ["food group"])
        assessment = assess(result)
        self.assertTrue(assessment["point_target_met"])
        self.assertFalse(assessment["claim_verified"])
        self.assertFalse(assessment["production_approval"])
        self.assertGreater(zero_error_required(), 29000)
        self.assertGreater(zero_error_required(simultaneous_metrics=2), zero_error_required())

    def test_empty_suggestions_cannot_get_perfect_precision(self):
        result = count_foods([[0]], [[1]], [.5], ["rice"])
        self.assertIsNone(result["precision"])
        self.assertFalse(assess(result)["point_target_met"])

    def test_unshown_classifier_outputs_do_not_inflate_recall(self):
        result = count_foods([[1] * 16], [[1] * 16], [.5] * 16, ["food " + str(i) for i in range(16)])
        self.assertEqual(result["predicted_components"], 12)
        self.assertEqual(result["false_negative"], 4)
        self.assertEqual(result["recall"], .75)


if __name__ == "__main__":
    unittest.main()
