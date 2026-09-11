"""Promote the already verified response-only version, preserving all existing state."""
import email, email.policy, hashlib, json, os, pathlib, time, urllib.error, urllib.request

BASE = 'https://api.cloudflare.com/client/v4/accounts/9e5386dcf455be34c582d93f8bfc79e6'
OLD = '8d1478f7-075d-4527-a675-cab5a6baa8d1'
CANDIDATE = '85303a32-b64a-422f-bc27-136795f5b98a'
CODE = 'f54480cf1da07b23bd6a28e7875dd4ce7c4fde8fee3ffeb993f4e7405f810550'
PAGES = '5d7007a2eb1b7b8adf84609ceb6e0134b316240271c6511054d0aa1a7af56887'
HQ = '4a3b0efa-b508-4465-a3a4-cc41b7461ecb'
EVIDENCE = pathlib.Path('release-evidence')
EVIDENCE.mkdir(exist_ok=True)

def sha(value):
    return hashlib.sha256(value if isinstance(value, bytes) else json.dumps(value, sort_keys=True).encode()).hexdigest()

def request(url, body=None, auth=False):
    headers = {'Cache-Control':'no-cache', 'User-Agent':'SHIFT-response-release-verification'}
    if auth: headers['Authorization'] = 'Bearer ' + os.environ['CLOUDFLARE_API_TOKEN']
    if body is not None: headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, headers=headers, data=None if body is None else json.dumps(body).encode())
    try:
        with urllib.request.urlopen(req, timeout=35) as response:
            return response.read(), dict(response.headers)
    except urllib.error.HTTPError as error:
        raise SystemExit('HTTP ' + str(error.code) + '; endpoint=' + url.split('?')[0]) from None

def api(path, body=None):
    data, _ = request(BASE + path, body, True)
    result = json.loads(data)
    assert result.get('success'), 'Cloudflare request failed'
    return result['result']

def public(path):
    data, headers = request('https://shiftsometimber.co.uk' + path + '?response_release=' + str(time.time_ns()))
    return json.loads(data), headers

def versions(service):
    return api('/workers/scripts/' + service + '/deployments')['deployments'][0]['versions']

def sql(text, params=None):
    result = api('/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query', {'sql':text, 'params':params or []})
    assert all(x.get('success') for x in result), 'Read-only database query failed'
    return result[0]['results']

def save(name, value):
    (EVIDENCE / name).write_text(json.dumps(value, indent=2) + '\n')

def unique(items):
    seen = set()
    out = []
    for item in items:
        slug = str(item.get('metadata', {}).get('slug') or '').strip().strip('/')
        if slug and slug in seen: continue
        if slug: seen.add(slug)
        out.append(item)
    return out

active = versions('shift-core')
assert active in ([{'percentage':100,'version_id':OLD}], [{'percentage':100,'version_id':CANDIDATE}]), 'Core production moved'
old = api('/workers/scripts/shift-core/versions/' + OLD)
candidate = api('/workers/scripts/shift-core/versions/' + CANDIDATE)
assert api('/workers/scripts/shift-core/versions')['items'][0]['id'] == CANDIDATE, 'Latest upload moved'
assert sorted(old['resources']['bindings'], key=lambda b:b['name']) == sorted(candidate['resources']['bindings'], key=lambda b:b['name']), 'Bindings changed'
assert old['resources']['script_runtime'] == candidate['resources']['script_runtime'], 'Runtime changed'
assert any(b.get('name') == 'HQ_MFA_ENCRYPTION_KEY' for b in candidate['resources']['bindings']), 'MFA binding missing'
data, headers = request(BASE + '/workers/scripts/shift-core/content/v2', auth=True)
ctype = next(v for k,v in headers.items() if k.lower() == 'content-type')
message = email.message_from_bytes(('Content-Type: ' + ctype + '\r\nMIME-Version: 1.0\r\n\r\n').encode() + data, policy=email.policy.default)
parts = {p.get_filename() or p.get_param('name',header='content-disposition'):p.get_payload(decode=True) for p in message.iter_parts()}
assert list(parts) == ['worker-entry-v6.js'] and sha(parts['worker-entry-v6.js']) == CODE, 'Uploaded code differs from reviewed bundle'
assert parts['worker-entry-v6.js'] == pathlib.Path('../candidate-build/worker-entry-v6.js').read_bytes(), 'Build differs from uploaded code'
assert versions('shift-hq') == [{'percentage':100,'version_id':HQ}], 'HQ production moved'
pages_before, _ = public('/DEPLOYMENT-FINGERPRINT.json')
assert pages_before['aggregate_sha256'] == PAGES, 'Pages production moved'
seed = sql('SELECT id,status FROM radar_events WHERE event_key=?', ['owner-approved:mhra-wegovy-tablet-2026-06-11'])
assert len(seed) == 1 and seed[0]['status'] == 'published', 'Existing GET seed would write; do not request feeds'
records_sql = "SELECT id,status,content_package_json,reviewed_at,updated_at FROM radar_events WHERE status='published' ORDER BY id"
records_before = sql(records_sql)
news_before, _ = public('/v1/radar/news')
ticker_before, _ = public('/v1/radar/ticker')
assert news_before.get('ok') and ticker_before.get('ok'), 'Feeds unavailable'
expected = unique(news_before['items'])
assert expected and ticker_before['items'], 'Feeds empty'
save('news-before.json', news_before)
save('ticker-before.json', ticker_before)
report = {'source_commit':'0a667f2953e943665d2d9313d80ff0d4801e14fd', 'old_version':OLD, 'candidate':CANDIDATE,
          'bundle_sha256':CODE, 'bindings_preserved':True, 'runtime_preserved':True, 'assets_retained_at_upload':True,
          'mfa_binding_preserved':True, 'pages_fingerprint':PAGES, 'hq_version':HQ,
          'seed_already_published':True, 'news_before_count':len(news_before['items']), 'expected_unique_count':len(expected),
          'removed_response_ids':[x['id'] for x in news_before['items'] if x not in expected], 'deployed':False}
save('release-report.json', report)
assert versions('shift-core') == active, 'Core changed during inspection'
if active[0]['version_id'] == OLD:
    api('/workers/scripts/shift-core/deployments', {'strategy':'percentage', 'versions':[{'version_id':CANDIDATE,'percentage':100}],
        'annotations':{'workers/message':'REC-026: response-only Newsroom deduplication; source 0a667f2953e943665d2d9313d80ff0d4801e14fd'}})
    report['deployed'] = True
    save('release-report.json', report)
assert versions('shift-core') == [{'percentage':100,'version_id':CANDIDATE}], 'Unexpected active version'
for attempt in range(8):
    news_after, news_headers = public('/v1/radar/news')
    if news_after.get('items') == expected: break
    time.sleep(3)
ticker_after, ticker_headers = public('/v1/radar/ticker')
save('news-after.json', news_after)
save('ticker-after.json', ticker_after)
assert news_after.get('items') == expected, 'Public news response differs from approved deduplicated input'
assert ticker_after.get('items') == ticker_before['items'], 'Approved ticker content changed'
records_after = sql(records_sql)
pages_after, _ = public('/DEPLOYMENT-FINGERPRINT.json')
assert pages_after == pages_before, 'Pages fingerprint changed'
assert versions('shift-hq') == [{'percentage':100,'version_id':HQ}], 'HQ production changed'
assert records_before == records_after, 'Published editorial records changed during verification; inspect'
report.update({'status':'PASS', 'active_version':CANDIDATE, 'news_after_count':len(news_after['items']),
    'response_matches_expected_exactly':True, 'ticker_ids':[x['id'] for x in ticker_after['items']],
    'ticker_content_unchanged':True, 'ticker_current':ticker_after.get('current'), 'ticker_status':ticker_after.get('status'),
    'published_records_sha256':sha(records_after), 'published_records_unchanged':True,
    'pages_unchanged':True, 'hq_unchanged':True, 'database_write_commands':0, 'live_authentication_submissions':0})
save('release-report.json', report)
print(json.dumps(report, sort_keys=True))
print('PASS: exact prepared version is live; feed deduplicated; ticker, published records, Pages, HQ and MFA binding preserved.')
