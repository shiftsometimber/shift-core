"""Actual captured signup form + production adapter/handlers; local SQLite only.
Email is recorded, not delivered; CAPTCHA service is not used in this harness.
All external browser requests are blocked, including Google/advertisers.
"""
import asyncio,json,os,pathlib
from urllib.parse import urlparse,quote
from playwright.async_api import async_playwright
OUT=pathlib.Path('acquisition-proof');OUT.mkdir(exist_ok=True)
ORIGIN='https://shiftsometimber.co.uk';LOCAL='http://127.0.0.1:8766'
async def main():
 report={'scope':__doc__,'checks':[]}
 async with async_playwright() as p:
  opts={'headless':True}
  if os.environ.get('CHROMIUM_EXECUTABLE'):opts['executable_path']=os.environ['CHROMIUM_EXECUTABLE']
  browser=await p.chromium.launch(**opts);report['browser']=browser.version
  for width in [390,1440]:
   for source,medium,choice in [('google','organic','shift'),('newsletter','email','shift'),('google','cpc','necessary')]:
    context=await browser.new_context(viewport={'width':width,'height':844},service_workers='block');external=[];errors=[]
    async def route(r):
     u=urlparse(r.request.url)
     if u.hostname!='shiftsometimber.co.uk':
      external.append(u.hostname);await r.fulfill(status=200,body='');return
     if r.request.resource_type in ['image','font','stylesheet']:await r.fulfill(status=200,body='');return
     response=await r.fetch(url=LOCAL+u.path+('?' + u.query if u.query else ''),max_redirects=0)
     await r.fulfill(response=response)
    await context.route('**/*',route);page=await context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    await context.request.get(LOCAL+'/__test/reset')
    await page.goto(ORIGIN+'/programme?utm_source='+source+'&utm_medium='+medium+'&utm_campaign=DO_NOT_RETAIN')
    assert await page.evaluate('localStorage.getItem("sstAcquisitionV1")') is None
    await page.locator('[data-consent="'+choice+'"]').click()
    capture=await page.evaluate('window.SSTAcquisition.registration()')
    if choice=='necessary':assert capture is None
    else:assert capture['source']==source and 'campaign' not in json.dumps(capture)
    await page.goto(ORIGIN+'/start-here')
    after=await page.evaluate('window.SSTAcquisition.registration()');assert after==capture
    await page.goto(ORIGIN+'/member-login?next=%2Fmember%2Fdashboard')
    await page.locator('[data-auth-mode="register"]').click()
    email='browser-'+str(width)+'-'+source+'@attribution.invalid'
    await page.locator('#previewRegister [name="firstName"]').fill('Fictional')
    await page.locator('#previewRegister [name="email"]').fill(email)
    await page.locator('#previewRegister [name="password"]').fill('Fictional-Source-Only-19!')
    async with page.expect_response(lambda r:r.url.endswith('/v1/auth/register')) as reg:
     await page.locator('#previewRegister button[type="submit"]').click()
    assert (await reg.value).status==201
    await (await reg.value).finished()
    await page.wait_for_function('localStorage.getItem("sstAcquisitionV1")===null')
    assert await page.evaluate('localStorage.getItem("sstAcquisitionV1")') is None
    await page.goto(ORIGIN+'/__test/verify?email='+quote(email))
    await page.goto(ORIGIN+'/member-login?next=%2Fmember%2Fdashboard')
    await page.locator('#previewRegister [name="email"]').fill(email)
    await page.locator('#previewRegister [name="password"]').fill('Fictional-Source-Only-19!')
    async with page.expect_response(lambda r:r.url.endswith('/v1/auth/login')) as logged:
     await page.locator('#previewRegister button[type="submit"]').click()
    assert (await logged.value).status==200
    await page.wait_for_url('**/member/dashboard')
    await page.locator('#save').click();await page.locator('#result').filter(has_text='Saved').wait_for()
    await page.reload()
    result=await (await context.request.get(LOCAL+'/__test/report')).json();bucket=result['acquisition']['sources'][0]
    assert [bucket['registered'],bucket['verified'],bucket['signedIn'],bucket['activated']]==[1,1,1,1]
    assert bucket['source']==(source if choice=='shift' else 'unattributed')
    if choice=='shift':
     await page.locator('#sstCookieSettings').click();await page.locator('[data-consent="necessary"]').click()
     await page.wait_for_timeout(200)
     forgotten=await (await context.request.get(LOCAL+'/__test/report')).json()
     assert forgotten['acquisition']['unattributedMembers']==1
    assert not errors,errors
    # No GTM requests are permitted in the SHIFT-only and necessary-only cases.
    assert 'www.googletagmanager.com' not in external,external
    report['checks'].append({'width':width,'source':source,'medium':medium,'choice':choice,'sourceAfterActivation':bucket['source'],'counts':[bucket['registered'],bucket['verified'],bucket['signedIn'],bucket['activated']],'pass':True,'errors':errors})
    await context.close()
  await browser.close()
 report['pass']=True;(OUT/'browser-source-proof.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
asyncio.run(main())
