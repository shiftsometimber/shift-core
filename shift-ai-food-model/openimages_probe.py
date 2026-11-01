"""Whole-photo known-positive challenge; partial object labels cannot score precision."""
import argparse
import base64
from collections import Counter
import json
from pathlib import Path

from core import digest, food_response

MAPPING = {"Cheese": "cheese", "Pizza": "pizza", "Pasta": "pasta", "Mushroom": "mushroom",
    "Bread": "bread", "Egg": "eggs", "Apple": "fruit_tree", "Tomato": "tomato",
    "Strawberry": "berry", "Cucumber": "cucumber", "Broccoli": "cruciferous",
    "Carrot": "root_vegetable", "Pear": "fruit_tree", "Potato": "tuber", "Banana": "fruit_tropical"}


def run(args):
    import torch
    from safetensors.torch import load_file
    from spatial_model import GatedSpatialPredictor
    from routed_learning import make_head, decisions, qualify, FAMILY
    receipt = json.loads((args.intake / "intake-receipt.json").read_text())
    rows = [r for r in receipt["outcomes"] if r["status"] == "image_downloaded_quarantined" and r["publisher_class"] in MAPPING]
    if not rows:
        raise ValueError("No rights-verified mapped positive photos")
    old_meta = qualify(args.incumbent, FAMILY)
    old_heads = torch.nn.ModuleDict({k: make_head(k, m) for k, m in old_meta["source_heads"].items()})
    old_heads.load_state_dict(load_file(args.incumbent / "head.safetensors"), strict=True); old_heads.eval()
    predictor = GatedSpatialPredictor(args.candidate, args.base, args.gate, research=args.research)
    # Fixed mapping/eligible image list above is frozen before any prediction.
    results = []
    for row in rows:
        path = args.intake / row["image_path"]
        if digest(path) != row["sha256"] or not row["original_licence_verified"]:
            raise ValueError("Rights or image integrity changed")
        request = {"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode(), "maxOutputTokens": 400}
        features = predictor.model.encode(request); gate = predictor.gate.inspect(features[1])
        new_scores = predictor.model.score_features(features)
        with torch.no_grad():
            old_scores = {k: torch.sigmoid(h(features[1]))[0].tolist() for k, h in old_heads.items()}
        old_decisions = decisions([old_scores], old_meta["rules"])[0]
        old_response = food_response(old_decisions, old_meta["labels"], old_meta["thresholds"]) if gate["accept"] else {"items": [], "nutrition": {}}
        response = food_response(new_scores, predictor.model.settings["labels"], predictor.model.settings["thresholds"]) if gate["accept"] else {"items": [], "nutrition": {}}
        expected = MAPPING[row["publisher_class"]]
        results.append({"image_id": row["image_id"], "expected_known_positive": expected,
            "publisher_class": row["publisher_class"], "gate_accept": gate["accept"],
            "incumbent_known_positive_hit": expected in old_response["items"], "spatial_known_positive_hit": expected in response["items"],
            "incumbent_items": old_response["items"], "spatial_items": response["items"], "image_sha256": row["sha256"]})
    return {"scope": "New-to-this-project publisher-validation whole-photo known-positive probe; not complete meal precision/recall or UK acceptance",
        "mapped_rights_verified_images": len(rows), "known_positive_mapping": MAPPING,
        "incumbent_known_positive_recall": sum(r["incumbent_known_positive_hit"] for r in results) / len(results),
        "spatial_known_positive_recall": sum(r["spatial_known_positive_hit"] for r in results) / len(results),
        "precision": None, "reason_precision_unknown": "Unlabelled foods are unknown, not false positives; publisher boxes do not give complete meal truth",
        "skipped_ambiguous_classes": dict(Counter(r["publisher_class"] for r in receipt["outcomes"] if r["status"] == "image_downloaded_quarantined" and r["publisher_class"] not in MAPPING)),
        "original_split_preserved": "validation; never used for own-model training",
        "oracle_boxes_or_masks_used_for_inference": False, "base_encoder_passes_per_image": 1,
        "base_pretraining_overlap_unknown": True, "independent_uk_acceptance": False,
        "training_admitted": 0, "unique_publisher_authors": len({r["author"] for r in rows}),
        "results": results, "production_ready": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("candidate", "incumbent", "base", "gate", "intake"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--research", action="store_true")
    print(json.dumps(run(parser.parse_args()), indent=2))
