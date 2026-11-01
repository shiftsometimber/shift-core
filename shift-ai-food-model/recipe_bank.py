"""Local image-to-recipe suggestions from the governed recipe catalogue.

This is recipe-aware retrieval, not a claim that 2,692 recipe identities have
been trained into a new foundation model. No nutrition or eating record is
returned until a separate explicit recipe/portion confirmation.
"""
import argparse
import io
import json
from pathlib import Path
import shutil
import sys
import time
import hashlib
import urllib.request

from semantic_model import encoder, view_tensors, MODEL_ID, REVISION, WEIGHT_SHA256
from core import digest, local_path, parse_request
import numpy as np
from PIL import Image
import torch
from transformers import AutoTokenizer, SiglipTextModel
from transformers.utils import logging

TOKENIZER_PINS = {
    "tokenizer.json": "c6e405cb7c670d56636a9402c81023a55bc6c3c53d89cf02b92f5c5005bfe920",
    "tokenizer_config.json": "d6423dae508cc3a129d22ea443841c111832a1a73125b8f25ea8736951698bcb",
    "special_tokens_map.json": "2b6a1ff67a27e0df9ac0c7d93250fc0d87431c7b366b3d5669217104f9088a26",
    "spiece.model": "1e5036bed065526c3c212dfbe288752391797c4bb1a284aa18c9a0b23fcaf8ec"}


def fetch_tokenizer(base):
    source = json.loads((base / "source.json").read_text())
    if source.get("id") != MODEL_ID or source.get("revision") != REVISION:
        raise ValueError("Reviewed local visual base required first")
    for name, expected in TOKENIZER_PINS.items():
        target = base / name
        if not target.exists():
            with urllib.request.urlopen("https://huggingface.co/" + MODEL_ID + "/resolve/" + REVISION + "/" + name, timeout=40) as response:
                value = response.read(5_000_001)
            if len(value) > 5_000_000 or hashlib.sha256(value).hexdigest() != expected:
                raise ValueError("Pinned tokenizer download differs")
            target.write_bytes(value)
        if digest(target) != expected:
            raise ValueError("Local tokenizer differs from reviewed pin")
        source["files"][name] = expected
    (base / "source-with-tokenizer.json").write_text(json.dumps(source, indent=2) + "\n")


def text_encoder(base):
    source = json.loads((base / "source-with-tokenizer.json").read_text())
    if source.get("id") != MODEL_ID or source.get("revision") != REVISION or source["files"].get("model.safetensors") != WEIGHT_SHA256:
        raise ValueError("Pinned text/image base required")
    for name, pin in source["files"].items():
        if digest(local_path(base, name)) != pin:
            raise ValueError("Text/image source bytes changed")
    tokenizer = AutoTokenizer.from_pretrained(base, local_files_only=True, trust_remote_code=False)
    logging.set_verbosity_error()
    model, info = SiglipTextModel.from_pretrained(base, local_files_only=True, trust_remote_code=False,
        use_safetensors=True, output_loading_info=True)
    if any(info.get(k) for k in ("missing_keys", "mismatched_keys", "error_msgs")):
        raise ValueError("Incomplete text tower load")
    if any(not key.startswith(("vision_model.", "logit_scale", "logit_bias")) for key in info.get("unexpected_keys", [])):
        raise ValueError("Unexpected non-image weights")
    model.eval()
    return tokenizer, model, source


def text_features(tokenizer, model, descriptions):
    inputs = tokenizer(descriptions, padding="max_length", max_length=64, truncation=True, return_tensors="pt")
    with torch.inference_mode():
        features = model(**inputs).pooler_output
        return torch.nn.functional.normalize(features, dim=-1).cpu().numpy()


def build(base, catalogue_path, output, max_minutes):
    if output.exists():
        raise ValueError("New recipe bank directory required")
    catalogue = json.loads(catalogue_path.read_text())
    if catalogue.get("schema") != "shift-recipe-recognition-catalogue-1" or catalogue.get("source_kind") != "governed_source_snapshot_not_live_database_readback":
        raise ValueError("Governed recipe catalogue snapshot required")
    torch.set_num_threads(4)
    tokenizer, model, source = text_encoder(base)
    start = time.monotonic(); rows = catalogue["recipes"]; blocks = []
    for offset in range(0, len(rows), 32):
        if time.monotonic() - start > max_minutes * 60:
            raise TimeoutError("Recipe text encoding time budget reached")
        blocks.append(text_features(tokenizer, model, [r["description"] for r in rows[offset:offset + 32]]))
        if offset % 256 == 0:
            print(json.dumps({"stage": "recipe_reference_bank", "completed": offset, "recipes": len(rows)}), flush=True)
    embeddings = np.concatenate(blocks).astype(np.float32)
    output.mkdir(parents=True)
    np.save(output / "recipe-embeddings.npy", embeddings, allow_pickle=False)
    shutil.copyfile(catalogue_path, output / "catalogue.json")
    shutil.copyfile(base / "LICENSE", output / "BASE-LICENSE")
    (output / "base-source.json").write_text(json.dumps(source, indent=2) + "\n")
    result = {"schema": "shift-recipe-bank-1", "recipes": len(rows), "catalogue_sha256": digest(catalogue_path),
        "embeddings_sha256": digest(output / "recipe-embeddings.npy"), "base_revision": REVISION,
        "model_weights_changed": False, "method": "Recipe text reference embeddings, not per-recipe supervised visual training",
        "seconds": round(time.monotonic() - start, 2), "production_ready": False,
        "real_photo_recipe_accuracy_evaluated": False, "auto_save": False, "nutrition_in_match_response": False}
    (output / "bank.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result), flush=True)


class RecipeMatcher:
    def __init__(self, base, bank, *, research=False):
        if not research:
            raise ValueError("Research-only recipe matcher; not production serving")
        self.meta = json.loads((bank / "bank.json").read_text())
        if self.meta.get("schema") != "shift-recipe-bank-1" or self.meta["base_revision"] != REVISION:
            raise ValueError("Known recipe bank required")
        if digest(bank / "catalogue.json") != self.meta["catalogue_sha256"] or digest(bank / "recipe-embeddings.npy") != self.meta["embeddings_sha256"]:
            raise ValueError("Recipe bank changed")
        self.catalogue = json.loads((bank / "catalogue.json").read_text())
        self.embeddings = np.load(bank / "recipe-embeddings.npy", allow_pickle=False)
        if self.embeddings.ndim != 2 or len(self.embeddings) != len(self.catalogue["recipes"]) or not np.isfinite(self.embeddings).all():
            raise ValueError("Invalid recipe embeddings")
        torch.set_num_threads(4)
        self.model, source = encoder(base)
        expected = json.loads((bank / "base-source.json").read_text())
        if source["revision"] != expected["revision"] or source["files"]["model.safetensors"] != expected["files"]["model.safetensors"]:
            raise ValueError("Wrong visual base")

    def rank(self, vector, count=5):
        if not 1 <= count <= 10 or vector.shape != (self.embeddings.shape[1],) or not np.isfinite(vector).all():
            raise ValueError("Bounded known-dimension query required")
        values = self.embeddings @ vector
        indices = np.argsort(-values)[:count]
        candidates = []
        for i in indices:
            recipe = self.catalogue["recipes"][int(i)]
            candidates.append({"recipeId": recipe["id"], "recipeHash": recipe["content_sha256"], "title": recipe["title"],
                "foodFormat": recipe["food_format"], "ingredients": [r["item"] for r in recipe["ingredients"]],
                "similarity": round(float(values[i]), 5)})
        return {"candidates": candidates, "requiresRecipeConfirmation": True, "requiresPortion": True,
            "canSelectNone": True, "autoSave": False, "nutrition": None,
            "message": "Possible recipe matches. Choose only if it is what you made, check substitutions and enter how much you ate."}

    def recognise(self, request):
        raw = parse_request(request)
        Image.MAX_IMAGE_PIXELS = 1_000_000
        with Image.open(io.BytesIO(raw)) as image:
            if image.format != "JPEG" or max(image.size) > 768 or min(image.size) < 8:
                raise ValueError("Resized JPEG required")
            pixels = view_tensors(image)[:1]
        with torch.inference_mode():
            vector = torch.nn.functional.normalize(self.model(pixel_values=pixels).pooler_output, dim=-1)[0].cpu().numpy()
        return self.rank(vector)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("fetch-tokenizer", "build", "predict", "text-check"))
    parser.add_argument("--base", required=True, type=Path)
    parser.add_argument("--catalogue", type=Path)
    parser.add_argument("--bank", type=Path)
    parser.add_argument("--max-minutes", type=int, default=20, choices=range(1, 61))
    parser.add_argument("--research", action="store_true")
    args = parser.parse_args()
    if args.command == "fetch-tokenizer":
        fetch_tokenizer(args.base)
        print(json.dumps({"tokenizer_files_verified": len(TOKENIZER_PINS), "revision": REVISION}))
    elif not args.bank:
        parser.error("Recipe bank directory required")
    elif args.command == "build":
        if not args.catalogue:
            parser.error("Catalogue required")
        build(args.base, args.catalogue, args.bank, args.max_minutes)
    elif args.command == "text-check":
        torch.set_num_threads(4)
        tokenizer, model, _ = text_encoder(args.base)
        examples = ["A photo of beans on toast.", "A photo of a tuna sandwich.", "A photo of scrambled eggs on toast."]
        vectors = text_features(tokenizer, model, examples)
        del model
        matcher = RecipeMatcher(args.base, args.bank, research=args.research)
        print(json.dumps({"scope": "Text retrieval diagnostic only, not photo recognition accuracy",
            "queries": [{"query": q, "result": matcher.rank(v)} for q, v in zip(examples, vectors)]}))
    else:
        raw = sys.stdin.buffer.read(1_100_001)
        if len(raw) > 1_100_000:
            raise ValueError("Bounded request required")
        print(json.dumps(RecipeMatcher(args.base, args.bank, research=args.research).recognise(json.loads(raw))))
