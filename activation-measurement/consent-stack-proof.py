"""Captured current consent/config/event scripts + candidate bootstrap in Chromium.
No external request is delivered. Fixture HTML is not a full production signup.
"""
import asyncio,json,os,pathlib,subprocess
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=pathlib.Path.cwd(); OUT=ROOT/'activation-proof'; OUT.mkdir(exist_ok=True)
BASE=pathlib.Path(os.environ.get('ACTIVATION_BASELINE',str(OUT/'public-baseline')))
manifest=json.loads((BASE/'manifest.json').read_text())
sources={r['path'].split('?')[0]:(BASE/r['file']).read_text() for r in manifest if r.get('status')==200}
BOOT=subprocess.check_output(['node','--input-type=module','-e',"import {bootstrap} from './activation-measurement/assets.mjs'; process.stdout.write(bootstrap)"],text=True)
STACK=['/analytics-bootstrap-v1.js','/site-config-v3a.js','/analytics-v3a.js','/consent-v4a.js','/analytics-events-v31b.js']
async def main():
 proof={'scope':'Current captured consent/config/event scripts in fixture HTML, candidate bootstrap; all external traffic intercepted. Not production signup or GTM-container content certification.','checks':[]}
 async with async_playwright() as p:
  options={'headless':True}
  if os.environ.get('CHROMIUM_EXECUTABLE'): options['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
  browser=await p.chromium.launch(**options)
  for width in [390,1440]:
   for path,action,expected in [('/programme','none',0),('/programme','necessary',0),('/programme','grant',1),('/programme','revoke',1),('/member-login','grant',0),('/member/dashboard?passport=1#journey','grant',0),('/start-here','grant',0),('/programme?token=FICTIONAL_ONLY','grant',0),('/programme?utm_source=google&utm_medium=organic','grant',1)]:
    context=await browser.new_context(viewport={'width':width,'height':844},service_workers='block');attempts=[];errors=[]
    async def route(r):
     u=urlparse(r.request.url)
     if u.hostname!='shiftsometimber.co.uk':
      attempts.append({'host':u.hostname,'path':u.path});await r.fulfill(status=200,content_type='application/javascript',body='// blocked external delivery');return
     if u.path in STACK:
      body=BOOT if u.path==STACK[0] else sources[u.path]
      await r.fulfill(status=200,content_type='application/javascript',body=body);return
     if r.request.resource_type=='document':
      html='<!doctype html><html><head><title>Current script integration proof</title>'+''.join('<script src="'+s+'"></script>' for s in STACK)+'</head><body><h1>Fictional privacy test</h1></body></html>'
      await r.fulfill(status=200,content_type='text/html',body=html);return
     await r.fulfill(status=404,body='Not part of fixture')
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto('https://shiftsometimber.co.uk'+path)
    if action in ['grant','revoke']: await page.locator('[data-consent="analytics"]').click()
    if action=='necessary':await page.locator('[data-consent="necessary"]').click()
    if action=='revoke':
     await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="necessary"]').click()
    await page.wait_for_timeout(150)
    state=await page.evaluate('({disabled:window["ga-disable-G-Y7BV5KY6RR"],choice:window.sstConsent?.analytics,suppressed:window.SST_ANALYTICS_SUPPRESSED})')
    ok=len(attempts)==expected and not errors and (action!='revoke' or state['disabled'] is True)
    proof['checks'].append({'width':width,'path':path,'action':action,'attempts':attempts,'expected':expected,'state':state,'errors':errors,'pass':ok})
    await context.close()
  await browser.close()
 proof['pass']=all(c['pass'] for c in proof['checks']);(OUT/'consent-stack-proof.json').write_text(json.dumps(proof,indent=2));print(json.dumps(proof,indent=2))
 if not proof['pass']:raise SystemExit(1)
asyncio.run(main())
