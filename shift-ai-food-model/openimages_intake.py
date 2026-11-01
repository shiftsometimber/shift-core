"""Bounded public-data intake; preserve image-level rights, never assume them.

Publisher validation images remain quarantined under their original split. No
record is a complete meal label or an automatically qualified training example.
No account, API key, message, payment or third-party download script is used.
"""
import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor
import csv
import html
from html.parser import HTMLParser
import io
import json
from pathlib import Path
import re
import time
from urllib.parse import urlsplit

from core import digest
from prepare import Downloader

SOURCES = {
    "classes.csv": "https://storage.googleapis.com/openimages/v7/oidv7-class-descriptions-boxable.csv",
    "image-rights.csv": "https://storage.googleapis.com/openimages/2018_04/validation/validation-images-with-rotation.csv",
    "boxes.csv": "https://storage.googleapis.com/openimages/v5/validation-annotations-bbox.csv",
}
FOODS = {"Pizza", "Bread", "Broccoli", "Carrot", "Tomato", "Cucumber", "Potato", "Mushroom",
    "Cheese", "Egg", "Egg (Food)", "Salad", "Pasta", "Rice", "Bacon", "Strawberry", "Banana",
    "Apple", "Orange", "Grape", "Pear", "Lemon", "Sandwich"}


def cc_by_2(url):
    parsed = urlsplit(url)
    return parsed.scheme in ("http", "https") and parsed.hostname == "creativecommons.org" and bool(
        re.fullmatch(r"/licenses/by/2\.0(?:/|/deed(?:\.[a-zA-Z_-]+)?/?|/legalcode/?)?", parsed.path))


def download_verified(record, output, downloader):
    from PIL import Image, ImageOps
    if not record.get("original_licence_verified") or not any(cc_by_2(link) for link in record.get("original_page_declared_licences", [])):
        raise ValueError("Current photo-page CC BY 2.0 evidence required")
    split = record.get("publisher_split")
    if split not in ("train", "validation") or not re.fullmatch(r"[0-9a-f]{16}", record["image_id"]):
        raise ValueError("Known publisher split and image identity required")
    url = f"https://open-images-dataset.s3.amazonaws.com/{split}/{record['image_id']}.jpg"
    data = downloader.read(url, limit=4_000_000)
    with Image.open(io.BytesIO(data)) as image:
        if image.width * image.height > 20_000_000:
            raise ValueError("Public image exceeds pixel budget")
        record["downloaded_pixel_size"] = list(image.size)
        record["downloaded_exif_orientation"] = image.getexif().get(274)
        pixels = ImageOps.exif_transpose(image).convert("RGB"); pixels.thumbnail((768, 768))
        path = output / "images" / (record["image_id"] + ".jpg"); pixels.save(path, "JPEG", quality=90)
    return {**record, "status": "image_downloaded_quarantined", "image_path": "images/" + path.name,
        "sha256": digest(path), "image_source_url": url,
        "attribution": f"{record['title']} — {record['author']}; {record['original_landing_url']}; CC BY 2.0; resized, metadata removed."}


def resume_verified(args):
    deadline = time.monotonic() + args.max_minutes * 60
    path = args.output / "intake-receipt.json"; receipt = json.loads(path.read_text())
    for source in receipt["metadata"]:
        if digest(args.output / "metadata" / source["file"]) != source["sha256"]:
            raise ValueError("Pinned metadata changed")
    rights = {r["ImageID"]: r for r in csv.DictReader((args.output / "metadata/image-rights.csv").open())}
    downloader = Downloader(args.max_download_mb * 1_000_000)
    outcomes = []
    def recover(record):
        item = dict(record)
        if time.monotonic() > deadline:
            return {**item, "status": "resume_budget_expired", "training_ready": False}
        if item["status"] == "image_downloaded_quarantined":
            if digest(args.output / item["image_path"]) != item["sha256"]:
                raise ValueError("Existing downloaded image changed")
            return item
        row = rights[item["image_id"]]
        if row["Author"] != item["author"] or not cc_by_2(row["License"]):
            raise ValueError("Photo rights metadata mismatch")
        item["publisher_rotation"] = row["Rotation"]
        if not any(cc_by_2(link) for link in item.get("original_page_declared_licences", [])):
            return item
        item["prior_status"] = item["status"]
        item["original_licence_verified"] = True
        try:
            return download_verified(item, args.output, downloader)
        except Exception as error:
            return {**item, "status": "image_download_failed_no_training_admission", "error_type": type(error).__name__}
    with ThreadPoolExecutor(max_workers=4) as pool:
        for item in pool.map(recover, receipt["outcomes"]):
            outcomes.append(item)
            if len(outcomes) % 10 == 0:
                print(json.dumps({"stage": "verified_photo_download", "checked": len(outcomes),
                    "downloaded": sum(r["status"] == "image_downloaded_quarantined" for r in outcomes)}), flush=True)
    receipt.update(outcomes=outcomes, images_downloaded=sum(r["status"] == "image_downloaded_quarantined" for r in outcomes),
        licence_canonicalisation="CC BY 2.0 /deed.en and /legalcode identify the same licence as its root URL; BY-NC/SA/ND and other versions remain rejected",
        resumed_download_bytes=downloader.used)
    path.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"stage": "complete", "downloaded": receipt["images_downloaded"], "training_admitted": 0}), flush=True)


class LicenceLinks(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "a" and "license" in a.get("rel", "").lower().split():
            self.links.add(a.get("href", "").replace("http://", "https://").rstrip("/"))


def run(args):
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    args.output.mkdir(parents=True, exist_ok=False)
    (args.output / "metadata").mkdir(); (args.output / "images").mkdir()
    downloader = Downloader(args.max_download_mb * 1_000_000)
    metadata = []
    for name, url in SOURCES.items():
        raw = downloader.read(url, limit=35_000_000)
        path = args.output / "metadata" / name; path.write_bytes(raw)
        metadata.append({"file": name, "url": url, "sha256": digest(path), "bytes": len(raw)})
        print(json.dumps({"stage": "metadata_downloaded", "file": name, "bytes": len(raw)}), flush=True)
    classes = dict(csv.reader((args.output / "metadata/classes.csv").open()))
    rights = {r["ImageID"]: r for r in csv.DictReader((args.output / "metadata/image-rights.csv").open())}
    selected = []; counts = Counter(); image_ids = set()
    for box in csv.DictReader((args.output / "metadata/boxes.csv").open()):
        label = classes.get(box["LabelName"]); identity = box["ImageID"]; record = rights.get(identity, {})
        if label not in FOODS or counts[label] >= args.per_class or identity in image_ids:
            continue
        if not re.fullmatch(r"[0-9a-f]{16}", identity) or box.get("Confidence") != "1":
            continue
        if any(box.get(k) != "0" for k in ("IsGroupOf", "IsDepiction", "IsInside")):
            continue
        if record.get("License", "").replace("http://", "https://").rstrip("/") != "https://creativecommons.org/licenses/by/2.0":
            continue
        landing = record.get("OriginalLandingURL", "").replace("http://", "https://")
        if not landing.startswith("https://www.flickr.com/photos/") or not record.get("Author"):
            continue
        coordinates = [float(box[k]) for k in ("XMin", "YMin", "XMax", "YMax")]
        if not (0 <= coordinates[0] < coordinates[2] <= 1 and 0 <= coordinates[1] < coordinates[3] <= 1):
            continue
        selected.append({"image_id": identity, "publisher_class": label, "class_id": box["LabelName"],
            "publisher_split": "validation", "box": coordinates,
            "licence": record["License"], "author": record["Author"], "title": record.get("Title", ""),
            "original_landing_url": landing, "original_url": record["OriginalURL"],
            "source_group": "openimages:" + identity, "proposed_39_class_mapping": None,
            "publisher_rotation": record["Rotation"]})
        counts[label] += 1; image_ids.add(identity)
        if len(selected) >= args.max_images:
            break
    (args.output / "candidates.json").write_text(json.dumps(selected, indent=2) + "\n")
    print(json.dumps({"stage": "rights_candidates", "images": len(selected), "classes": dict(counts)}), flush=True)

    def inspect(record):
        if time.monotonic() > deadline:
            return {**record, "status": "budget_expired", "training_ready": False}
        result = {**record, "training_ready": False}
        try:
            raw = downloader.read(record["original_landing_url"], limit=4_000_000)
            page = html.unescape(raw.decode("utf-8", errors="replace"))
            parser = LicenceLinks(); parser.feed(page)
            result["original_page_sha256"] = __import__("hashlib").sha256(raw).hexdigest()
            result["original_page_declared_licences"] = sorted(parser.links)
            result["original_licence_verified"] = any(cc_by_2(link) for link in parser.links)
            if not result["original_licence_verified"]:
                return {**result, "status": "original_licence_not_verified_no_image_downloaded"}
            return download_verified(result, args.output, downloader)
        except Exception as error:
            # No private content exists here. Keep only the error class, not HTML.
            return {**result, "status": "source_check_failed_no_training_admission", "error_type": type(error).__name__}

    outcomes = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        for record in pool.map(inspect, selected):
            outcomes.append(record)
            (args.output / "progress.json").write_text(json.dumps({"checked": len(outcomes), "selected": len(selected),
                "downloaded": sum(r["status"] == "image_downloaded_quarantined" for r in outcomes),
                "seconds": time.monotonic() - start, "training_admitted": 0}, indent=2) + "\n")
            if len(outcomes) % 10 == 0:
                print(json.dumps({"stage": "image_licence_checks", "checked": len(outcomes), "selected": len(selected)}), flush=True)
    receipt = {"schema": "shift-openimages-intake-1", "source": "https://storage.googleapis.com/openimages/web/download_v7.html",
        "licence_source": "https://storage.googleapis.com/openimages/web/factsfigures_v7.html",
        "annotation_licence": "CC-BY-4.0", "publisher_image_licence_listing": "CC-BY-2.0; checked individually",
        "metadata": metadata, "images_selected": len(selected), "outcomes": outcomes,
        "images_downloaded": sum(r["status"] == "image_downloaded_quarantined" for r in outcomes),
        "bytes_downloaded_this_run": downloader.used, "seconds": time.monotonic() - start,
        "training_admitted": 0, "publisher_validation_split_preserved": True,
        "limitations": ["Publisher explicitly requires individual image licence verification; an inaccessible page is not permission",
            "Downloaded images remain quarantined pending rotation/box/label/duplicate review",
            "Boxes are object labels, not complete meal labels or exact recipes; unlabelled foods cannot be treated as absent",
            "UK representativeness not established", "This intake is not recognition accuracy or a production release"],
        "account_created": False, "fee_paid": False, "third_party_code_executed": False, "messages_sent": 0}
    (args.output / "intake-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"stage": "complete", "selected": len(selected), "downloaded": receipt["images_downloaded"], "training_admitted": 0}), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-images", type=int, choices=range(1, 101), default=100)
    parser.add_argument("--per-class", type=int, choices=range(1, 11), default=5)
    parser.add_argument("--max-download-mb", type=int, required=True, choices=range(1, 501))
    parser.add_argument("--max-minutes", type=int, required=True, choices=range(1, 21))
    parser.add_argument("--resume-verified", action="store_true")
    args = parser.parse_args()
    resume_verified(args) if args.resume_verified else run(args)
