"""Additional noindex preview-only frame harness; never added to production."""
import json, os, pathlib
here=pathlib.Path(__file__).resolve().parent
control=json.loads((here/'control.json').read_text())
release=pathlib.Path(os.environ['SST_RELEASE_DIR'])
target=release/'_review-work-public.html'
assert not target.exists()
if control['mode']=='preview':
    frames=''.join(f'<section><h2>{w}px</h2><iframe title="SHIFT for Work at {w}px" width="{w}" height="1100" src="/shift-for-work" loading="eager"></iframe></section>' for w in [1440,1024,768,390,360])
    target.write_text('<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>REC-032 responsive review</title></head><body><h1>Preview-only responsive review</h1><p>Exact candidate pages, framed at five widths. Form submissions are refused by the existing preview guard. This reviewer is excluded from production.</p>'+frames+'</body></html>')
    print('Added one explicit noindex QA harness to preview only; candidate application bytes unchanged.')
else:
    print('Production contains no responsive QA harness.')
