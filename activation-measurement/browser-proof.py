"""Real Chromium network-boundary harness; no production writes or Google delivery.
The simple harness is NOT a full-site design or ordinary live-signup walkthrough.
"""
import asyncio,json,os,pathlib,subprocess
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=pathlib.Path.cwd();OUT=ROOT/'activation-proof';OUT.mkdir(exist_ok=True)
BOOT=subprocess.check_output(['node','--input-type=module','-e',"import {bootstrap} from './activation-measurement/assets.mjs'; process.stdout.write(bootstrap)"],text=True)
async def main():
 report={'scope':'Isolated Chromium privacy/network boundary; all external requests intercepted. No production writes, actual email transport or human CAPTCHA claimed.','checks':[]}
 async with async_playwright() as p:
  options={'headless':True}
  if os.environ.get('CHROMIUM_EXECUTABLE'):options['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
  browser=await p.chromium.launch(**options)
  report['browser']=browser.version
  for width in [390,1440]:
   for path,stored,action,expected in [('/programme',None,'none',0),('/programme',False,'none',0),('/programme',True,'none',1),('/programme',None,'grant',1),('/programme',None,'repeat',1),('/programme',True,'revoke',1),('/member-login',True,'grant',0),('/member/dashboard?passport=1#journey',True,'grant',0),('/reset-password.html?token=FICTIONAL_TOKEN',True,'grant',0),('/treatment-order',True,'grant',0),('/shift-health/testosterone-energy',True,'grant',0),('/programme?utm_source=google&utm_medium=organic',True,'none',1),('/programme?email=FICTIONAL_EMAIL',True,'grant',0)]:
    context=await browser.new_context(viewport={'width':width,'height':844},service_workers='block')
    if stored is not None:await context.add_init_script('localStorage.setItem("sstConsentV3",'+json.dumps(json.dumps({'analytics':stored}))+');')
    requested=[];errors=[]
    async def route(r):
     u=urlparse(r.request.url)
     if u.hostname=='www.googletagmanager.com':requested.append(r.request.url);await r.fulfill(status=200,content_type='application/javascript',body='// Intercepted; no tracking data transmitted.');return
     if u.path=='/analytics-bootstrap-v1.js':await r.fulfill(status=200,content_type='application/javascript',body=BOOT);return
     if u.hostname=='shiftsometimber.co.uk':await r.fulfill(status=200,content_type='text/html',body='<!doctype html><html><head><title>Isolated analytics boundary</title><script src="/analytics-bootstrap-v1.js"></script></head><body><h1>Test harness, not the live website</h1></body></html>');return
     requested.append(r.request.url);await r.abort()
    await context.route('**/*',route)
    page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await page.goto('https://shiftsometimber.co.uk'+path)
    if action in ['grant','repeat']:await page.evaluate('window.shiftUpdateGoogleConsent(true)')
    if action=='repeat':await page.evaluate('window.shiftUpdateGoogleConsent(true);window.dispatchEvent(new CustomEvent("sst:analytics-consent",{detail:{analytics:true}}))')
    if action=='revoke':await page.evaluate('window.shiftUpdateGoogleConsent(false)')
    await page.wait_for_timeout(100)
    disabled=await page.evaluate('window["ga-disable-G-Y7BV5KY6RR"]')
    passed=len(requested)==expected and not errors and (action!='revoke' or disabled is True)
    report['checks'].append({'width':width,'path':path,'consent':stored,'action':action,'externalRequests':len(requested),'expected':expected,'gaDisabled':disabled,'errors':errors,'pass':passed})
    await context.close()
  await browser.close()
 report['pass']=all(x['pass'] for x in report['checks'])
 (OUT/'browser-boundary.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
 if not report['pass']:raise SystemExit(1)
asyncio.run(main())
