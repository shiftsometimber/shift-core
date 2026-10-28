#!/usr/bin/env python3
"""Publish the approved testing range around the exact retained live module.

Run only within SST's managed check, with the immutable source commit argument.
No credentials, checkout, repository clone or Mac working files are created.
"""
import concurrent.futures
import datetime
import email
from email import policy
import hashlib
import json
import re
import runpy
import sys
import urllib.error
import urllib.request
import uuid

ACCOUNT = '9e5386dcf455be34c582d93f8bfc79e6'
ZONE = '66ec3268950adcfc837b7b8b2f8356ed'
SERVICE = 'shift-health-nutrition-20261027'
BASE = 'accounts/' + ACCOUNT + '/workers/scripts/' + SERVICE
ORIGIN = 'https://shiftsometimber.co.uk'
COMMIT = sys.argv[1]
assert re.fullmatch(r'[a-f0-9]{40}', COMMIT)
CONTROL = runpy.run_path('scripts/cloudflare-route-capacity.py')
TOKEN = CONTROL['token']()


def emit(stage, **values):
    print(json.dumps({'stage': stage, **values}), flush=True)


def cf(method, path, payload=None, content_type='application/json', raw=False):
    if payload is not None and not isinstance(payload, bytes):
        payload = json.dumps(payload).encode()
    request = urllib.request.Request('https://api.cloudflare.com/client/v4/' + path,
                                    data=payload, method=method,
                                    headers={'Authorization': 'Bearer ' + TOKEN,
                                             'Content-Type': content_type})
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            body, kind = response.read(), response.headers.get('Content-Type', '')
    except urllib.error.HTTPError as error:
        emit('provider_error', status=error.code, detail=error.read().decode()[:3000])
        raise
    if raw:
        return body, kind
    result = json.loads(body)
    assert result.get('success'), result.get('errors')
    return result['result']


def public(path, method='GET'):
    url = path if path.startswith('https://') else ORIGIN + path
    request = urllib.request.Request(url, method=method, headers={'User-Agent': 'SHIFT-Testing-Release-Check/1.0', 'Cache-Control': 'no-cache'})
    try:
        response = urllib.request.urlopen(request, timeout=40)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return {'status': response.status, 'headers': dict(response.headers),
                'body': response.read(), 'url': response.geturl()}


def source(path):
    with urllib.request.urlopen('https://raw.githubusercontent.com/shiftsometimber/shift-core/' + COMMIT + '/' + path, timeout=40) as response:
        return response.read()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def main_body(response, remove_testing=False):
    match = re.search(br'<main\b[\s\S]*?</main>', response['body'], re.I)
    value = match[0] if match else response['body']
    if remove_testing:
        value = re.sub(br'<section class="nft-hub"[\s\S]*?</section>', b'', value)
    return digest(value)


manifest = json.loads(source('health-testing/publication-manifest.json'))
assert manifest['service'] == SERVICE
assert manifest['stockQuantity'] == 0 and manifest['pricePence'] is None
assert manifest['purchasingEnabled'] is False
before_deployment = cf('GET', BASE + '/deployments')['deployments'][0]
assert before_deployment['versions'] == [{'version_id': manifest['retainedVersion'], 'percentage': 100}]
settings = cf('GET', BASE + '/settings')
body, content_type = cf('GET', BASE, raw=True)
message = email.message_from_bytes(('Content-Type: ' + content_type + '\r\nMIME-Version: 1.0\r\n\r\n').encode() + body, policy=policy.default)
parts = list(message.iter_parts())
assert len(parts) == 1
retained = parts[0].get_payload(decode=True)
assert digest(retained) == manifest['retainedModuleSha256'], 'Live source changed; preserve its newer version first'
assert b'purchaseBasketAsset(request)' in retained and b'liveRecommendationRoute(request, env)' in retained
routes_before = cf('GET', 'zones/' + ZONE + '/workers/routes')
planned = [{'pattern': p, 'script': SERVICE} for p in manifest['routesToAdd']]
route_capacity = CONTROL['capacity'](routes_before, planned)
assert any(r['pattern'] == 'shiftsometimber.co.uk/shift-health*' and r['script'] == SERVICE for r in routes_before)
assert any(r['pattern'] == 'www.shiftsometimber.co.uk/shift-health*' and r['script'] == SERVICE for r in routes_before)
emit('preflight', sourceCommit=COMMIT, retainedVersion=manifest['retainedVersion'], retainedSha256=digest(retained), routeCapacity=route_capacity)

preserve_paths = ['/', '/shift-health', '/shift-health/supplements-nutrition', '/shift-health/blood-tests', '/my-timber']
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    before = dict(zip(preserve_paths, pool.map(public, preserve_paths)))
assert before['/shift-health']['status'] == 200
assert before['/shift-health']['body'].count(b'<section class="sst-linkline">') == 1
emit('baseline', pages=[{'path': p, 'status': r['status'], 'mainSha256': main_body(r)} for p, r in before.items()])

def get_module(spec):
    value = source(spec['path'])
    assert len(value) == spec['size'] and digest(value) == spec['sha256'], spec['path']
    return spec['path'], value

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    modules = dict(pool.map(get_module, manifest['modules']))
modules['retained-health-nutrition.mjs'] = retained
modules['testing-production-entry.mjs'] = b'import retained from "./retained-health-nutrition.mjs";\nimport {composeTesting} from "./health-testing/production.mjs";\nexport default composeTesting(retained);\n'
metadata = {'main_module': 'testing-production-entry.mjs',
            'bindings': settings['bindings'],
            'compatibility_date': settings['compatibility_date'],
            'compatibility_flags': settings.get('compatibility_flags', []),
            'annotations': {'workers/message': 'Matt-approved testing storefront; retain exact live Health/Nutrition. Stock 0, price TBC.',
                            'workers/tag': 'testing-20261028'}}
for key in ['usage_model', 'tags', 'tail_consumers', 'logpush', 'observability', 'limits']:
    if key in settings:
        metadata[key] = settings[key]
if settings.get('placement', {}).get('mode'):
    metadata['placement'] = settings['placement']
boundary = 'shift-testing-' + uuid.uuid4().hex
upload = []
for name, value, kind in [('metadata', json.dumps(metadata).encode(), 'application/json')] + [(name, value, 'application/javascript+module') for name, value in modules.items()]:
    upload.extend([('--' + boundary + '\r\nContent-Disposition: form-data; name="' + name + '"' + ('; filename="' + name + '"' if name != 'metadata' else '') + '\r\nContent-Type: ' + kind + '\r\n\r\n').encode(), value, b'\r\n'])
upload.append(('--' + boundary + '--\r\n').encode())
candidate = cf('POST', BASE + '/versions', b''.join(upload), 'multipart/form-data; boundary=' + boundary)
candidate_id = candidate['id']
emit('version_uploaded', versionId=candidate_id, modules=len(modules), bytes=sum(map(len, modules.values())))

# A concurrent owner publication invalidates this release's retained base.
assert cf('GET', BASE + '/deployments')['deployments'][0]['id'] == before_deployment['id']
assert cf('GET', BASE + '/settings')['bindings'] == settings['bindings']
deployment = cf('POST', BASE + '/deployments', {'strategy': 'percentage', 'versions': [{'version_id': candidate_id, 'percentage': 100}], 'annotations': {'workers/message': 'Publish reviewed SHIFT testing range; keep all purchases disabled'}})
emit('deployed', deploymentId=deployment['id'], versionId=candidate_id, sourceCommit=COMMIT)

try:
    existing = {r['pattern']: r for r in routes_before}
    created_routes = []
    for route in planned:
        if route['pattern'] not in existing:
            created_routes.append(cf('POST', 'zones/' + ZONE + '/workers/routes', route))
    live = public('/shift-health/testing')
    assert live['status'] == 200 and b'20 of 20 products' in live['body']
    assert b'Prices TBC' in live['body']
    ids = re.findall(br'data-test="([a-z0-9-]+)"', live['body'])
    assert len(ids) == 20 and len(set(ids)) == 20
    paths = ['/shift-health/testing/' + item.decode() for item in ids]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        detail_responses = list(pool.map(public, paths))
    page_proofs = []
    for path, response in zip(paths, detail_responses):
        text = response['body']
        assert response['status'] == 200, path
        assert b'class="nft-price">TBC' in text and b'0 in stock' in text, path
        assert b'type="submit" disabled' in text and b'data-testing-purchase' in text, path
        assert b'newfoundland' not in text.lower(), path
        assert b'health-testing-range-20261028' in json.dumps(response['headers']).encode(), path
        page_proofs.append({'path': path, 'status': 200, 'stockQuantity': 0, 'price': 'TBC', 'purchaseDisabled': True})
    image_paths = sorted(set(re.findall(br'src="(/shift-health/assets/testing-[^"]+\.webp)"', live['body'] + b''.join(r['body'] for r in detail_responses))))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        image_responses = list(pool.map(lambda path: public(path.decode()), image_paths))
    for path, response in zip(image_paths, image_responses):
        assert response['status'] == 200 and response['body'].startswith(b'RIFF'), path
    search = public('/shift-health/testing?q=HbA1c')
    assert b'1 of 20 products' in search['body']
    blocked = public('/shift-health/testing/iron/purchase', 'POST')
    assert blocked['status'] == 409 and json.loads(blocked['body'])['error'] == 'out_of_stock'
    hq_api = public('https://api.shiftsometimber.co.uk/v1/hq/testing')
    assert hq_api['status'] == 401, hq_api['status']
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        after = dict(zip(preserve_paths, pool.map(public, preserve_paths)))
    preservation = []
    for path in preserve_paths:
        same = before[path]['status'] == after[path]['status'] and main_body(before[path]) == main_body(after[path], path == '/shift-health')
        preservation.append({'path': path, 'unchangedMain': same, 'status': after[path]['status']})
        assert same, 'Preservation failed: ' + path
    assert after['/shift-health']['body'].count(b'class="nft-hub"') == 1
    new_settings = cf('GET', BASE + '/settings')
    assert new_settings['bindings'] == settings['bindings']
    routes_after = cf('GET', 'zones/' + ZONE + '/workers/routes')
    assert all(any(now == old for now in routes_after) for old in routes_before)
    db = cf('POST', 'accounts/' + ACCOUNT + '/d1/database/88f40aed-cb23-4372-8c94-8a73f48bc847/query', {'sql': "SELECT id,status,sale_enabled FROM testing_products UNION ALL SELECT id,status,sale_enabled FROM testing_range_extras"})
    rows = db[0]['results']
    assert len(rows) == 20 and all(r['status'] == 'draft' and r['sale_enabled'] == 0 for r in rows)
    emit('verified', deploymentId=deployment['id'], versionId=candidate_id, sourceCommit=COMMIT,
         url=live['url'], products=page_proofs, imageCount=len(image_paths), searchVerified=True,
         closedPurchaseStatus=blocked['status'], unauthenticatedHQStatus=hq_api['status'],
         preserved=preservation, bindingsUnchanged=True, oldRoutesUnchanged=True,
         createdRoutes=created_routes, routeCount=len(routes_after), draftDatabaseRows=len(rows),
         purchasingEnabled=False, checkedAt=datetime.datetime.now(datetime.timezone.utc).isoformat())
except Exception:
    # Restore the exact retained version only if this release still owns traffic.
    current = cf('GET', BASE + '/deployments')['deployments'][0]
    if current['id'] == deployment['id']:
        rollback = cf('POST', BASE + '/deployments', {'strategy': 'percentage', 'versions': before_deployment['versions'], 'annotations': {'workers/message': 'Restore exact prior Health runtime after testing release verification failed'}})
        emit('rolled_back', deploymentId=rollback['id'])
    raise
