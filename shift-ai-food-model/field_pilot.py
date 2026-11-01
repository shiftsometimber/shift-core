"""Prepare a source-pinned UK meal collection brief, never consent or photos."""
import argparse
import json
from pathlib import Path
import re

from core import digest

FORMATS = ("on-toast", "egg-toast", "omelette", "overnight-oats", "protein-oats", "yoghurt-pot",
    "fruit-and-yoghurt", "fruit-and-nuts", "breakfast-wrap", "breakfast-buttie", "breakfast-hash",
    "breakfast-toastie", "sandwich", "wrap", "toastie", "bagel", "jacket-potato", "potato-hash",
    "pasta", "pasta-bake", "pasta-pot", "curry", "chilli", "slow-cooker", "stir-fry", "rice-bowl",
    "meal-prep-bowl", "grain-salad", "salad", "roast", "traybake", "burger", "pizza", "kebab",
    "loaded-fries", "pitta", "wholemeal-wrap", "work-snack-box", "protein-pot", "dessert-pot")


def prepare(catalogue_path):
    catalogue = json.loads(catalogue_path.read_text())
    if catalogue.get("schema") != "shift-recipe-recognition-catalogue-1" or catalogue.get("source_kind") != "governed_source_snapshot_not_live_database_readback":
        raise ValueError("Governed recipe source snapshot required")
    chosen = []
    for family in FORMATS:
        eligible = [r for r in catalogue["recipes"] if r["food_format"] == family]
        if not eligible:
            raise ValueError("Missing governed recipe family: " + family)
        recipe = min(eligible, key=lambda r: ({"everyday": 0, "uk_core": 1, "uk_full": 2}.get(r["publication"], 9), len(r["title"]), r["id"]))
        if not re.fullmatch(r"[0-9a-f]{64}", recipe["content_sha256"]):
            raise ValueError("Versioned recipe content required")
        chosen.append({"family": family, "example_recipe_id": recipe["id"], "title": recipe["title"],
            "recipe_sha256": recipe["content_sha256"], "publication": recipe["publication"],
            "independent_cook_sessions_requested": 25, "planning_session_quotas": {"train": 15, "validation": 5, "blind_test": 5},
            "views_per_session": 3, "training_qualified_photos": 0,
            "current_reference_usable_as_real_validation_photo": False})
    return {"schema": "shift-food-uk-field-pilot-plan-1", "status": "PREPARED_COLLECTION_BRIEF_ONLY",
        "catalogue_sha256": digest(catalogue_path), "catalogue_source": catalogue["source_kind"],
        "selection": "Forty distinct formats; source/short-title selection, not measured member popularity",
        "families": chosen, "total_planned_sessions": 1000, "total_planned_photos": 3000,
        "planned_blind_sessions": 200,
        "stages": [{"stage": "collection_method_pilot", "formats": list(FORMATS[:12]), "sessions_per_family": 5,
            "photos": 180, "acceptance_evidence": False},
            {"stage": "scale_if_pilot_qualified", "families": 40, "sessions": 1000, "photos": 3000,
             "acceptance_evidence": "200 blind cook sessions is initial development acceptance scope, not proof of 99.99%; actual source-group quotas must be verified"}],
        "required_photo_record": {"file": None, "sha256": None, "recipe_id": None, "recipe_sha256": None,
            "visible_components": None, "unknown_or_occluded_components": None, "substitutions": None,
            "portion_evidence": None, "capture_group": None, "source_group": None,
            "rights_receipt": None, "training_permission": None, "independent_label_review": None, "split": None},
        "photo_views": ["natural phone view", "overhead", "oblique; include a non-identifying size reference if available"],
        "non_food_plan": {"minimum_independent_examples": 100,
            "groups": ["empty plates", "utensils and tables", "documents and screens", "unrelated household objects"],
            "real_photos_collected": 0},
        "controls": ["Current recipe version must be revalidated before use; this catalogue is a source snapshot",
            "Existing illustrative/stale recipe images cannot become real evaluation evidence",
            "All views of a cook session and all captures from a source group stay in one split",
            "Choose the primary test view before model results; report all-view performance with capture clustering",
            "Maintain minimum per-advertised-class blind support; quotas alone cannot establish this",
            "Exact recipe target only if recipe/version/ingredients match; changed ingredients get variant/component labels",
            "Visible food labels and hidden recipe ingredients are separate fields",
            "Two independent label reviews for blind acceptance; disagreements resolved before freezing truth",
            "Explicit source rights and separate training permission required; diary confirmation is not training consent",
            "Do not move development-test errors into training", "No generated image is a real-photo test",
            "No faces, identifiers or location metadata in research examples"],
        "photos_collected": 0, "contacts_or_requests_sent": 0, "costs_committed": 0,
        "training_ready": False, "production_ready": False}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("catalogue", type=Path)
    print(json.dumps(prepare(parser.parse_args().catalogue), indent=2))
