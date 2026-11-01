"""Cache frozen spatial image features, without reading a single food mask.

One encoder pass provides its 196 patch vectors plus pooled context. No label,
mask, member caption or test score can influence feature extraction.
"""
import argparse
import json
from pathlib import Path
import time

from core import digest, local_path, validate_manifest

PREPROCESS_ID = "siglip-full-image-224-bicubic-stretch-normalize-half-patches-1"


def build(args):
    import numpy as np
    from PIL import Image
    import torch
    from semantic_model import encoder, view_tensors, WEIGHT_SHA256
    start = time.monotonic(); deadline = start + args.max_minutes * 60
    manifest = validate_manifest(args.manifest)
    args.output.mkdir(parents=True, exist_ok=False)
    torch.set_num_threads(4)
    model, _ = encoder(args.base)
    rows = manifest["samples"]
    for offset in range(0, len(rows), 4):
        if time.monotonic() > deadline:
            raise TimeoutError("Bounded spatial feature budget exceeded")
        batch = rows[offset:offset + 4]; pixels = []
        for row in batch:
            with Image.open(local_path(args.manifest.parent, row["path"])) as image:
                pixels.append(view_tensors(image)[0])
        with torch.inference_mode():
            output = model(pixel_values=torch.stack(pixels))
            patches = output.last_hidden_state.cpu().numpy()
            context = output.pooler_output.cpu().numpy()
        if patches.shape != (len(batch), 196, 768) or context.shape != (len(batch), 768):
            raise ValueError("Pinned SigLIP spatial shape changed")
        for i, row in enumerate(batch):
            value = np.concatenate((patches[i], context[i:i + 1]), axis=0)
            if value.dtype != np.float32 or not np.isfinite(value).all():
                raise ValueError("Finite float32 features required")
            path = args.output / (row["id"] + ".npy"); np.save(path, value, allow_pickle=False)
            receipt = {"image_sha256": row["sha256"], "base_weight_sha256": WEIGHT_SHA256,
                "preprocess": PREPROCESS_ID, "sha256": digest(path)}
            (args.output / (row["id"] + ".json")).write_text(json.dumps(receipt) + "\n")
        if offset % 100 == 0:
            print(json.dumps({"stage": "spatial_features", "images": min(offset + 4, len(rows)),
                "total": len(rows), "seconds": time.monotonic() - start}), flush=True)
    receipt = {"manifest_sha256": digest(args.manifest), "preprocess": PREPROCESS_ID,
        "base_weight_sha256": WEIGHT_SHA256, "images": len(rows), "seconds": time.monotonic() - start,
        "masks_read": 0, "labels_used": False, "encoder_updated": False, "paid_service_added": False}
    (args.output / "complete.json").write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps({"stage": "complete", **receipt}), flush=True)


def read(row, directory):
    import numpy as np
    from semantic_model import WEIGHT_SHA256
    path = directory / (row["id"] + ".npy")
    receipt = json.loads((directory / (row["id"] + ".json")).read_text())
    if (receipt.get("image_sha256"), receipt.get("base_weight_sha256"), receipt.get("preprocess"), receipt.get("sha256")) != (
            row["sha256"], WEIGHT_SHA256, PREPROCESS_ID, digest(path)):
        raise ValueError("Spatial features differ from pinned image/base/preprocessing")
    value = np.load(path, allow_pickle=False)
    if value.shape != (197, 768) or value.dtype != np.float32 or not np.isfinite(value).all():
        raise ValueError("Known finite spatial features required")
    return value


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("manifest", "base", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    parser.add_argument("--max-minutes", type=int, required=True, choices=range(1, 21))
    build(parser.parse_args())
