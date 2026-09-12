"""REC-032: add only approved employer assets and explicit discovery links."""
import base64, copy, gzip, hashlib, json, pathlib, re, subprocess, time, urllib.parse, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
LIVE = 'https://ff90af34.projectshift.pages.dev'
LOCKED = 'e3fa4e233a125816d26caf4a2ab392949bc656d3f8cf77f16ea06e541367bb88'
APPROVED = '2002cc69fc4f399171a60ca039b59a56fd5f6bbd'
source = HERE / 'source.json.gz'
raw = source.read_bytes()
assert hashlib.sha256(raw).hexdigest() == 'aba57eed30ffee597222983b094993fb2138869e88cf20dc543d820ad2cf767e'
base = json.loads(gzip.decompress(raw))
assert base['source_fingerprint'] == LOCKED
p = copy.deepcopy(base)
old = {x['path']: x for x in base['files']}
approved_raw = subprocess.check_output(['git', 'show', APPROVED + ':release/public-pages-20260911/source.json.gz'])
assert hashlib.sha256(approved_raw).hexdigest() == 'a3e2d6f5383b19a410d12fe0e585004e9a2d504f7e9547a61649e51780eea3f1'
approved = json.loads(gzip.decompress(approved_raw))
approved_entries = {x['path']: x for x in approved['files']}
changes, originals, link_counts = {}, {}, {}

def entry(name, data):
    return {'path': name, 'sha256': hashlib.sha256(data).hexdigest(), 'bytes': len(data)}

def read_bytes(payload, name, entries, origin=LIVE):
    if name in payload['overrides']:
        data = payload['overrides'][name].encode()
    elif name in payload.get('binary_overrides', {}):
        data = base64.b64decode(payload['binary_overrides'][name], validate=True)
    else:
        for attempt in range(3):
            try:
                url = origin + '/' + urllib.parse.quote(name, safe='/')
                request = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'SHIFT-REC032-verification'})
                with urllib.request.urlopen(request, timeout=30) as r:
                    data = r.read()
                break
            except OSError:
                if attempt == 2: raise
                time.sleep(attempt + 1)
    assert entry(name, data) == entries[name], name + ': source differs'
    return data

anchor = '<a href="/work-with-us">Work With Us</a>'
link = '<a href="/shift-for-work">SHIFT for Work</a>'
corporate_link = '<p><a href="/shift-for-work">Explore SHIFT for Work — our 12-week employer programme →</a></p>'

for name in sorted(old):
    if not name.endswith('.html'): continue
    data = read_bytes(base, name, old)
    text = data.decode()
    updated = text.replace(anchor, link + anchor)
    if anchor in text: link_counts[name] = text.count(anchor)
    if name == 'work-with-us.html':
        assert updated.count('href="/corporate-wellbeing"') == 1
        updated = updated.replace('href="/corporate-wellbeing"', 'href="/shift-for-work"')
    if name == 'corporate-wellbeing.html':
        assert updated.count('</h1>') == 1
        updated = updated.replace('</h1>', '</h1>' + corporate_link, 1)
    normalized = updated.replace(link + anchor, anchor)
    if name == 'work-with-us.html':
        normalized = normalized.replace('href="/shift-for-work"', 'href="/corporate-wellbeing"')
    if name == 'corporate-wellbeing.html': normalized = normalized.replace(corporate_link, '')
    assert normalized == text, name + ': unrelated page edit'
    if updated != text:
        originals[name] = data
        changes[name] = updated.encode()

new_names = ['assets/shift-for-work-v1.css', 'assets/shift-for-work-v1.js', 'shift-for-work.html', 'downloads/SHIFT-for-Work-Proposition.pdf']
for name in new_names:
    assert name not in old, name + ': already exists; inspect before changing'
    data = read_bytes(approved, name, approved_entries)
    if name == 'shift-for-work.html':
        before = data.decode()
        assert before.count(anchor) == 2
        data = before.replace(anchor, link + anchor).encode()
        assert data.decode().replace(link + anchor, anchor) == before
    changes[name] = data

assert base['overrides']['start-here-v72.js'].encode() == read_bytes(base, 'start-here-v72.js', old)
assert 'Based on your answers, this could perhaps work for you…' in changes['treatment-order.html'].decode()
assert 'location.href=`/treatment-order?medicine=${encodeURIComponent(recommended)}&view=spec&from=start-here`;' in base['overrides']['start-here-v72.js']

sitemap_name = 'sitemap.xml'
sitemap = read_bytes(base, sitemap_name, old).decode()
assert '</urlset>' in sitemap, 'inspect sitemap structure before changing'
assert 'https://shiftsometimber.co.uk/shift-for-work<' not in sitemap
changes[sitemap_name] = sitemap.replace('</urlset>', '<url><loc>https://shiftsometimber.co.uk/shift-for-work</loc><lastmod>2026-09-12</lastmod></url>\n</urlset>').encode()
originals[sitemap_name] = sitemap.encode()

integrity = json.loads(base['overrides']['release-body-integrity.json'])
for name, data in changes.items():
    if name.endswith('.html') and '</head>' in data.decode():
        integrity[name] = hashlib.sha256(data.decode().split('</head>', 1)[1].encode()).hexdigest()
changes['release-body-integrity.json'] = (json.dumps(integrity, indent=2) + '\n').encode()
fp = json.loads(base['overrides']['DEPLOYMENT-FINGERPRINT.json'])
fp_entries = {x['path']: x for x in fp['files']}
for name, data in changes.items(): fp_entries[name] = entry(name, data)
fp['files'] = [fp_entries[n] for n in sorted(fp_entries)]
fp['file_count'] = len(fp['files'])
fp['aggregate_sha256'] = hashlib.sha256(''.join(f"{x['sha256']}  {x['path']}\n" for x in fp['files']).encode()).hexdigest()
changes['DEPLOYMENT-FINGERPRINT.json'] = (json.dumps(fp, indent=2) + '\n').encode()
entries = dict(old)
for name, data in changes.items():
    entries[name] = entry(name, data)
    if name.endswith('.pdf'):
        p.setdefault('binary_overrides', {})[name] = base64.b64encode(data).decode()
    else:
        p['overrides'][name] = data.decode()
p['files'] = [entries[n] for n in sorted(entries)]
p['baseline_fingerprint'] = LOCKED
p['source_fingerprint'] = fp['aggregate_sha256']
assert set(entries) - set(old) == set(new_names)
assert 'start-here-v72.js' not in changes
assert all(not n.startswith(('member-', 'member/', 'assets/member-', 'work/')) for n in changes if not n.endswith('.html'))
packed = gzip.compress(json.dumps(p, separators=(',', ':'), ensure_ascii=False).encode(), mtime=0)
control = json.loads((HERE / 'work-control.json').read_text())
assert control['mode'] in ('preview', 'production')
assert control['expected_live_fingerprint'] == LOCKED
calculated = {'source_fingerprint': p['source_fingerprint'], 'payload_sha256': hashlib.sha256(packed).hexdigest()}
if control['mode'] == 'production':
    assert control['preview_browser_checks_passed'] is True
    for key, value in calculated.items(): assert control[key] == value, key + ': production differs from reviewed preview'
else:
    for key, value in calculated.items():
        if key in control: assert control[key] == value
control.update(calculated)
(HERE / 'control.json').write_text(json.dumps(control, indent=2) + '\n')
source.write_bytes(packed)
proof = {'change': 'REC-032', 'baseline_fingerprint': LOCKED, **calculated, 'approved_assets_commit': APPROVED, 'file_count': len(entries), 'unchanged_files': len(old) - len(set(changes) & set(old)), 'navigation_pages': len(link_counts), 'navigation_links': sum(link_counts.values()), 'locked_start_here_logic_unchanged': True, 'normalized_existing_page_bodies_unchanged': True, 'changes': [{'path': n, 'before': old.get(n), 'after': entries[n]} for n in sorted(changes)]}
(HERE / 'work-public-source-proof.json').write_text(json.dumps(proof, indent=2) + '\n')
import difflib
patch = ''.join(''.join(difflib.unified_diff(originals[n].decode().splitlines(True), changes[n].decode().splitlines(True), fromfile='before/' + n, tofile='after/' + n)) for n in originals)
(HERE / 'REC-032.patch').write_text(patch)
print(json.dumps({k:v for k,v in proof.items() if k != 'changes'}, indent=2))
