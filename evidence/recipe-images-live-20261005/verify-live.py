import asyncio, aiohttp, gzip, hashlib, json, pathlib, time

root = pathlib.Path(__file__).resolve().parent
expected = json.loads(gzip.decompress((root / 'expected-assets.json.gz').read_bytes()))
checkpoint = root / 'checks.jsonl'
done = {}
if checkpoint.exists():
    for line in checkpoint.read_text().splitlines():
        item = json.loads(line)
        if item.get('ok'): done[item['path']] = item

async def check(asset, session, semaphore):
    if asset['path'] in done: return done[asset['path']]
    item = {'path': asset['path'], 'expected_sha256': asset['sha256']}
    for attempt in range(3):
        try:
            async with semaphore:
                async with session.get('https://shiftsometimber.co.uk' + asset['path']) as response:
                    data = await response.read()
                    item.update(status=response.status, content_type=response.headers.get('content-type'), bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), authority=response.headers.get('x-shift-frontend-authority'))
            item['ok'] = item['status'] == 200 and 'image/webp' in (item['content_type'] or '') and data[:4] == b'RIFF' and data[8:12] == b'WEBP' and item['sha256'] == asset['sha256'] and len(data) == asset['bytes']
            if item['ok']: break
        except Exception as error:
            item.update(ok=False, error=str(error))
    item['checked_at_utc'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    with checkpoint.open('a') as handle: handle.write(json.dumps(item) + '\n')
    return item

async def run():
    results = []
    semaphore = asyncio.Semaphore(64)
    async with aiohttp.ClientSession(trust_env=True, connector=aiohttp.TCPConnector(limit=64), timeout=aiohttp.ClientTimeout(total=35), headers={'User-Agent': 'SHIFT-authorised-image-integrity-check/1.0', 'Cache-Control': 'no-cache'}) as session:
        jobs = [check(asset, session, semaphore) for asset in expected['assets']]
        for future in asyncio.as_completed(jobs):
            results.append(await future)
            if len(results) % 250 == 0: print(json.dumps({'checked': len(results), 'total': len(expected['assets']), 'failures': sum(not x['ok'] for x in results)}), flush=True)
    return sorted(results, key=lambda x: x['path'])

results = asyncio.run(run())

failed = [item for item in results if not item['ok']]
report = {'at_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'source': expected['source'], 'recipe_bindings': expected['bindings'], 'unique_image_assets': len(results), 'verified_live_assets': len(results) - len(failed), 'failed_assets': failed, 'bytes_verified': sum(item.get('bytes', 0) for item in results if item['ok']), 'full_catalogue_complete': False, 'remaining_recipe_bindings': 578, 'status': 'pass' if not failed else 'fail'}
(root / 'summary.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report), flush=True)
raise SystemExit(bool(failed))
