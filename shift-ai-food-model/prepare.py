"""Explicit, bounded downloads of public licensed pilot data; no member data."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor
import csv
import hashlib
import io
import json
from pathlib import Path
import shutil
import threading
import urllib.parse
import urllib.request

from PIL import Image, ImageOps
from core import SCHEMA, SPLITS, digest, split_for, validate_manifest

GCS = "https://storage.googleapis.com/nutrition5k_dataset/"
DATA_PREFIX = "nutrition5k_dataset/"
BASE_ID = "facebook/deit-tiny-patch16-224"
BASE_REVISION = "b3428f18dcc7b543470d07f14b4a4157815d1880"
ATTRIBUTION = "Nutrition5k, Thames et al., Google Research, CVPR 2021; CC BY 4.0; resized and recompressed for this experiment."


class Downloader:
    def __init__(self, maximum_bytes):
        self.maximum = maximum_bytes
        self.used = 0
        self.lock = threading.Lock()

    def read(self, url, limit=5_000_000):
        request = urllib.request.Request(url, headers={"User-Agent": "ShiftFoodResearch/1.0"})
        with urllib.request.urlopen(request, timeout=45) as response:
            if not response.url.startswith("https://"):
                raise ValueError("HTTPS source required")
            chunks, length = [], 0
            while block := response.read(65_536):
                length += len(block)
                with self.lock:
                    self.used += len(block)
                    if self.used > self.maximum:
                        raise ValueError("Explicit download budget exhausted")
                if length > limit:
                    raise ValueError("Public source exceeds file limit")
                chunks.append(block)
        return b"".join(chunks)


def ingredient_labels(row, taxonomy):
    # The actual released CSV omits the README's num_ingrs field. Accept either
    # layout only when every complete ingredient group has seven valid columns.
    start = next((i for i, x in enumerate(row) if x.startswith("ingr_")), None)
    if start not in (6, 7) or (len(row) - start) % 7:
        raise ValueError("Unrecognised released dish metadata layout")
    mass = float(row[2])
    if mass <= 0:
        return []
    ingredients = set()
    for i in range(start, len(row), 7):
        grams = float(row[i + 2])
        if grams >= taxonomy["minimum_ingredient_grams"] and grams / mass >= taxonomy["minimum_dish_mass_fraction"]:
            ingredients.add(row[i + 1].strip().lower())
    return [label for label, synonyms in taxonomy["labels"].items() if ingredients.intersection(synonyms)]


def fetch_base(destination, downloader):
    destination.mkdir(parents=True, exist_ok=False)
    url = "https://huggingface.co/api/models/" + BASE_ID + "/revision/" + BASE_REVISION + "?blobs=true"
    metadata = json.loads(downloader.read(url))
    if metadata.get("sha") != BASE_REVISION or metadata.get("cardData", {}).get("license") != "apache-2.0":
        raise ValueError("Reviewed base revision or published licence changed")
    sources = {x["rfilename"]: x for x in metadata["siblings"]}
    files = {}
    for name in ("config.json", "preprocessor_config.json", "pytorch_model.bin", "README.md"):
        data = downloader.read("https://huggingface.co/" + BASE_ID + "/resolve/" + BASE_REVISION + "/" + name, limit=50_000_000)
        if name.endswith(".bin"):
            expected = sources[name].get("lfs", {}).get("sha256")
            if not expected or hashlib.sha256(data).hexdigest() != expected:
                raise ValueError("Base weights fail the publisher's LFS SHA256 pin")
        path = destination / name
        path.write_bytes(data)
        files[name] = digest(path)
    licence = downloader.read("https://raw.githubusercontent.com/facebookresearch/deit/main/LICENSE")
    (destination / "LICENSE").write_bytes(licence)
    files["LICENSE"] = digest(destination / "LICENSE")
    (destination / "source.json").write_text(json.dumps({"id": BASE_ID, "revision": BASE_REVISION,
        "licence": "Apache-2.0", "files": files, "downloaded_bytes": downloader.used}, indent=2) + "\n")
    return {"base": BASE_ID, "revision": BASE_REVISION, "downloaded_bytes": downloader.used}


def prepare(destination, taxonomy_path, limits, downloader, workers, reuse_manifest=None):
    destination.mkdir(parents=True, exist_ok=False)
    (destination / "images").mkdir()
    taxonomy = json.loads(taxonomy_path.read_text())
    reused = {}
    if reuse_manifest:
        previous = validate_manifest(reuse_manifest)
        if previous["data_kind"] != "real_public_research" or previous["taxonomy"] != taxonomy:
            raise ValueError("Only the same public research taxonomy may be reused")
        reused = {r["id"]: r for r in previous["samples"]}
    objects, page = [], ""
    for _ in range(20):
        query = {"prefix": DATA_PREFIX + "imagery/realsense_overhead/", "maxResults": 1000}
        if page:
            query["pageToken"] = page
        result = json.loads(downloader.read("https://storage.googleapis.com/storage/v1/b/nutrition5k_dataset/o?" + urllib.parse.urlencode(query)))
        objects.extend(x["name"] for x in result.get("items", []) if x["name"].endswith("/rgb.png"))
        page = result.get("nextPageToken", "")
        if not page:
            break
    if page or not objects:
        raise ValueError("Incomplete bounded RGB object inventory")
    available = {Path(name).parent.name: name for name in objects}
    candidates, metadata_pins = {}, {}
    for cafe in (1, 2):
        name = "metadata/dish_metadata_cafe" + str(cafe) + ".csv"
        raw = downloader.read(GCS + DATA_PREFIX + name)
        metadata_pins[name] = hashlib.sha256(raw).hexdigest()
        for row in csv.reader(io.StringIO(raw.decode())):
            identifier = row[0]
            if identifier not in available:
                continue
            timestamp = int(identifier.removeprefix("dish_"))
            # One complete capture week is one group, preventing adjacent
            # incremental plate scans from random frame-level train/test leakage.
            group = "nutrition5k:capture-week:" + str(timestamp // 604800)
            candidates[identifier] = {"id": identifier, "group_id": group, "split": split_for(group),
                "labels": ingredient_labels(row, taxonomy), "source_url": GCS + available[identifier]}
    selected = []
    for split, maximum in zip(SPLITS, limits):
        rows = [r for r in candidates.values() if r["split"] == split]
        rows.sort(key=lambda r: hashlib.sha256(("selection-1:" + r["id"]).encode()).hexdigest())
        if len(rows) < maximum:
            raise ValueError("Insufficient real RGB images for requested " + split + " count: " + str(len(rows)))
        selected.extend(rows[:maximum])

    def fetch_image(row):
        if row["id"] in reused:
            old = reused[row["id"]]
            for key in ("group_id", "split", "labels", "source_url"):
                if old[key] != row[key]:
                    raise ValueError("Previously accepted sample changed: " + row["id"])
            shutil.copyfile(reuse_manifest.parent / old["path"], destination / old["path"])
            return old
        raw = downloader.read(row["source_url"])
        Image.MAX_IMAGE_PIXELS = 20_000_000
        with Image.open(io.BytesIO(raw)) as source:
            if source.width * source.height > 20_000_000:
                raise ValueError("Image exceeds decoded pixel bound")
            image = ImageOps.exif_transpose(source).convert("RGB")
            image.thumbnail((384, 384))
            path = destination / "images" / (row["id"] + ".jpg")
            image.save(path, "JPEG", quality=90)
        return {**row, "path": "images/" + path.name, "sha256": digest(path),
                "original_sha256": hashlib.sha256(raw).hexdigest(), "licence": "CC-BY-4.0", "attribution": ATTRIBUTION}

    with ThreadPoolExecutor(max_workers=workers) as pool:
        rows = list(pool.map(fetch_image, selected))
    manifest = {"schema": SCHEMA, "data_kind": "real_public_research", "source": "Nutrition5k",
        "source_readme": "https://github.com/google-research-datasets/Nutrition5k", "licence": "CC-BY-4.0",
        "attribution": ATTRIBUTION, "labels": list(taxonomy["labels"]), "taxonomy": taxonomy,
        "split_method": "Disjoint entire capture weeks; not the paper's published split or benchmark.",
        "limitations": ["US cafeterias, not representative UK field data", "Ingredient annotation is not visibility annotation",
                        "No true non-food examples", "No calorie or portion prediction"],
        "metadata_sha256": metadata_pins, "downloaded_bytes": downloader.used,
        "reused_manifest_sha256": digest(reuse_manifest) if reuse_manifest else None,
        "reused_images": sum(r["id"] in reused for r in rows), "samples": rows}
    target = destination / "manifest.json"
    target.write_text(json.dumps(manifest, indent=2) + "\n")
    validate_manifest(target)
    (destination / "ATTRIBUTION.txt").write_text(ATTRIBUTION + "\nSource: " + manifest["source_readme"] +
        "\nLicence: https://creativecommons.org/licenses/by/4.0/\n")
    return {"manifest": str(target), "images": len(rows), "downloaded_bytes": downloader.used,
            "split_counts": {s: sum(r["split"] == s for r in rows) for s in SPLITS}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("base", "data"))
    parser.add_argument("destination", type=Path)
    parser.add_argument("--max-download-mb", type=int, required=True)
    parser.add_argument("--counts", default="320,100,100")
    parser.add_argument("--workers", type=int, default=4, choices=range(1, 9))
    parser.add_argument("--reuse-manifest", type=Path)
    args = parser.parse_args()
    if not 1 <= args.max_download_mb <= 1000:
        parser.error("Download budget must be 1–1000 MB")
    budget = Downloader(args.max_download_mb * 1_000_000)
    if args.command == "base":
        result = fetch_base(args.destination, budget)
    else:
        counts = tuple(map(int, args.counts.split(",")))
        if len(counts) != 3 or any(not 1 <= x <= 5000 for x in counts):
            parser.error("Three bounded train,validation,test counts required")
        result = prepare(args.destination, Path(__file__).with_name("taxonomy.json"), counts, budget, args.workers, args.reuse_manifest)
    print(json.dumps(result))
