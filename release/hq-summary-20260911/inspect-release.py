"""Release only the reviewed HQ assets; preserve Pages, core, authentication and records."""
import difflib, hashlib, json, os, pathlib, re, time, urllib.error, urllib.request

ACCOUNT = '9e5386dcf455be34c582d93f8bfc79e6'
BASE = 'https://api.cloudflare.com/client/v4/accounts/' + ACCOUNT
CANDIDATE = 'd4700815-1663-44ad-8949-07a3dd46d42e'
SOURCE = '5036b022543d96ba2020fb5c952030317f50a1fb'
BASELINE = 'e281e8748b74177303d467f74c01b24d2337f066'
MERGED = '720f104454739f06639feb17c373ded96da2dd74'
PREVIOUS_VERSION = 'b45c8750-135f-468e-966e-4e7316840d50'
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

def source_bytes(name, value):
    if name != 'index.html': return value
    # Remove only the exact independently observed Cloudflare edge injection.
    # Raw and normalized hashes are retained; no application content is ignored.
    match = re.search(rb'<script type="module" src="https://static\.cloudflareinsights\.com/beacon\.min\.js/[^"\n]+"[^>]*></script>\n', value)
    if match:
        assert digest(match.group()) == 'ca63ee2125010c5a369002a7554fbf4d1c4a08b31664698847501a16335eb3cc', 'Cloudflare injection changed; inspect before proceeding'
        return value[:match.start()] + value[match.end():]
    return value

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
print(json.dumps(report,sort_keys=True))
evidence = pathlib.Path('hq-release-evidence')
evidence.mkdir(exist_ok=True)
source_assets = {}
for name in ASSETS:
    before = public('https://raw.githubusercontent.com/shiftsometimber/shift-hq/' + BASELINE + '/' + name)
    after = public('https://raw.githubusercontent.com/shiftsometimber/shift-hq/' + SOURCE + '/' + name)
    preview = public('https://d4700815-shift-hq.matobrien.workers.dev/' + name + '?hq_summary_release=20260911')
    current = public('https://hq.shiftsometimber.co.uk/' + name + '?hq_summary_release=20260911')
    merged = public('https://raw.githubusercontent.com/shiftsometimber/shift-hq/' + MERGED + '/' + name)
    assert merged == after, 'Main merge changed reviewed asset: ' + name
    source_assets[name] = after
    normalized = source_bytes(name,current)
    report['assets'][name] = {'before_sha256':digest(before),'source_sha256':digest(after),'preview_sha256':digest(preview),'production_sha256':digest(current),
                              'normalized_production_sha256':digest(normalized),'preview_matches_source':preview == after,'production_matches_baseline':normalized == before,
                              'production_matches_source':normalized == after,'changed':before != after}
    if normalized != before and normalized != after:
        diff = ''.join(difflib.unified_diff(before.decode().splitlines(True),normalized.decode().splitlines(True),fromfile='repository/'+name,tofile='production/'+name))
        (evidence/(name+'.diff')).write_text(diff)
        print(json.dumps({'mismatch':name,'diff':diff[:15000]}))
assert [n for n,r in report['assets'].items() if r['changed']] == ['index.html','hq.js'], 'Unexpected HQ browser changes'
pages = json.loads(public('https://shiftsometimber.co.uk/DEPLOYMENT-FINGERPRINT.json'))
report['pages_fingerprint'] = {k: pages[k] for k in ['aggregate_sha256','file_count']}
assert pages['aggregate_sha256'] == '5d7007a2eb1b7b8adf84609ceb6e0134b316240271c6511054d0aa1a7af56887', 'Public Pages production moved'
assert api('/workers/scripts/shift-core/deployments')['deployments'][0]['versions'] == core_before, 'Core runtime changed during inspection'
pathlib.Path('hq-release-report.json').write_text(json.dumps(report,indent=2) + '\n')
print(json.dumps(report,sort_keys=True))
assert all(r['preview_matches_source'] for r in report['assets'].values()), 'Preview differs from reviewed source'
already_live = all(r['production_matches_source'] for r in report['assets'].values())
assert already_live or all(r['production_matches_baseline'] for r in report['assets'].values()), 'Production differs from known versions; no deployment'
assert domain and domain[0].get('service') == 'shift-hq', 'Unexpected HQ domain ownership'
assert candidate['resources']['bindings'] == [], 'Unexpected candidate bindings'
assert candidate['resources']['script_runtime'] == {'assets': {'not_found_handling':'none','raw_run_worker_first':False,'serve_directly':True},'compatibility_date':'2026-09-11','usage_model':'standard'}, 'Unexpected candidate runtime'
report['merged_commit'] = MERGED
report['mutated'] = False
if not already_live:
    assert active_id == PREVIOUS_VERSION, 'Active HQ version moved; inspect before promotion'
    assert active['resources']['bindings'] == [], 'Unexpected active bindings'
    assert api('/workers/scripts/shift-hq/deployments')['deployments'][0]['versions'] == live['versions'], 'HQ changed during verification'
    api('/workers/scripts/shift-hq/deployments', {'strategy':'percentage','versions':[{'version_id':CANDIDATE,'percentage':100}],
        'annotations':{'workers/message':'Show Radar summaries; preserve current HQ runtime and protection'}}, 'POST')
    report['mutated'] = True
report['final_versions'] = api('/workers/scripts/shift-hq/deployments')['deployments'][0]['versions']
if report['mutated']:
    assert report['final_versions'] == [{'percentage':100,'version_id':CANDIDATE}], 'Unexpected deployed version'
report['production_after'] = {}
for name, expected in source_assets.items():
    for attempt in range(5):
        value = public('https://hq.shiftsometimber.co.uk/' + name + '?hq_summary_final=' + MERGED)
        actual = source_bytes(name,value)
        if actual == expected: break
        time.sleep(2)
    report['production_after'][name] = {'raw_sha256':digest(value),'normalized_sha256':digest(actual),'matches_source':actual == expected}
    assert actual == expected, 'Deployed asset mismatch: ' + name
assert api('/workers/scripts/shift-core/deployments')['deployments'][0]['versions'] == core_before, 'Core runtime changed'
after_pages = json.loads(public('https://shiftsometimber.co.uk/DEPLOYMENT-FINGERPRINT.json'))
assert after_pages['aggregate_sha256'] == pages['aggregate_sha256'], 'Public Pages changed'
report['mode'] = 'release'
report['status'] = 'PASS'
pathlib.Path('hq-release-report.json').write_text(json.dumps(report,indent=2) + '\n')
print(json.dumps(report,sort_keys=True))
print('PASS: reviewed HQ summary assets are live; all seven files match; Pages and core versions unchanged.')
