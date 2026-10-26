#!/usr/bin/env python3
"""Read-only route preflight and conservative same-owner redundancy proof.

Content-only releases remain possible at capacity. Route-writing callers must
provide their actual planned additions; existing other-service routes are never
silently reassigned. This module never mutates Cloudflare.
"""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.request

ZONE_ID = "66ec3268950adcfc837b7b8b2f8356ed"
LIMIT = 1000


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def shape(route):
    pattern = route["pattern"]
    scheme, rest = pattern.split("://", 1) if "://" in pattern else ("*", pattern)
    host, sep, path = rest.partition("/")
    path = "/" + path if sep else "/"
    if scheme not in ("*", "http", "https") or "*" in host or "?" in pattern:
        raise ValueError("Unsupported route shape; retain it: " + pattern)
    wildcard = path.endswith("*")
    literal = path[:-1] if wildcard else path
    if "*" in literal:
        raise ValueError("Unsupported infix wildcard; retain it: " + pattern)
    return scheme, host.lower(), literal, wildcard


def behaviour(route):
    return route.get("script"), route.get("request_limit_fail_open", False)


def contains(parent, child):
    sa, ha, pa, wa = shape(parent)
    sb, hb, pb, wb = shape(child)
    return ha == hb and (sa == "*" or sa == sb) and wa and pb.startswith(pa) and (len(pb) > len(pa) or not wb)


def overlaps(a, b):
    sa, ha, pa, wa = shape(a)
    sb, hb, pb, wb = shape(b)
    if ha != hb or sa != "*" and sb != "*" and sa != sb:
        return False
    return pa == pb or wa and pb.startswith(pa) or wb and pa.startswith(pb)


def redundant_routes(routes, owner="shift-core"):
    """Remove only when a retained same-behaviour ancestor covers the region.

    A different-service ancestor or equal-path exception prevents removal.
    More specific descendants continue to win. Greedy steps are individually
    equivalent, so the resulting table preserves the complete routing function.
    Unknown patterns anywhere cause this proof to fail closed.
    """
    for route in routes:
        shape(route)
    current = list(routes)
    removed = []
    for route in sorted(routes, key=lambda r: len(shape(r)[2]), reverse=True):
        if route.get("script") != owner:
            continue
        parents = [p for p in current if p != route and contains(p, route) and behaviour(p) == behaviour(route)]
        for parent in sorted(parents, key=lambda p: len(shape(p)[2]), reverse=True):
            competing = [t for t in current if t != route and behaviour(t) != behaviour(route) and overlaps(t, route) and not contains(route, t)]
            if competing:
                continue
            current.remove(route)
            removed.append({"route": route, "coveredBy": parent})
            break
    return {"beforeHash": digest(sorted(routes, key=lambda r: r["id"])), "remove": removed, "retained": current}


def capacity(routes, planned=(), limit=LIMIT):
    existing = {r["pattern"]: r for r in routes}
    if len(existing) != len(routes):
        raise ValueError("Duplicate live patterns; inspect before publishing")
    additions = {}
    for route in planned:
        pattern = route["pattern"]
        if pattern in additions and behaviour(additions[pattern]) != behaviour(route):
            raise ValueError("Conflicting planned owners: " + pattern)
        if pattern in existing:
            if behaviour(existing[pattern]) != behaviour(route):
                raise ValueError("Existing service would be reassigned: " + pattern)
        else:
            additions[pattern] = route
    projected = len(routes) + len(additions)
    result = {"current": len(routes), "newRules": len(additions), "projected": projected,
              "limit": limit, "remaining": limit - projected, "warning": projected >= 900}
    if projected > limit:
        raise ValueError("Route capacity exceeded before upload: " + json.dumps(result, sort_keys=True))
    return result


def jsonc(text):
    # Remove comments and trailing commas only outside quoted JSON strings.
    token = re.compile(r'"(?:\\.|[^"\\])*"|//[^\n]*|/\*[\s\S]*?\*/')
    clean = token.sub(lambda m: m.group(0) if m.group(0).startswith('"') else " ", text)
    token = re.compile(r'"(?:\\.|[^"\\])*"|,\s*(?=[}\]])')
    clean = token.sub(lambda m: m.group(0) if m.group(0).startswith('"') else "", clean)
    return json.loads(clean)


def token():
    value = os.environ.get("CLOUDFLARE_API_TOKEN")
    if value:
        return value
    config = Path.home() / "Library/Preferences/.wrangler/config/default.toml"
    if config.exists():
        found = re.search(r'^oauth_token\s*=\s*"([^"]+)"', config.read_text(), re.M)
        if found:
            return found[1]
    raise ValueError("Authenticated Cloudflare access is required")


def get_routes(zone_id):
    request = urllib.request.Request("https://api.cloudflare.com/client/v4/zones/" + zone_id + "/workers/routes",
                                    headers={"Authorization": "Bearer " + token()})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.load(response)
    if not data.get("success") or not isinstance(data.get("result"), list):
        raise ValueError("Provider route read did not succeed")
    return data["result"]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("check", "plan"))
    parser.add_argument("--zone-id", default=os.environ.get("CLOUDFLARE_ZONE_ID", ZONE_ID))
    parser.add_argument("--snapshot", help="Offline fixture or retained authenticated snapshot")
    parser.add_argument("--intent", choices=("content-only", "routes"), default="content-only")
    parser.add_argument("--planned", help="JSON list of actual proposed route writes")
    parser.add_argument("--config", help="Wrangler JSONC, for a route-writing release only")
    parser.add_argument("--report")
    args = parser.parse_args()
    snapshot = json.loads(Path(args.snapshot).read_text()) if args.snapshot else None
    routes = (snapshot["routes"] if isinstance(snapshot, dict) else snapshot) if snapshot is not None else get_routes(args.zone_id)
    if args.command == "plan":
        result = redundant_routes(routes)
    else:
        if args.intent == "content-only" and (args.planned or args.config):
            raise ValueError("Content-only intent cannot conceal a route-writing plan")
        if args.intent == "routes" and not (args.planned or args.config):
            raise ValueError("Route-writing intent requires the actual plan")
        planned = json.loads(Path(args.planned).read_text()) if args.planned else []
        if args.config:
            config = jsonc(Path(args.config).read_text())
            planned += [{"pattern": r["pattern"], "script": config["name"]} for r in config.get("routes", []) if not r.get("custom_domain")]
        result = capacity(routes, planned)
        result["intent"] = args.intent
    result["at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    if args.report:
        path = Path(args.report)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({k: v for k, v in result.items() if k not in ("remove", "retained")}, sort_keys=True))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        # Never include request headers, credential values or full provider bodies.
        print("Route preflight failed: " + str(error), file=sys.stderr)
        sys.exit(1)
