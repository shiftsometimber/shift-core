"""Actual RGB-only spatial-model reload through the existing gate verifier."""
import argparse
import json
from pathlib import Path

from spatial_model import GatedSpatialPredictor
from verify_gate import verify


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("candidate", "base", "gate", "manifest"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--research", action="store_true")
    a = parser.parse_args()
    result = verify(a.candidate, a.base, a.gate, a.manifest, research=a.research, predictor_factory=GatedSpatialPredictor)
    result["ungated"] = result["baseline"]
    result.update(inference_masks_required=False, inference_annotation_csv_required=False,
        test_ground_truth_crops_used=False, source_selection="Validation only; development test was previously inspected")
    print(json.dumps(result, indent=2))
