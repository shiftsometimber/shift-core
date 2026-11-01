"""Extract partial-positive publisher-training features; validation is forbidden."""
import argparse
import json
from pathlib import Path
import re

from core import digest
from openimages_intake import cc_by_2
from spatial_features import PREPROCESS_ID


def qualified_records(receipt):
    if receipt.get("publisher_split") != "train" or receipt.get("validation_photos_used_for_training") != 0:
        raise ValueError("Only separately acquired publisher-training photos may enter fitting")
    result = []; seen = set()
    for record in receipt["records"]:
        if not record.get("eligible_for_partial_positive_training"):
            continue
        if record.get("publisher_split") != "train" or not record.get("original_licence_verified") or not any(
                cc_by_2(link) for link in record.get("original_page_declared_licences", [])):
            raise ValueError("Current per-image commercial-reuse licence evidence required")
        if not re.fullmatch(r"[0-9a-f]{16}", record["image_id"]) or not record.get("known_positive") or not record.get("source_group"):
            raise ValueError("Known source identity and positive label required")
        if record["sha256"] in seen:
            continue
        seen.add(record["sha256"]); result.append(record)
    if not result:
        raise ValueError("No rights-qualified partial-positive training photos")
    return result


def build(args):
    import numpy as np
    import torch
    from PIL import Image
    from semantic_model import encoder, view_tensors, WEIGHT_SHA256
    source = args.intake / "training-intake-receipt.json"
    rows = qualified_records(json.loads(source.read_text()))
    args.output.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(4); model, _ = encoder(args.base)
    exported = []
    for offset in range(0, len(rows), 4):
        batch = rows[offset:offset + 4]; pixels = []
        for row in batch:
            path = args.intake / row["image_path"]
            if digest(path) != row["sha256"]:
                raise ValueError("New public training image changed")
            with Image.open(path) as image:
                pixels.append(view_tensors(image)[0])
        with torch.inference_mode():
            out = model(pixel_values=torch.stack(pixels))
            patches = out.last_hidden_state.numpy(); context = out.pooler_output.numpy()
        for i, row in enumerate(batch):
            value = np.concatenate((patches[i], context[i:i+1]), axis=0)
            path = args.output / (row["image_id"] + ".npy"); np.save(path, value, allow_pickle=False)
            pin = {"image_sha256": row["sha256"], "base_weight_sha256": WEIGHT_SHA256,
                "preprocess": PREPROCESS_ID, "sha256": digest(path)}
            (args.output / (row["image_id"] + ".json")).write_text(json.dumps(pin) + "\n")
            exported.append({**row, "id": row["image_id"]})
        print(json.dumps({"stage": "new_public_training_features", "images": len(exported), "total": len(rows)}), flush=True)
    manifest = {"schema": "shift-partial-positive-training-1", "publisher_split": "train",
        "validation_photos_used_for_training": 0, "intake_receipt_sha256": digest(source),
        "annotation_scope": "Only named positive boxes are known; all other food labels unknown",
        "feature_preprocess": PREPROCESS_ID, "records": exported, "member_photos": 0}
    (args.output / "auxiliary-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("intake", "base", "output"):
        p.add_argument("--" + name, type=Path, required=True)
    build(p.parse_args())
