"""Materialise only the exact locally reviewed Pages bytes; never accept a stale file."""
import base64, concurrent.futures, gzip, hashlib, json, os, pathlib, subprocess, urllib.error, urllib.parse, urllib.request

HERE = pathlib.Path(__file__).resolve().parent
control = json.loads((HERE / 'control.json').read_text())
compressed = (HERE / 'source.json.gz').read_bytes()
assert hashlib.sha256(compressed).hexdigest() == control['payload_sha256'], 'payload changed'
payload = json.loads(gzip.decompress(compressed))
assert payload['source_fingerprint'] == control['source_fingerprint'], 'source changed'
assert control['mode'] in ('preview', 'production'), 'unknown release mode'

def get(url, authenticated=False):
    headers = {'User-Agent': 'SST-verified-Pages-release/1', 'Cache-Control': 'no-cache'}
    if authenticated:
        token = os.environ.get('CLOUDFLARE_API_TOKEN', '')
        assert token, 'repository credential absent'
        headers['Authorization'] = 'Bearer ' + token
    request = urllib.request.Request(url, headers=headers, method='GET')
    with urllib.request.urlopen(request, timeout=35) as response:
        return response.read()

endpoint = 'https://api.cloudflare.com/client/v4/accounts/' + os.environ['CLOUDFLARE_ACCOUNT_ID'] + '/pages/projects/projectshift'
project = json.loads(get(endpoint, True))
assert project.get('success'), 'Pages project lookup failed'
project = project['result']
assert project['name'] == 'projectshift' and project['production_branch'] == 'main', 'project ownership/configuration differs'
origin = (project.get('canonical_deployment') or {}).get('url') or 'https://projectshift.pages.dev'
parsed = urllib.parse.urlparse(origin)
assert parsed.scheme == 'https' and (parsed.hostname == 'projectshift.pages.dev' or parsed.hostname.endswith('.projectshift.pages.dev')), 'unexpected Pages origin'
baseline = json.loads(get(origin.rstrip('/') + '/DEPLOYMENT-FINGERPRINT.json'))
assert baseline['aggregate_sha256'] == control['expected_live_fingerprint'], 'production moved; refuse stale release'

if control['mode'] == 'production':
    preview = control.get('approved_preview_url', '')
    host = urllib.parse.urlparse(preview)
    assert host.scheme == 'https' and host.hostname.endswith('.projectshift.pages.dev'), 'verified preview required'
    proof = json.loads(get(preview.rstrip('/') + '/DEPLOYMENT-FINGERPRINT.json'))
    assert proof['aggregate_sha256'] == control['source_fingerprint'], 'approved preview does not match release'
    assert control.get('preview_browser_checks_passed') is True, 'preview browser acceptance missing'

release = pathlib.Path(os.environ['RUNNER_TEMP']) / 'sst-pages-release'
release.mkdir()
entries = payload['files']
overrides = payload['overrides']
binary_overrides = payload.get('binary_overrides', {})
assert isinstance(binary_overrides, dict), 'invalid binary overrides'
assert not set(overrides).intersection(binary_overrides), 'ambiguous source override'
assert set(binary_overrides).issubset({entry['path'] for entry in entries}), 'untracked binary override'
failures = []

def materialise(entry):
    name = entry['path']
    parts = pathlib.PurePosixPath(name)
    assert not parts.is_absolute() and '..' not in parts.parts, 'invalid source path'
    if name in overrides:
        data = overrides[name].encode('utf-8')
    elif name in binary_overrides:
        data = base64.b64decode(binary_overrides[name], validate=True)
    else:
        # This is a byte cache only. The local master SHA decides whether it is usable.
        url = origin.rstrip('/') + '/' + urllib.parse.quote(name, safe='/')
        data = get(url)
    digest = hashlib.sha256(data).hexdigest()
    if digest != entry['sha256'] or len(data) != entry['bytes']:
        raise ValueError('content differs from the authoritative master')
    target = release / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return name

with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
    futures = {pool.submit(materialise, entry): entry['path'] for entry in entries}
    for future in concurrent.futures.as_completed(futures):
        try:
            future.result()
        except Exception as error:
            failures.append({'path': futures[future], 'error': str(error)})

if failures:
    print(json.dumps({'stage': 'assemble', 'failures': failures}, sort_keys=True))
    raise SystemExit('No upload: source could not be reproduced exactly')

actual = {p.relative_to(release).as_posix() for p in release.rglob('*') if p.is_file()}
assert actual == {entry['path'] for entry in entries}, 'file set differs'
assert '_worker.js' not in actual and not any(name.startswith('functions/') for name in actual), 'unexpected Pages runtime'
subprocess.run(['python3', 'scripts/release_fingerprint.py', '--verify'], cwd=release, check=True)
subprocess.run(['node', 'scripts/test-seo-release-integrity.mjs'], cwd=release, check=True)

home = (release / 'index.html').read_text()
assert 'data-shift-ai-full-wire' not in home, 'homepage ticker must stay absent'
assert 'hero-shirt' not in (release / 'shop.html').read_text().split('<body', 1)[-1], 'cartoon Shop hero returned'
assert 'body.about-story-page .reading-layout>.pagehero,' not in (release / 'assets/about-shift-v1.css').read_text(), 'About heading hidden'
for name in ('index.html', 'shop.html', 'about.html', 'medicine-news.html'):
    page = (release / name).read_text()
    assert 'href="/treatment-centre">Treatments</a>' in page, name + ': Treatments missing'
    assert 'href="/shop">Timber Mill</a>' in page, name + ': Timber Mill missing'
    assert 'class="site-footer"' in page, name + ': footer missing'
print(json.dumps({'verified_files': len(entries), 'source_fingerprint': control['source_fingerprint'], 'mode': control['mode'], 'source_origin': origin}, sort_keys=True))
with open(os.environ['GITHUB_ENV'], 'a') as env:
    env.write('SST_RELEASE_DIR=' + str(release) + '\n')
    env.write('SST_PAGES_BRANCH=' + ('main' if control['mode'] == 'production' else 'repair-20260911') + '\n')
