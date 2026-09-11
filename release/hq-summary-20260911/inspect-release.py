"""Inspect the existing HQ release, without authentication or editorial actions."""
import hashlib, json, os, pathlib, urllib.error, urllib.request

ACCOUNT = '9e5386dcf455be34c582d93f8bfc79e6'
BASE = 'https://api.cloudflare.com/client/v4/accounts/' + ACCOUNT
CANDIDATE = 'd4700815-1663-44ad-8949-07a3dd46d42e'
SOURCE = '5036b022543d96ba2020fb5c952030317f50a1fb'
BASELINE = 'e281e8748b74177303d467f74c01b24d2337f066'
ASSETS = ['index.html', 'hq.js', 'hq-v111.js', 'hq.css', 'hq-knowledge-editorial.css', 'hq-evidence-desk.css', 'turnstile-auth-v1.js']

def api(path, body=None, method='GET'):
    request = urllib.request.Request(BASE + path, headers={
        'Authorization': 'Bearer ' + os.environ['CLOUDFLARE_API_TOKEN'],
        'Content-Type': 'application/json',
    }, method=method, data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(request, timeout=35) as response:
            result = json.load(response)
    except urllib.error.HTTPError as error:
        try: codes = [e.get('code') for e in json.load(error).get('errors', [])]
        except Exception: codes = []
        raise SystemExit('Cloudflare HTTP ' + str(error.code) + '; codes=' + json.dumps(codes) + '; endpoint=' + path) from None
    assert result.get('success'), 'Cloudflare request failed'
    return result['result']

def public(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'SHIFT-HQ-release-verification'}), timeout=35) as response:
        assert response.status == 200, 'Public asset unavailable'
        return response.read()

def digest(value):
    return hashlib.sha256(value if isinstance(value, bytes) else json.dumps(value, sort_keys=True).encode()).hexdigest()

def version_report(version):
    resources = version['resources']
    return {'id': version['id'], 'script': resources.get('script'), 'runtime': resources.get('script_runtime'),
            'bindings_sha256': digest(resources.get('bindings')), 'binding_types': [b.get('type') for b in resources.get('bindings', [])]}

live = api('/workers/scripts/shift-hq/deployments')['deployments'][0]
assert len(live['versions']) == 1 and live['versions'][0]['percentage'] == 100, 'Unexpected HQ traffic split'
active_id = live['versions'][0]['version_id']
active = api('/workers/scripts/shift-hq/versions/' + active_id)
candidate = api('/workers/scripts/shift-hq/versions/' + CANDIDATE)
core_before = api('/workers/scripts/shift-core/deployments')['deployments'][0]['versions']
domains = api('/workers/domains')
domain = [x for x in domains if x.get('hostname') == 'hq.shiftsometimber.co.uk']
report = {'mode': 'inspect', 'source_commit': SOURCE, 'baseline_commit': BASELINE,
          'hq_domain': [{k:x.get(k) for k in ['hostname','service','environment']} for x in domain],
          'active': version_report(active), 'candidate': version_report(candidate), 'core_versions': core_before, 'assets': {}}
for name in ASSETS:
    before = public('https://raw.githubusercontent.com/shiftsometimber/shift-hq/' + BASELINE + '/' + name)
    after = public('https://raw.githubusercontent.com/shiftsometimber/shift-hq/' + SOURCE + '/' + name)
    preview = public('https://d4700815-shift-hq.matobrien.workers.dev/' + name + '?hq_summary_release=20260911')
    current = public('https://hq.shiftsometimber.co.uk/' + name + '?hq_summary_release=20260911')
    report['assets'][name] = {'before_sha256':digest(before),'source_sha256':digest(after),'preview_sha256':digest(preview),'production_sha256':digest(current),
                              'preview_matches_source':preview == after,'production_matches_baseline':current == before,'changed':before != after}
    assert preview == after, 'Preview asset differs from reviewed source: ' + name
    assert current == before, 'Production asset differs from baseline: ' + name
assert [n for n,r in report['assets'].items() if r['changed']] == ['index.html','hq.js'], 'Unexpected HQ browser changes'
pages = json.loads(public('https://shiftsometimber.co.uk/DEPLOYMENT-FINGERPRINT.json'))
report['pages_fingerprint'] = {k: pages[k] for k in ['aggregate_sha256','file_count']}
assert pages['aggregate_sha256'] == '5d7007a2eb1b7b8adf84609ceb6e0134b316240271c6511054d0aa1a7af56887', 'Public Pages production moved'
assert api('/workers/scripts/shift-core/deployments')['deployments'][0]['versions'] == core_before, 'Core runtime changed during inspection'
pathlib.Path('hq-release-report.json').write_text(json.dumps(report,indent=2) + '\n')
print(json.dumps(report,sort_keys=True))
print('PASS: seven HQ browser assets verified; only index.html and hq.js differ; no production mutation.')
