"""Keep the 99.99% request measurable; never turn a point score into proof."""
import argparse
import json
import math
from pathlib import Path

from core import digest, validate_scores

TARGET = .9999


def zero_error_required(target=TARGET, confidence=.95, simultaneous_metrics=1):
    if not 0 < target < 1 or not 0 < confidence < 1 or type(simultaneous_metrics) is not int or simultaneous_metrics < 1:
        raise ValueError("Bounded target, confidence and positive metric count required")
    alpha = (1 - confidence) / simultaneous_metrics
    # Exact one-sided zero-error binomial bound, Bonferroni if multiple metrics.
    # Independence/representativeness are assumptions, never inferred from count.
    return math.ceil(math.log(alpha) / math.log(target))


def count_foods(scores, targets, thresholds, labels):
    validate_scores(scores, targets, len(labels))
    if len(thresholds) != len(labels) or len(set(labels)) != len(labels):
        raise ValueError("Fixed complete vocabulary and one threshold per label required")
    if any(type(t) not in (int, float) or not math.isfinite(t) or not 0 <= t <= 1.01 for t in thresholds):
        raise ValueError("Bounded thresholds required")
    tp = fp = fn = abstained = 0
    for row, expected in zip(scores, targets):
        # Match the actual response cap/order. Hidden extra classifier outputs
        # cannot count as food that the member was shown.
        shown = {j for j in sorted(range(len(row)), key=lambda j: -row[j]) if row[j] >= thresholds[j]}
        shown = set(sorted(shown, key=lambda j: (-row[j], j))[:12])
        selected = [j in shown for j in range(len(row))]
        abstained += not any(selected)
        for predicted, actual in zip(selected, expected):
            tp += bool(predicted and actual); fp += bool(predicted and not actual); fn += bool(not predicted and actual)
    return {"true_positive": tp, "false_positive": fp, "false_negative": fn,
        "predicted_components": tp + fp, "actual_visible_components": tp + fn,
        "precision": tp / (tp + fp) if tp + fp else None,
        "recall": tp / (tp + fn) if tp + fn else None,
        "photos": len(scores), "photos_without_suggestions": abstained}


def assess(counts):
    point_target = all(counts.get(k) is not None and counts[k] >= TARGET for k in ("precision", "recall"))
    return {"requested_precision": TARGET, "requested_recall": TARGET, "point_target_met": point_target,
        "claim_verified": False, "production_approval": False,
        "reason": "These development results cannot establish representative independent real-world 99.99% performance",
        "illustration_only_zero_error_samples": {
            "per_single_metric_one_sided_95_percent": zero_error_required(),
            "per_metric_for_both_simultaneous_95_percent_bonferroni": zero_error_required(simultaneous_metrics=2),
            "assumptions": "Zero errors; independent representative Bernoulli trials per appropriate denominator. Not an image quota, current confidence interval, guarantee, or allowance to count correlated components as independent."}}


def scorecard(args):
    report = json.loads(args.report.read_text()); manifest = json.loads(args.manifest.read_text())
    if digest(args.manifest) != report["source_manifest_sha256"] or manifest["labels"] != report["labels"]:
        raise ValueError("Unchanged full vocabulary and exact evaluated manifest required")
    rows = json.loads(args.predictions.read_text()); truth = {r["id"]: r for r in manifest["samples"] if r["split"] == "test"}
    if len(rows) != len(truth) or {r["id"] for r in rows} != set(truth):
        raise ValueError("Every evaluated test photo must be accounted for exactly once")
    labels = report["labels"]
    targets = [[int(l in truth[r["id"]]["labels"]) for l in labels] for r in rows]
    if any(r["targets"] != y for r, y in zip(rows, targets)):
        raise ValueError("Stored targets differ from source truth")
    counts = count_foods([r["scores"] for r in rows], targets, report["thresholds"], labels)
    peak = max(sum(p >= t for p, t in zip(r["scores"], report["thresholds"])) for r in rows)
    if peak > 12:
        raise ValueError("Reload receipt needs actual capped-response metrics before a primary scorecard can be published")
    gated = json.loads(args.gated_report.read_text())
    if gated["food_images"] != len(rows) or gated["ungated"] != report["test"]:
        raise ValueError("Actual gate/reload proof differs from selected candidate")
    return {"schema": "shift-food-quality-contract-1", "candidate": report["candidate"],
        "metrics": {"definition": "Component micro precision=TP/(TP+FP), recall=TP/(TP+FN); fixed visible vocabulary",
            "primary_gate_applied_full_vocabulary": gated["gated"],
            "ungated_full_vocabulary_exact_counts": counts,
            "response_item_cap": 12, "maximum_classifier_suggestions_on_this_set": peak,
            "shared_category_diagnostic_only": report.get("same_images_shared_categories", {}).get("candidate"),
            "member_assisted_record_accuracy": None, "nutrition_accuracy": None},
        "target_assessment": assess({"precision": gated["gated"]["micro_precision"], "recall": gated["gated"]["micro_recall"]}),
        "rules": ["Abstentions and food-gate rejections still count as missed visible components",
            "Disabled categories remain in recall denominator", "Corrected or confirmed entries cannot be counted as correct photo-only predictions",
            "No changing vocabulary, test split, food granularity or denominator to meet target",
            "False non-food acceptance is a separate required metric, not hidden in food precision",
            "No exact recipe, hidden ingredient, quantity or nutrition claim from component scores"],
        "evidence": {"manifest_sha256": digest(args.manifest), "predictions_sha256": digest(args.predictions),
            "report_sha256": digest(args.report), "gate_receipt_sha256": digest(args.gated_report),
            "capture_weeks": len({r["group_id"] for r in truth.values()}),
            "independent_uk_acceptance": False, "real_non_food_acceptance": False,
            "photo_only_and_member_assisted_scored_separately": True}}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("report", "manifest", "predictions", "gated-report"):
        parser.add_argument("--" + name, type=Path, required=True)
    print(json.dumps(scorecard(parser.parse_args()), indent=2))
