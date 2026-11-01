"""Bounded acquisition of separate publisher-training food positives.

Reads explicitly marked CSV prefixes instead of bulk downloading the dataset.
Unlabelled foods are unknown. Publisher validation photos/authors are excluded.
This prepares partial-positive training data, never complete meal ground truth.
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import html
import io
import json
from pathlib import Path
import time
import urllib.request

from core import digest
from openimages_intake import cc_by_2, LicenceLinks, download_verified
from openimages_probe import MAPPING
from prepare import Downloader

BOXES = "https://storage.googleapis.com/openimages/v6/oidv6-train-annotations-bbox.csv"
RIGHTS = "https://storage.googleapis.com/openimages/2018_04/train/train-images-boxable-with-rotation.csv"


def prefix(url, path, maximum):
    request = urllib.request.Request(url, headers={"Range": f"bytes=0-{maximum-1}", "User-Agent": "ShiftFoodResearch/1.0"})
    with urllib.request.urlopen(request, timeout=45) as response:
        raw = response.read(maximum)
        content_range = response.headers.get("Content-Range")
    # These are prefixes, never represented as the full publisher CSV.
    path.write_bytes(raw)
    return {"url": url, "file": path.name, "bytes": len(raw), "sha256": digest(path),
        "content_range": content_range, "full_file_downloaded": False}


def rows(path):
    reader = csv.DictReader(io.StringIO(path.read_text()), strict=True)
    while True:
        try:
            row = next(reader)
            if None in row or any(value is None for value in row.values()):
                return
            yield row
        except StopIteration:
            return
        except csv.Error:
            # A byte prefix can stop inside the final quoted record.
            return


def matched_rights(path, wanted, maximum=700_000_000):
    """Credit rows are not ID-sorted: stream to matching IDs under a byte cap."""
    pin = hashlib.sha256(); used = 0; matched = []; exhausted = False
    with urllib.request.urlopen(urllib.request.Request(RIGHTS, headers={"User-Agent": "ShiftFoodResearch/1.0"}), timeout=45) as response:
        declared = response.headers.get("Content-Length")
        if declared and int(declared) > maximum:
            raise ValueError("Publisher credit metadata exceeds bounded scan budget")
        def lines():
            nonlocal used, exhausted
            while True:
                raw = response.readline(1_000_001)
                if not raw:
                    exhausted = True
                    return
                used += len(raw)
                if used > maximum or len(raw) > 1_000_000:
                    raise ValueError("Bounded metadata scan exceeded")
                pin.update(raw)
                yield raw.decode("utf-8")
        reader = csv.DictReader(lines())
        found = set()
        for row in reader:
            if row["ImageID"] in wanted:
                matched.append(row); found.add(row["ImageID"])
            if len(found) == len(wanted):
                break
        names = reader.fieldnames
    with path.open("w", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=names); writer.writeheader(); writer.writerows(matched)
    return {"url": RIGHTS, "file": path.name, "bytes_streamed": used, "stream_sha256": pin.hexdigest(),
        "selected_file_sha256": digest(path), "matched_ids": len(matched), "requested_ids": len(wanted),
        "full_file_downloaded": exhausted, "reason": "Credit CSV is unsorted; a short prefix misses nearly all requested images"}


def run(args):
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    args.output.mkdir(parents=True, exist_ok=False); (args.output / "metadata").mkdir(); (args.output / "images").mkdir()
    classes = dict(csv.reader((args.validation_intake / "metadata/classes.csv").open()))
    held = json.loads((args.validation_intake / "intake-receipt.json").read_text())
    validation_rights = {r["ImageID"]: r for r in rows(args.validation_intake / "metadata/image-rights.csv")}
    excluded_authors = {validation_rights[r["image_id"]]["AuthorProfileURL"].rstrip("/") for r in held["outcomes"]}
    excluded_urls = {r["original_landing_url"] for r in held["outcomes"]}
    sources = [prefix(BOXES, args.output / "metadata/train-boxes.prefix.csv", 16_000_000)]
    if args.full_credit_scan:
        wanted = {b["ImageID"] for b in rows(args.output / "metadata/train-boxes.prefix.csv") if classes.get(b.get("LabelName")) in MAPPING}
        credit_path = args.output / "metadata/train-rights.selected.csv"
        sources.append(matched_rights(credit_path, wanted))
    else:
        credit_path = args.output / "metadata/train-rights.prefix.csv"
        sources.append(prefix(RIGHTS, credit_path, 24_000_000))
    print(json.dumps({"stage": "publisher_training_prefixes", "sources": sources}), flush=True)
    rights = {r["ImageID"]: r for r in rows(credit_path) if r.get("ImageID")}
    selected = []; counts = Counter(); used = set()
    for box in rows(args.output / "metadata/train-boxes.prefix.csv"):
        label = classes.get(box.get("LabelName")); identity = box.get("ImageID"); credit = rights.get(identity)
        if label not in MAPPING or not credit or counts[label] >= args.per_class or identity in used:
            continue
        if box.get("Confidence") != "1" or any(box.get(k) != "0" for k in ("IsGroupOf", "IsDepiction", "IsInside")):
            continue
        author = credit.get("AuthorProfileURL", "").rstrip("/")
        landing = credit.get("OriginalLandingURL", "").replace("http://", "https://")
        if not author or author in excluded_authors or landing in excluded_urls or not landing.startswith("https://www.flickr.com/photos/"):
            continue
        if not cc_by_2(credit.get("License", "")) or not credit.get("Author") or credit.get("Rotation") not in ("0", "0.0"):
            continue
        coordinates = [float(box[k]) for k in ("XMin", "YMin", "XMax", "YMax")]
        if not (0 <= coordinates[0] < coordinates[2] <= 1 and 0 <= coordinates[1] < coordinates[3] <= 1):
            continue
        if (coordinates[2] - coordinates[0]) * (coordinates[3] - coordinates[1]) < .01:
            continue
        selected.append({"image_id": identity, "publisher_split": "train", "publisher_class": label,
            "known_positive": MAPPING[label], "box": coordinates, "licence": credit["License"],
            "author": credit["Author"], "title": credit.get("Title", ""), "original_landing_url": landing,
            "source_group": "openimages-author:" + hashlib.sha256(author.encode()).hexdigest(),
            "publisher_rotation": credit["Rotation"], "annotation_scope": "known positive object only; all unlabelled foods unknown",
            "eligible_for_partial_positive_training": False})
        counts[label] += 1; used.add(identity)
        if len(selected) >= args.max_images:
            break
    print(json.dumps({"stage": "training_candidates", "images": len(selected), "classes": dict(counts)}), flush=True)
    budget = Downloader(args.max_download_mb * 1_000_000)
    excluded_hashes = {r.get("sha256") for r in held["outcomes"] if r.get("sha256")}
    def inspect(item):
        result = dict(item)
        if time.monotonic() > deadline:
            return {**result, "status": "budget_expired"}
        try:
            page = budget.read(item["original_landing_url"], limit=4_000_000)
            parser = LicenceLinks(); parser.feed(html.unescape(page.decode("utf-8", errors="replace")))
            result.update(original_page_sha256=hashlib.sha256(page).hexdigest(), original_page_declared_licences=sorted(parser.links),
                original_licence_verified=any(cc_by_2(link) for link in parser.links))
            if not result["original_licence_verified"]:
                return {**result, "status": "original_licence_unverified"}
            result = download_verified(result, args.output, budget)
            if result["sha256"] in excluded_hashes or result["downloaded_exif_orientation"] not in (None, 1):
                return {**result, "status": "duplicate_or_orientation_review_required"}
            result.update(eligible_for_partial_positive_training=True, status="partial_positive_eligible")
            return result
        except Exception as error:
            return {**result, "status": "source_check_failed", "error_type": type(error).__name__}
    outcomes = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for item in pool.map(inspect, selected):
            outcomes.append(item)
            status = {"stage": "training_image_rights_checks", "checked": len(outcomes), "selected": len(selected),
                "partial_positive_eligible": sum(r["eligible_for_partial_positive_training"] for r in outcomes)}
            (args.output / "progress.json").write_text(json.dumps(status, indent=2) + "\n")
            if len(outcomes) % 10 == 0:
                print(json.dumps(status), flush=True)
    receipt = {"schema": "shift-openimages-partial-training-intake-1", "source_prefixes": sources,
        "source_classes_sha256": digest(args.validation_intake / "metadata/classes.csv"),
        "publisher_split": "train", "validation_authors_excluded": len(excluded_authors), "validation_photos_used_for_training": 0,
        "known_positive_mapping": MAPPING, "records": outcomes, "images_selected": len(selected),
        "partial_positive_eligible": sum(r["eligible_for_partial_positive_training"] for r in outcomes),
        "classification_negatives_imputed": False, "exact_recipe_labels_inferred": False,
        "model_training_started": False, "messages_sent": 0, "fees_paid": 0,
        "annotation_licence": "CC-BY-4.0", "image_licence": "CC-BY-2.0 individually checked on original photo pages",
        "seconds": time.monotonic() - start, "bytes_downloaded_images_and_pages": budget.used,
        "limitations": ["Partial object-positive training data, not complete meals or segmentation masks",
            "Publisher training photos/authors kept separate from the acquired publisher validation challenge",
            "Exact duplicates excluded by bytes; further perceptual duplicate review is needed before a new formal acceptance claim",
            "Not a representative UK meal or non-food acceptance set", "No production activation"]}
    (args.output / "training-intake-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"stage": "complete", "partial_positive_eligible": receipt["partial_positive_eligible"]}), flush=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--output", type=Path, required=True); p.add_argument("--validation-intake", type=Path, required=True)
    p.add_argument("--max-images", type=int, choices=range(1, 201), default=180)
    p.add_argument("--per-class", type=int, choices=range(1, 16), default=12)
    p.add_argument("--max-download-mb", type=int, required=True, choices=range(1, 501))
    p.add_argument("--max-minutes", type=int, required=True, choices=range(1, 21))
    p.add_argument("--full-credit-scan", action="store_true")
    run(p.parse_args())
