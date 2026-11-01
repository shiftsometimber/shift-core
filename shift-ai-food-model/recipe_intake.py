"""Offline photo preparation and explicit recipe review. No network or diary writes.

The review queue is not training data. Preparation never grants training rights,
guesses an exact recipe label or changes a production feature flag.
"""
import argparse
import io
import json
import os
from pathlib import Path
import shutil
import tempfile

from core import digest, local_path, SPLITS
from recipe_learning import (SCHEMA, TOKEN, catalogue_at, read_json, require, qualify)

QUEUE = "shift-recipe-photo-review-queue-1"
TRANSFORM = "exif-orient-rgb-metadata-free-jpeg-768-v1"


def write_new(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("x") as stream:
        stream.write(json.dumps(value, indent=2, allow_nan=False) + "\n")


def clean_photo(source):
    from PIL import Image, ImageOps
    require(source.stat().st_size <= 30_000_000, "Source photo must be at most 30 MB")
    Image.MAX_IMAGE_PIXELS = 50_000_000
    with Image.open(source) as image:
        require(image.format in ("JPEG", "PNG", "WEBP") and getattr(image, "n_frames", 1) == 1,
                "Single JPEG, PNG or WebP required; export HEIC/animated files to a still JPEG first")
        require(min(image.size) >= 8 and image.width * image.height <= 50_000_000, "Bounded source dimensions required")
        oriented = ImageOps.exif_transpose(image).convert("RGB")
        oriented.thumbnail((768, 768), Image.Resampling.LANCZOS)
        # New pixel-only image: Pillow cannot carry EXIF, XMP, comments or ICC
        # information from the input into the output through image.info.
        clean = Image.new("RGB", oriented.size); clean.paste(oriented)
        out = io.BytesIO(); clean.save(out, format="JPEG", quality=85, optimize=True)
        raw = out.getvalue()
        require(len(raw) <= 750_000, "Prepared JPEG exceeds the existing photo limit")
        return raw, list(clean.size)


def prepare(batch_path, source_root, catalogue_path, output):
    require(not output.exists(), "New review directory required; existing work is never overwritten")
    batch = read_json(batch_path)
    require(set(batch) == {"schema", "data_kind", "photos"} and batch["schema"] == "shift-recipe-photo-import-1",
            "Known photo import schema required")
    require(batch["data_kind"] in ("real_recipe_photos", "fixture_only"), "Declare real photos or fixture-only input")
    require(isinstance(batch["photos"], list) and 1 <= len(batch["photos"]) <= 200, "Import between one and 200 photos per batch")
    recipes = catalogue_at(catalogue_path)
    ids, source_pins, processed_pins, rows = set(), set(), set(), []
    output.parent.mkdir(parents=True, exist_ok=True)
    # Build away from the final path. Failed conversion does not leave a
    # half-imported review queue that can be mistaken for a completed import.
    with tempfile.TemporaryDirectory(prefix=".recipe-photo-import-", dir=output.parent) as temporary:
        stage = Path(temporary) / "queue"; stage.mkdir(); (stage / "images").mkdir()
        for row in batch["photos"]:
            require(set(row) <= {"id", "path", "recipe_hint"}, "Import accepts anonymous IDs, local photos and optional recipe hints only")
            identity = row.get("id")
            require(isinstance(identity, str) and TOKEN.fullmatch(identity) and identity not in ids, "Distinct anonymous photo ID required")
            hint = row.get("recipe_hint")
            require(hint is None or hint in recipes, "Current recipe hint required; a hint is not a checked label")
            source = local_path(source_root, row["path"])
            require(source.stat().st_size <= 30_000_000, "Source photo must be at most 30 MB")
            source_pin = digest(source)
            require(source_pin not in source_pins, "Duplicate original photo")
            raw, size = clean_photo(source)
            target = stage / "images" / (identity + ".jpg"); target.write_bytes(raw); processed_pin = digest(target)
            require(processed_pin not in processed_pins, "Duplicate prepared photo")
            ids.add(identity); source_pins.add(source_pin); processed_pins.add(processed_pin)
            rows.append({"id": identity, "path": "images/" + identity + ".jpg", "sha256": processed_pin,
                "original_sha256": source_pin, "size": size, "transform": TRANSFORM,
                "recipe_hint": hint, "recipe_hint_hash": recipes[hint]["content_sha256"] if hint else None,
                "status": "pending_review", "training_permission_granted": False})
        queue = {"schema": QUEUE, "data_kind": batch["data_kind"], "catalogue_sha256": digest(catalogue_path),
            "photos": rows, "contains_original_photos": False, "contains_original_filenames": False,
            "automatically_trainable": False}
        write_new(stage / "queue.json", queue)
        os.rename(stage, output)
    return {"prepared": len(rows), "pending_review": len(rows), "training_ready": 0,
            "metadata_stripped": True, "originals_modified": False, "queue": str(output / "queue.json")}


def load_queue(queue_path, catalogue_path):
    queue = read_json(queue_path)
    require(queue.get("schema") == QUEUE and queue.get("catalogue_sha256") == digest(catalogue_path), "Review queue catalogue changed; prepare/review the current versions")
    catalogue_at(catalogue_path)
    require(queue.get("data_kind") in ("real_recipe_photos", "fixture_only"), "Known review data kind required")
    return queue


def label(queue_path, catalogue_path, identity, *, target, recipe_id, split, capture_group, dish_group,
          source_group, permission, real_photo_confirmed=False, ingredients_confirmed=False, privacy_checked=False):
    queue = load_queue(queue_path, catalogue_path)
    row = next((r for r in queue["photos"] if r["id"] == identity), None)
    require(row is not None and TOKEN.fullmatch(identity), "Known anonymous photo ID required")
    require(real_photo_confirmed is True and privacy_checked is True, "Explicit real-photo and no-private-content review required")
    require(target in ("recipe", "other_food", "non_food") and split in SPLITS, "Known target and explicit split required")
    require(all(isinstance(x, str) and TOKEN.fullmatch(x) for x in (capture_group, dish_group, source_group)), "Anonymous capture/dish/source groups required")
    recipes = catalogue_at(catalogue_path)
    recipe_hash = None
    if target == "recipe":
        require(recipe_id in recipes and ingredients_confirmed is True, "Current recipe and exact ingredient confirmation required")
        recipe_hash = recipes[recipe_id]["content_sha256"]
        if recipe_id == row.get("recipe_hint"):
            require(recipe_hash == row.get("recipe_hint_hash"), "Hinted recipe version changed")
    else:
        require(recipe_id is None and ingredients_confirmed is False, "Negative photos do not receive recipe or ingredient claims")
    image_path = local_path(queue_path.parent, row["path"])
    require(digest(image_path) == row["sha256"], "Prepared photo bytes changed")
    permission_path = local_path(queue_path.parent, permission)
    proof = read_json(permission_path)
    require(proof.get("photo_sha256") == row["sha256"] and proof.get("active") is True and proof.get("reviewed") is True and
            proof.get("training_reuse") is True and proof.get("evaluation_reuse") is True and
            proof.get("basis") in ("SHIFT-owned", "CC-BY-4.0", "explicit-member-training-consent"), "Existing active reviewed training/evaluation permission for this prepared photo required")
    require(isinstance(proof.get("attribution"), str) and 0 < len(proof["attribution"]) <= 500, "Permission record attribution required")
    label_path = queue_path.parent / "labels" / (identity + ".json")
    review_path = queue_path.parent / "reviews" / (identity + ".json")
    require(not label_path.exists() and not review_path.exists(), "Photo already reviewed; preserve the old record and prepare a new queue for corrections")
    review = {"photo_sha256": row["sha256"], "original_sha256": row["original_sha256"], "target": target,
        "recipe_id": recipe_id, "recipe_hash": recipe_hash, "ingredients_match": target == "recipe", "checked": True,
        "real_photo_confirmed": True, "privacy_checked": True, "queue_sha256": digest(queue_path),
        "scope": "Explicit operator attestation, not automatic image identity or permission inference"}
    write_new(review_path, review)
    reviewed = {"id": identity, "path": row["path"], "sha256": row["sha256"], "split": split,
        "capture_group": capture_group, "dish_group": dish_group, "source_group": source_group, "image_kind": "real_photo",
        "target": target, "recipe_id": recipe_id, "recipe_hash": recipe_hash,
        "review": {"checked": True, "ingredients_match": target == "recipe", "evidence": "reviews/" + identity + ".json", "sha256": digest(review_path)},
        "rights": {"basis": proof["basis"], "attribution": proof["attribution"], "evidence": permission, "sha256": digest(permission_path)}}
    write_new(label_path, {"schema": "shift-reviewed-photo-label-1", "queue_sha256": digest(queue_path), "sample": reviewed})
    return {"reviewed_photo": identity, "target": target, "training_started": False, "saved_to_diary": False}


def export(queue_path, catalogue_path, output, *, test_previously_inspected):
    require(type(test_previously_inspected) is bool, "Declare prior test inspection explicitly")
    require(not output.exists(), "New dataset directory required")
    queue = load_queue(queue_path, catalogue_path)
    known = {r["id"]: r for r in queue["photos"]}
    rows = []
    labels = queue_path.parent / "labels"
    for path in sorted(labels.glob("*.json")):
        record = read_json(path)
        require(record.get("schema") == "shift-reviewed-photo-label-1" and record.get("queue_sha256") == digest(queue_path), "Photo label was made for a different queue")
        row = record["sample"]; original = known.get(row["id"])
        require(original is not None and row["path"] == original["path"] and row["sha256"] == original["sha256"], "Reviewed photo differs from prepared queue")
        require(not any(r["id"] == row["id"] for r in rows), "Duplicate reviewed photo")
        rows.append(row)
    require(rows, "No reviewed photos; pending images cannot be exported for training")
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".recipe-pair-export-", dir=output.parent) as temporary:
        stage = Path(temporary) / "dataset"; stage.mkdir()
        for row in rows:
            for relative, pin in ((row["path"], row["sha256"]), (row["review"]["evidence"], row["review"]["sha256"]), (row["rights"]["evidence"], row["rights"]["sha256"])):
                source = local_path(queue_path.parent, relative)
                require(digest(source) == pin, "Photo/review/permission bytes changed before export")
                # Resolve every destination too: no traversal or alias may
                # overwrite another review/photo in the assembled dataset.
                destination = (stage / relative).resolve()
                require(destination.is_relative_to(stage.resolve()), "Dataset path escapes export directory")
                destination.parent.mkdir(parents=True, exist_ok=True)
                if destination.exists():
                    require(digest(destination) == pin, "Evidence destination collision")
                else:
                    shutil.copyfile(source, destination)
        manifest = {"schema": SCHEMA, "data_kind": queue["data_kind"], "catalogue_sha256": queue["catalogue_sha256"],
            "test_previously_inspected": test_previously_inspected, "samples": rows}
        write_new(stage / "manifest.json", manifest)
        _, audit = qualify(stage / "manifest.json", catalogue_path)
        receipt = {"schema": "shift-reviewed-photo-export-1", "exported_reviewed_photos": len(rows),
            "remaining_pending_photos": len(known) - len(rows), "training_started": False, "auto_save": False,
            "data_kind": queue["data_kind"], "audit": audit}
        write_new(stage / "export.json", receipt)
        os.rename(stage, output)
    return receipt


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("prepare", "label", "export"))
    parser.add_argument("--catalogue", type=Path, required=True)
    parser.add_argument("--batch", type=Path); parser.add_argument("--source", type=Path)
    parser.add_argument("--output", type=Path); parser.add_argument("--queue", type=Path)
    parser.add_argument("--photo-id"); parser.add_argument("--recipe-id")
    parser.add_argument("--target", choices=("recipe", "other_food", "non_food"))
    parser.add_argument("--split", choices=SPLITS)
    for name in ("capture-group", "dish-group", "source-group", "permission"):
        parser.add_argument("--" + name)
    for name in ("confirm-real-photo", "confirm-ingredients", "confirm-no-private-content"):
        parser.add_argument("--" + name, action="store_true")
    parser.add_argument("--test-history", choices=("unseen", "previously-inspected"))
    args = parser.parse_args()
    if args.command == "prepare":
        if not args.batch or not args.source or not args.output: parser.error("Prepare needs batch, source and new output directory")
        result = prepare(args.batch, args.source, args.catalogue, args.output)
    elif args.command == "label":
        if not args.queue or not args.photo_id or not args.permission: parser.error("Label needs queue, photo ID and existing permission record")
        result = label(args.queue, args.catalogue, args.photo_id, target=args.target, recipe_id=args.recipe_id,
            split=args.split, capture_group=args.capture_group, dish_group=args.dish_group, source_group=args.source_group,
            permission=args.permission, real_photo_confirmed=args.confirm_real_photo, ingredients_confirmed=args.confirm_ingredients,
            privacy_checked=args.confirm_no_private_content)
    else:
        if not args.queue or not args.output or not args.test_history: parser.error("Export needs queue, new output directory and explicit test history")
        result = export(args.queue, args.catalogue, args.output, test_previously_inspected=args.test_history == "previously-inspected")
    print(json.dumps(result, indent=2))
