"""Holdout photos and missing per-image rights cannot enter auxiliary fitting."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from auxiliary_features import qualified_records


class AuxiliarySourceChecks(unittest.TestCase):
    def test_publisher_validation_photos_are_refused_for_training(self):
        with self.assertRaisesRegex(ValueError, "publisher-training"):
            qualified_records({"publisher_split": "validation", "validation_photos_used_for_training": 0, "records": []})

    def test_eligibility_flag_does_not_replace_original_photo_licence_evidence(self):
        receipt = {"publisher_split": "train", "validation_photos_used_for_training": 0,
            "records": [{"eligible_for_partial_positive_training": True, "publisher_split": "train",
                         "original_licence_verified": False, "original_page_declared_licences": []}]}
        with self.assertRaisesRegex(ValueError, "licence evidence"):
            qualified_records(receipt)


if __name__ == '__main__':
    unittest.main()
