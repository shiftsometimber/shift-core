"""Acquire rights-checked human-negative photos and measure real false foods.

Fixed validation cohort, no classifier/gate tuning, no assumed negatives from
unlabelled objects. This is a public diagnostic, not independent UK acceptance.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import html
import json
from pathlib import Path
import time

from core import digest
from openimages_intake import cc_by_2, LicenceLinks, download_verified
from prepare import Downloader

FOOD = "/m/02wbm"
LABELS = "https://storage.googleapis.com/openimages/v5/validation-annotations-human-imagelabels-boxable.csv"
HIERARCHY = "https://storage.googleapis.com/openimages/2018_04/bbox_labels_600_hierarchy.json"


def food_subtree(node):
    if node.get("LabelName") == FOOD:
        def collect(n):
            return {n["LabelName"]}.union(*(collect(c) for c in n.get("Subcategory", [])))
        return collect(node)
    for child in node.get("Subcategory", []):
        result = food_subtree(child)
        if result:
            return result
    return set()


def verified_negative_ids(rows, descendants):
    negative, contradictory = set(), set()
    for row in rows:
        if row.get("Source") not in ("verification", "crowdsource-verification"):
            continue
        if row.get("LabelName") == FOOD and row.get("Confidence") == "0":
            negative.add(row["ImageID"])
        if row.get("LabelName") in descendants and row.get("Confidence") == "1":
            contradictory.add(row["ImageID"])
    return negative - contradictory


def run(args):
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    args.output.mkdir(parents=True, exist_ok=False); (args.output / "images").mkdir()
    budget = Downloader(400_000_000)
    raw = budget.read(LABELS, limit=80_000_000); (args.output / "human-labels.csv").write_bytes(raw)
    hierarchy = budget.read(HIERARCHY, limit=1_000_000); (args.output / "hierarchy.json").write_bytes(hierarchy)
    descendants = food_subtree(json.loads(hierarchy))
    if len(descendants) < 5:
        raise ValueError("Publisher food hierarchy missing; do not infer negatives")
    identities = verified_negative_ids(csv.DictReader(raw.decode().splitlines()), descendants)
    rights = {r["ImageID"]: r for r in csv.DictReader((args.validation_intake / "metadata/image-rights.csv").open())}
    training = json.loads((args.training_intake / "training-intake-receipt.json").read_text())
    excluded_groups = {r["source_group"] for r in training["records"] if r.get("eligible_for_partial_positive_training")}
    held = json.loads((args.validation_intake / "intake-receipt.json").read_text())
    excluded_ids = {r["image_id"] for r in held["outcomes"]}
    selected = []
    for identity in sorted(identities - excluded_ids):
        r = rights.get(identity)
        if not r or not cc_by_2(r.get("License", "")) or not r.get("Author"):
            continue
        author = r.get("AuthorProfileURL", "").rstrip("/")
        group = "openimages-author:" + hashlib.sha256(author.encode()).hexdigest()
        landing = r.get("OriginalLandingURL", "").replace("http://", "https://")
        if not author or group in excluded_groups or not landing.startswith("https://www.flickr.com/photos/"):
            continue
        selected.append({"image_id": identity, "publisher_split": "validation", "publisher_class": "human-verified Food absent",
            "source_group": group, "original_landing_url": landing, "author": r["Author"], "title": r.get("Title", ""),
            "licence": r["License"], "publisher_rotation": r["Rotation"], "training_ready": False})
        if len(selected) == 140:
            break
    print(json.dumps({"stage": "nonfood_licence_checks", "candidates": len(selected), "food_hierarchy_classes": len(descendants)}), flush=True)
    def inspect(r):
        if time.monotonic() > deadline:
            return {**r, "status": "budget_expired"}
        try:
            page = budget.read(r["original_landing_url"], limit=4_000_000)
            parser = LicenceLinks(); parser.feed(html.unescape(page.decode("utf-8", errors="replace")))
            result = {**r, "original_page_sha256": hashlib.sha256(page).hexdigest(),
                "original_page_declared_licences": sorted(parser.links),
                "original_licence_verified": any(cc_by_2(link) for link in parser.links)}
            if not result["original_licence_verified"]:
                return {**result, "status": "licence_unverified"}
            return download_verified(result, args.output, budget)
        except Exception as error:
            return {**r, "status": "source_check_failed", "error_type": type(error).__name__}
    outcomes = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(inspect, selected):
            outcomes.append(result)
            status = {"stage": "nonfood_intake", "checked": len(outcomes), "selected": len(selected),
                "downloaded": sum(r["status"] == "image_downloaded_quarantined" for r in outcomes)}
            (args.output / "progress.json").write_text(json.dumps(status, indent=2) + "\n")
            if len(outcomes) % 10 == 0:
                print(json.dumps(status), flush=True)
    # Eligible order is fixed before seeing a model result. No cherry-picking.
    chosen = [r for r in outcomes if r["status"] == "image_downloaded_quarantined"][:100]
    acquisition = {"schema": "shift-public-nonfood-acquisition-1", "human_labels_source": LABELS,
        "human_labels_sha256": digest(args.output / "human-labels.csv"), "hierarchy_source": HIERARCHY,
        "hierarchy_sha256": digest(args.output / "hierarchy.json"), "verified_food_absent_ids": len(identities),
        "outcomes": outcomes, "selected_for_diagnostic": [r["image_id"] for r in chosen],
        "training_photos_or_authors_used": 0, "member_photos": 0, "fee_paid": False,
        "production_ready": False, "independent_uk_acceptance": False,
        "limitations": ["Publisher human negatives need independent adjudication before formal acceptance",
            "Public data; base pretraining overlap unknown", "No gate threshold or model selected using this diagnostic"]}
    (args.output / "acquisition.json").write_text(json.dumps(acquisition, indent=2) + "\n")
    if not chosen:
        raise ValueError("No rights-qualified human-negative photos; acquisition receipt retained")
    print(json.dumps({"stage": "nonfood_inference", "images": len(chosen)}), flush=True)
    from spatial_model import GatedSpatialPredictor
    import base64
    model = GatedSpatialPredictor(args.candidate, args.base, args.gate, research=args.research)
    evaluated = []
    for row in chosen:
        path = args.output / row["image_path"]
        if digest(path) != row["sha256"]:
            raise ValueError("Diagnostic photo changed")
        try:
            response, gate, _ = model.inspect({"task": "recognise_food", "image": "data:image/jpeg;base64," + base64.b64encode(path.read_bytes()).decode(), "maxOutputTokens": 400})
            evaluated.append({"image_id": row["image_id"], "gate_false_accept": gate["accept"],
                "false_food_suggestion": bool(response["items"]), "items": response["items"], "unavailable": False})
        except Exception as error:
            evaluated.append({"image_id": row["image_id"], "unavailable": True, "error_type": type(error).__name__})
    available = [r for r in evaluated if not r["unavailable"]]
    report = {"scope": "Fixed public human-negative food-rejection diagnostic, not UK or 99.99% acceptance",
        "images": len(chosen), "available": len(available), "unavailable": len(chosen) - len(available),
        "gate_false_accept_rate_on_available": sum(r["gate_false_accept"] for r in available) / len(available) if available else None,
        "false_food_suggestion_rate_on_available": sum(r["false_food_suggestion"] for r in available) / len(available) if available else None,
        "unavailable_counted_as_correct_rejection": False, "thresholds_changed": False, "model_tuned_on_this_set": False,
        "candidate": args.candidate.name, "acquisition_sha256": digest(args.output / "acquisition.json"),
        "results": evaluated, "production_ready": False, "seconds": time.monotonic() - start}
    (args.output / "benchmark.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"stage": "complete", "images": len(chosen), "false_food_suggestion_rate": report["false_food_suggestion_rate_on_available"]}), flush=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("output", "validation-intake", "training-intake", "candidate", "base", "gate"):
        p.add_argument("--" + name, type=Path, required=True)
    p.add_argument("--max-minutes", type=int, default=15, choices=range(1, 21)); p.add_argument("--research", action="store_true")
    run(p.parse_args())
