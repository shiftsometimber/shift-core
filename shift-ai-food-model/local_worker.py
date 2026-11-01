"""Research-only preloaded stdin worker. No HTTP listener or member storage."""
import argparse
import json
from pathlib import Path
import sys


def serve(model):
    print(json.dumps({"type": "ready", "protocol": "shift-food-local-worker-1", "productionReady": False}), flush=True)
    while True:
        raw = sys.stdin.buffer.readline(1_100_001)
        if not raw:
            return
        if len(raw) > 1_100_000 or not raw.endswith(b"\n"):
            raise ValueError("Bounded newline-delimited request required")
        request = response = result = None
        try:
            request = json.loads(raw)
            response = model.recognise(request)
            result = {"ok": True, "result": response}
        except (ValueError, TypeError, KeyError):
            result = {"ok": False, "error": "invalid_request"}
        except Exception:
            # Never print the exception: it could contain request-derived data.
            print(json.dumps({"ok": False, "error": "model_unavailable"}), flush=True)
            return
        finally:
            raw = request = response = None
        print(json.dumps(result, allow_nan=False), flush=True)
        result = None


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--candidate", type=Path, required=True)
    parser.add_argument("--base", type=Path, required=True)
    parser.add_argument("--gate", type=Path, required=True)
    parser.add_argument("--research", action="store_true")
    args = parser.parse_args()
    if not args.research:
        raise ValueError("Research-only local worker; production invocation refused")
    family = json.loads((args.candidate / "artifact.json").read_text()).get("model_family")
    if family in ("shift-visible-food-head-1", "shift-visible-food-routed-1"):
        from visible_learning import VisibleGatedPredictor
        model = VisibleGatedPredictor(args.candidate, args.base, args.gate, research=True)
    elif family == "shift-siglip-food-head-1":
        from food_gate import GatedPredictor
        model = GatedPredictor(args.candidate, args.base, args.gate, research=True)
    elif family in ("shift-spatial-food-localiser-1", "shift-spatial-food-ensemble-1"):
        from spatial_model import GatedSpatialPredictor
        model = GatedSpatialPredictor(args.candidate, args.base, args.gate, research=True)
    else:
        raise ValueError("Known pinned research candidate family required")
    serve(model)
