"""Validation-only routing between two Shift-trained heads, one frozen encoder.

No extra image model call, threshold relaxation, gradient training, new service
or test-selected rule. Outputs are food decisions, never calibrated confidence.
"""
import argparse
import copy
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil

from core import SCHEMA, digest, local_path, metrics, validate_manifest
from visible_learning import BASELINE_MAP, cached_features

FAMILY = "shift-visible-food-routed-1"


def decisions(probabilities, rules):
    return [[int(any(p[rule["head"]][j] >= t for j, t in rule["votes"]))
             if rule["head"] else 0 for rule in rules] for p in probabilities]


def qualify(directory, expected_family):
    value = json.loads((directory / "artifact.json").read_text())
    if value.get("model_family") != expected_family or value.get("status") != "research_candidate_only":
        raise ValueError("Expected pinned research source family required")
    for name, pin in value["files"].items():
        if digest(local_path(directory, name)) != pin:
            raise ValueError("Source head bytes changed")
    return json.loads((directory / "head.json").read_text())


def build(args):
    import torch
    from safetensors.torch import load_file, save_file
    from semantic_model import FoodHead, PREPROCESS
    torch.set_num_threads(4)
    manifest = validate_manifest(args.manifest)
    report = json.loads((args.visible / "evaluation.json").read_text())
    if digest(args.manifest) != report["source_manifest_sha256"]:
        raise ValueError("Same visible training manifest required")
    settings = {"baseline": qualify(args.baseline, "shift-siglip-food-head-1"),
                "visible": qualify(args.visible, "shift-visible-food-head-1")}
    if any(m["views"] != 1 or m["width"] != 768 or m["preprocess"] != PREPROCESS for m in settings.values()):
        raise ValueError("Both source heads must use the identical full-image encoder")
    if (args.baseline / "base-source.json").read_bytes() != (args.visible / "base-source.json").read_bytes():
        raise ValueError("Same frozen encoder required")
    heads = torch.nn.ModuleDict({key: FoodHead(768, len(m["labels"])) for key, m in settings.items()})
    for key, directory in (("baseline", args.baseline), ("visible", args.visible)):
        heads[key].load_state_dict(load_file(directory / "head.safetensors")); heads[key].eval()
    labels = report["labels"]
    splits = {s: [r for r in manifest["samples"] if r["split"] == s] for s in ("validation", "test")}

    def score(rows):
        x = cached_features(rows, args.feature_cache)[:, :768]
        with torch.no_grad():
            values = {k: torch.sigmoid(h(x)).tolist() for k, h in heads.items()}
        return [{k: values[k][i] for k in values} for i in range(len(rows))]

    validation_scores = score(splits["validation"])
    validation_y = [[int(l in row["labels"]) for l in labels] for row in splits["validation"]]
    rules = []; selection = []
    for j, label in enumerate(labels):
        alternatives = []
        for key, m in settings.items():
            votes = [[i, t] for i, (source, t) in enumerate(zip(m["labels"], m["thresholds"]))
                if (BASELINE_MAP.get(source) if key == "baseline" else source) == label and t <= 1]
            if not votes:
                continue
            predicted = [any(p[key][i] >= t for i, t in votes) for p in validation_scores]
            count = sum(predicted); tp = sum(p and y[j] for p, y in zip(predicted, validation_y)); support = sum(y[j] for y in validation_y)
            precision = tp / count if count else 0
            f1 = 2 * tp / (count + support) if count + support else 0
            eligible = count >= 5 and precision >= .85
            alternatives.append({"head": key, "votes": votes, "predictions": count, "precision": precision,
                "recall": tp / support if support else None, "f1": f1, "eligible": eligible})
        eligible = [a for a in alternatives if a["eligible"]]
        # Deterministic tie break favours the current visible head. Test unused.
        selected = max(eligible, key=lambda a: (a["f1"], a["precision"], a["head"] == "visible")) if eligible else None
        rules.append({"head": selected["head"], "votes": selected["votes"]} if selected else {"head": None, "votes": []})
        selection.append({"label": label, "selected": selected["head"] if selected else None, "validation_alternatives": alternatives})
    # Freeze every rule before touching test predictions/targets for this router.
    test_scores = score(splits["test"])
    test_y = [[int(l in row["labels"]) for l in labels] for row in splits["test"]]
    predicted = decisions(test_scores, rules)
    final = copy.deepcopy(report)
    final.update(candidate=args.output.name, model_family=FAMILY, created_utc=datetime.now(timezone.utc).isoformat(),
        thresholds=[.5] * len(labels), disabled_classes=[l for l, r in zip(labels, rules) if not r["head"]],
        validation=metrics(decisions(validation_scores, rules), validation_y, [.5] * len(labels), labels),
        test=metrics(predicted, test_y, [.5] * len(labels), labels))
    final["training"] = {"method": "Validation-only class routing between two existing Shift-trained heads; no additional gradient training",
        "source_visible_training": report["training"], "selection": "Existing 85% validation precision / 5 predictions floor, then maximum per-class validation F1",
        "encoder_updated": False, "trained_from_scratch": False, "selected_views": 1,
        "encoder_calls_per_scan": 1, "new_paid_services": False,
        "rules": selection, "source_artifact_sha256": {k: digest(p / "artifact.json") for k, p in (("baseline", args.baseline), ("visible", args.visible))}}
    common = final["same_images_shared_categories"]["labels"]; indices = [labels.index(l) for l in common]
    y = [[row[j] for j in indices] for row in test_y]; p = [[row[j] for j in indices] for row in predicted]
    shared = final["same_images_shared_categories"]
    shared["candidate"] = metrics(p, y, [.5] * len(common), common)
    for group in shared["by_capture_week"]:
        offsets = [i for i, row in enumerate(splits["test"]) if row["group_id"] == group["capture_group"]]
        group["candidate"] = metrics([p[i] for i in offsets], [y[i] for i in offsets], [.5] * len(common), common)
    final["limitations"] += ["Routing uses the same previously inspected development test; no fresh acceptance claim", "Model outputs are decisions, not calibrated probabilities"]
    from core import release_blockers
    final["release_blockers"] = release_blockers(final)
    args.output.mkdir(parents=True, exist_ok=False)
    save_file(heads.state_dict(), args.output / "head.safetensors")
    meta = {"family": FAMILY, "width": 768, "views": 1, "preprocess": PREPROCESS, "labels": labels,
        "thresholds": [.5] * len(labels), "rules": rules, "source_heads": settings}
    (args.output / "head.json").write_text(json.dumps(meta, indent=2) + "\n")
    (args.output / "evaluation.json").write_text(json.dumps(final, indent=2) + "\n")
    for name in ("research-manifest.json", "base-source.json", "BASE-LICENSE", "ATTRIBUTION.txt"):
        shutil.copyfile(args.visible / name, args.output / name)
    (args.output / "test-predictions.json").write_text(json.dumps([
        {"id": r["id"], "targets": y, "scores": p} for r, y, p in zip(splits["test"], test_y, predicted)], indent=2) + "\n")
    pins = {p.name: digest(p) for p in args.output.iterdir() if p.is_file()}
    (args.output / "artifact.json").write_text(json.dumps({"schema": SCHEMA, "model_family": FAMILY,
        "status": "research_candidate_only", "files": pins, "base_weights_embedded": False}, indent=2) + "\n")
    print(json.dumps({"candidate": args.output.name, "test": final["test"], "shared": shared,
        "heads": {l: r["head"] for l, r in zip(labels, rules) if r["head"]}}, indent=2))


def load_routed_predictor(directory, base, *, research=False):
    if not research:
        raise ValueError("Routed visible-food candidate remains research only")
    import torch
    from safetensors.torch import load_file
    from semantic_model import SemanticPredictor, FoodHead, PREPROCESS, encoder
    pins = json.loads((directory / "artifact.json").read_text())
    required = {"head.json", "head.safetensors", "evaluation.json", "base-source.json", "research-manifest.json", "ATTRIBUTION.txt", "BASE-LICENSE", "test-predictions.json"}
    if (pins.get("model_family"), pins.get("status")) != (FAMILY, "research_candidate_only") or set(pins.get("files", {})) != required:
        raise ValueError("Complete pinned routed research candidate required")
    for name, pin in pins["files"].items():
        if digest(local_path(directory, name)) != pin:
            raise ValueError("Routed candidate bytes changed")
    settings = json.loads((directory / "head.json").read_text()); report = json.loads((directory / "evaluation.json").read_text())
    if settings.get("family") != FAMILY or settings.get("preprocess") != PREPROCESS or settings.get("width") != 768 or settings.get("views") != 1:
        raise ValueError("Identical full-image encoder required")
    if settings["labels"] != report["labels"] or settings["thresholds"] != [.5] * len(settings["labels"]) or report.get("production_ready") is not False:
        raise ValueError("Research contract differs from report")
    if digest(directory / "research-manifest.json") != report["source_manifest_sha256"]:
        raise ValueError("Training provenance changed")
    if len(settings["rules"]) != len(settings["labels"]):
        raise ValueError("One explicit route per food group required")
    if set(settings.get("source_heads", {})) != {"baseline", "visible"} or any(
        m.get("views") != 1 or m.get("width") != 768 or m.get("preprocess") != PREPROCESS
        for m in settings["source_heads"].values()):
        raise ValueError("Known source preprocessing required")
    for label, rule in zip(settings["labels"], settings["rules"]):
        if rule["head"] is None and rule["votes"] == []:
            continue
        if rule["head"] not in settings["source_heads"] or not rule["votes"]:
            raise ValueError("Known bounded source head required")
        width = len(settings["source_heads"][rule["head"]]["labels"])
        if any(type(i) is not int or not 0 <= i < width or type(t) not in (int, float) or not .1 <= t < 1 for i, t in rule["votes"]):
            raise ValueError("Bounded existing source thresholds required")
        source = settings["source_heads"][rule["head"]]
        if any(t != source["thresholds"][i] or (
            BASELINE_MAP.get(source["labels"][i]) if rule["head"] == "baseline" else source["labels"][i]) != label
            for i, t in rule["votes"]):
            raise ValueError("Source cutoff or category mapping changed")
    torch.set_num_threads(4); model, source = encoder(base)
    if source != json.loads((directory / "base-source.json").read_text()):
        raise ValueError("Wrong pinned base")

    class RoutedPredictor(SemanticPredictor):
        def __init__(self):
            self.settings = settings; self.report = report; self.model = model
            self.heads = torch.nn.ModuleDict({k: FoodHead(768, len(m["labels"])) for k, m in settings["source_heads"].items()})
            self.heads.load_state_dict(load_file(directory / "head.safetensors"), strict=True); self.heads.eval()

        def score_features(self, embedding):
            with torch.inference_mode():
                scores = {k: torch.sigmoid(h(embedding))[0].tolist() for k, h in self.heads.items()}
            return decisions([scores], settings["rules"])[0]

    return RoutedPredictor()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("visible", "baseline", "manifest", "feature-cache", "output"):
        parser.add_argument("--" + name, type=Path, required=True)
    build(parser.parse_args())
