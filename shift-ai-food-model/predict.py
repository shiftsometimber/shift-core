"""Offline inference contract. Research override is a local CLI option only."""
from __future__ import annotations

import argparse
import io
import json
from pathlib import Path
import sys

from core import SCHEMA, digest, food_response, local_path, parse_request, release_blockers
from experiment import PREPROCESS, image_tensor
from PIL import Image
import torch
from transformers import AutoModelForImageClassification


class FoodPredictor:
    def __init__(self, directory: Path, *, research=False, threads=4):
        pins = json.loads((directory / "artifact.json").read_text())
        if pins.get("schema") != SCHEMA or pins.get("status") != "research_candidate_only":
            raise ValueError("Known candidate artifact required")
        for name, pin in pins["files"].items():
            if digest(local_path(directory, name)) != pin:
                raise ValueError("Candidate bytes changed: " + name)
        self.report = json.loads((directory / "evaluation.json").read_text())
        if digest(directory / "research-manifest.json") != self.report["source_manifest_sha256"]:
            raise ValueError("Training manifest differs from evaluated source")
        self.blockers = release_blockers(self.report)
        if not research:
            # No code in this package approves a production promotion. A separate
            # reviewed serving integration must establish that authority.
            raise ValueError("Research candidate only; no production deployment approved: " + "; ".join(self.blockers))
        if json.loads((directory / "preprocess.json").read_text()) != PREPROCESS:
            raise ValueError("Candidate preprocessing differs from evaluated pipeline")
        if not 1 <= threads <= 8:
            raise ValueError("Bounded CPU thread count required")
        torch.set_num_threads(threads)
        self.model = AutoModelForImageClassification.from_pretrained(directory, local_files_only=True,
            trust_remote_code=False, use_safetensors=True).eval()
        expected = {i: label for i, label in enumerate(self.report["labels"])}
        if self.model.config.id2label != expected:
            raise ValueError("Model vocabulary differs from evaluation")

    def recognise(self, request):
        raw = parse_request(request)
        Image.MAX_IMAGE_PIXELS = 1_000_000
        with Image.open(io.BytesIO(raw)) as image:
            if image.format != "JPEG" or max(image.size) > 768 or min(image.size) < 8:
                raise ValueError("Resized food JPEG required")
            pixels = image_tensor(image).unsqueeze(0)
        with torch.inference_mode():
            scores = torch.sigmoid(self.model(pixel_values=pixels).logits)[0].tolist()
        return food_response(scores, self.report["labels"], self.report["thresholds"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("candidate", type=Path)
    parser.add_argument("--research", action="store_true", help="Local diagnostic only; never accepted from a request")
    args = parser.parse_args()
    body = sys.stdin.buffer.read(1_100_001)
    if len(body) > 1_100_000:
        raise ValueError("Bounded request required")
    predictor = FoodPredictor(args.candidate, research=args.research)
    print(json.dumps(predictor.recognise(json.loads(body))))
