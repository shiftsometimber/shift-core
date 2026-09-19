"""Focused browser integration against real new route handlers and isolated SQLite.
The preview sign-in is fictional, not production authentication acceptance.
"""
import asyncio, json, os, pathlib, time, traceback
from playwright.async_api import async_playwright, expect
ORIGIN = 'http://127.0.0.1:' + os.environ.get('PORT', '8765')
OUT = pathlib.Path('passport-proof/browser'); OUT.mkdir(parents=True, exist_ok=True)
report={'scope':'isolated focused integration; fictional login; real cookie authentication, Passport/Journey route handlers and SQLite; not production end-to-end acceptance','checks':[], 'browsers':[]}
KEY='sst_start_here_handoff_v1'
async def login(page, member=1):
    await page.goto(ORIGIN+'/__preview/login')
    await page.get_by_label('Email').fill(f'fictional-{member}@example.invalid')
    await page.get_by_label('Preview password').fill('preview-only')
    await page.get_by_role('button',name='Sign in to the preview').click()
    await page.wait_for_url('**/member/dashboard?passport=1#journey')
    await expect(page.locator('[data-health-passport] details.hp-card')).to_be_visible()
async def answer_quiz(page, keep=True, medicine='No medication'):
    await page.goto(ORIGIN+'/start-here')
    await page.locator('[data-multi="why"] button').filter(has_text='Lose weight').click()
    await page.locator('[data-multi="why"] button').filter(has_text='Feel more energy').click()
    await page.locator('[data-quick-next]').click()
    await page.locator('[data-one="med"] button').filter(has_text=medicine).click()
    await page.locator('[data-one="access"] button').filter(has_text='NHS').click()
    await page.locator('[data-quick-next]').click()
    await expect(page.locator('[data-hp-remember]')).not_to_be_checked()
    await page.locator('[data-one="budget"] button').filter(has_text='£0 / NHS').click()
    if keep: await page.locator('[data-hp-remember]').check()
    await page.locator('[data-quick-next]').click()
    if medicine=='No medication': await expect(page.locator('#quickResult')).to_be_visible()
    else: await page.wait_for_url('**/treatment-order?**')
async def get_passport(page):
    return await page.evaluate("async()=>{const r=await fetch('/v1/health-passport');return {status:r.status,body:await r.json()}}")
async def run_device(browser, name, width):
    context=await browser.new_context(viewport={'width':width,'height':900},record_video_dir=str(OUT/name),record_video_size={'width':min(width,1440),'height':900})
    page=await context.new_page(); page.set_default_timeout(12000)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    await context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(ORIGIN+'/') else route.abort())
    async def checked(label, action):
        try:
            await action();report['checks'].append({'device':name,'check':label,'pass':True})
        except Exception as e:
            report['checks'].append({'device':name,'check':label,'pass':False,'error':str(e)})
            await page.screenshot(path=str(OUT/f'{name}-failure.png'),full_page=True)
            raise
    try:
        await context.request.post(ORIGIN+'/__preview/reset')
        async def optout():
            await answer_quiz(page,False)
            assert await page.evaluate(f'sessionStorage.getItem({json.dumps(KEY)})') is None
        await checked('Start Here defaults to no preference retention; no-medication result still works',optout)
        async def medication():
            await answer_quiz(page,False,'Jabs')
            assert 'medicine=mounjaro' in page.url
            match=await page.evaluate("JSON.parse(sessionStorage.getItem('sstMedicineMatch'))")
            assert match=={'recommended':'mounjaro','alternative':'wegovy-injection'}
        await checked('Original medication destination retained; legacy cache contains no raw answers',medication)
        async def handoff():
            await answer_quiz(page,True)
            kept=json.loads(await page.evaluate(f'sessionStorage.getItem({json.dumps(KEY)})'))
            assert kept['accountId'] is None and kept['draft']['answers']['med']==['No medication']
            assert (await get_passport(page))['status']==401
            await login(page)
            await expect(page.locator('[data-hp-save-start]')).to_be_disabled()
            await expect(page.locator('.hp-handoff')).to_contain_text('fictional-1@example.invalid')
            assert (await get_passport(page))['body']['passport']['records']==[]
            await page.locator('.hp-handoff').screenshot(path=str(OUT/f'{name}-review.png'))
            await page.locator('[data-hp-confirm]').check()
            await page.locator('[data-hp-save-start]').click()
            await expect(page.locator('dialog')).to_be_visible()
            await expect(page.locator('#healthConsentContinue')).to_be_disabled()
            await page.locator('#healthConsentCheck').check()
            await page.locator('#healthConsentContinue').click()
            await expect(page.locator('[data-hp-status]')).to_contain_text('now saved')
            assert await page.evaluate(f'sessionStorage.getItem({json.dumps(KEY)})') is None
            await page.reload()
            await expect(page.locator('.hp-v1')).to_contain_text('Start Here · member-selected preferences')
            data=(await get_passport(page))['body']['passport']
            assert data['records'][0]['payload']['answers']==kept['draft']['answers']
            assert len(data['records'])==1
        await checked('Explicit review plus existing consent dialog; real save, reload and exact read-back',handoff)
        async def priorities():
            await expect(page.locator('[data-shift-health-saved]')).to_contain_text('Health MOT')
            await expect(page.locator('.hp-v1')).to_contain_text('Fictional preview lab')
            await expect(page.locator('.hp-v1')).to_contain_text('unreviewed')
            await expect(page.locator('.hp-v1')).to_contain_text('100 kg')
            await expect(page.locator('.hp-v1')).to_contain_text('PREVIEW-ONLY-0001')
            assert (await get_passport(page))['body']['passport']['clinicalMonitoring'] is False
            await page.locator('.hp-v1').scroll_into_view_if_needed()
            await page.screenshot(path=str(OUT/f'{name}-passport-top.png'))
            await page.locator('.hp-v1').screenshot(path=str(OUT/f'{name}-passport-full.png'))
        await checked('Existing consented priorities, baseline, questionnaire and provider provenance are visible',priorities)
        async def treatment_history():
            await page.locator('[data-hp-add]').click()
            await page.locator('.hp-form [name="medicine"]').fill('Preview personal medicine')
            await page.locator('.hp-form [name="dose"]').fill('Copied from personal record')
            await page.locator('.hp-form [name="provider"]').fill('Fictional prescriber A')
            await page.locator('.hp-form [name="startedOn"]').fill('2026-08-01')
            await page.locator('.hp-form [type="submit"]').click()
            await expect(page.locator('[data-hp-status]')).to_contain_text('history was saved')
            await page.reload(); await expect(page.locator('.hp-v1')).to_contain_text('Fictional prescriber A')
            await page.locator('[data-hp-edit]').click()
            await page.locator('.hp-form [name="provider"]').fill('Fictional prescriber B')
            await page.locator('.hp-form [type="submit"]').click()
            await expect(page.locator('[data-hp-status]')).to_contain_text('history was saved')
            data=(await get_passport(page))['body']['passport']
            r=next(r for r in data['records'] if r['record_type']=='treatment')
            assert r['revision']==2 and r['payload']['provider']=='Fictional prescriber B'
            assert data['orders'][0]['status']=='cancelled'
        await checked('Personal treatment/provider history saves and edits without changing orders',treatment_history)
        async def unavailable():
            async def fail(route):await route.fulfill(status=503,content_type='application/json',body=json.dumps({'error':'test_unavailable','message':'Temporary preview outage. Your records are unchanged.'}))
            await page.route('**/v1/health-passport',fail)
            await page.locator('[data-hp-reload]').click()
            await expect(page.locator('[data-hp-retry]')).to_be_visible()
            await expect(page.locator('.hp-v1')).to_contain_text('unavailable')
            await page.unroute('**/v1/health-passport',fail)
            await page.locator('[data-hp-retry]').click()
            await expect(page.locator('.hp-v1')).to_contain_text('Fictional prescriber B')
        await checked('API outage is an explicit error; retry restores real stored history',unavailable)
        async def switched_account():
            r=(await get_passport(page))['body']['passport']['records'][0]
            # Change the real session without rerendering the stale editor.
            await context.request.post(ORIGIN+'/__preview/login',form={'email':'fictional-2@example.invalid','password':'preview-only'})
            response=await page.evaluate("async r=>{const x=await fetch('/v1/health-passport/records/'+r.id,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedAccountId:1,revision:r.revision})});return {status:x.status,body:await x.json()}}",r)
            assert response['status']==409 and response['body']['error']=='account_changed'
            await page.reload(); await expect(page.locator('.hp-v1')).to_contain_text('No Start Here answers saved yet')
            data=(await get_passport(page))['body']['passport']
            assert data['records']==[] and data['results']==[] and data['orders']==[]
            assert data['baseline']['startWeightKg'] is None
            await expect(page.locator('.hp-v1')).not_to_contain_text('Fictional prescriber B')
            await page.locator('.hp-v1').screenshot(path=str(OUT/f'{name}-fresh-account.png'))
        await checked('Account switch blocks stale write; fresh account contains no borrowed records or sample data',switched_account)
        async def export_withdraw_erase():
            await login(page,1)
            data=await page.evaluate("async()=>{const r=await fetch('/v1/privacy/export',{method:'POST'});return r.json()}")
            assert len(data['healthPassport']['records'])==2
            assert len(data['healthPassport']['providerResults'])==1
            assert len(data['healthPassport']['medicineOrders'])==1
            await page.evaluate("SST_HEALTH_CONSENT.set(false)")
            await page.locator('[data-hp-add]').click()
            await page.locator('.hp-form [name="medicine"]').fill('Must not be saved')
            await page.locator('.hp-form [type="submit"]').click()
            await expect(page.locator('dialog')).to_be_visible()
            await page.locator('dialog button[value="cancel"]').click()
            await expect(page.locator('[data-hp-form-status]')).to_contain_text('Nothing was saved')
            assert len((await get_passport(page))['body']['passport']['records'])==2
            response=await page.evaluate("async()=>{const r=await fetch('/v1/privacy/health-tracking',{method:'DELETE'});return {status:r.status,body:await r.json()}}")
            assert response['status']==200, response
            data=(await get_passport(page))['body']['passport']
            assert data['records']==[] and data['trackingConsent'] is False
            assert len(data['orders'])==1 and len(data['results'])==1
        await checked('Complete owner export, consent cancellation and optional erasure; clinical/order sources retained',export_withdraw_erase)
        async def expired():
            await page.evaluate("key=>sessionStorage.setItem(key,JSON.stringify({accountId:1,draft:{version:1,id:crypto.randomUUID(),createdAt:new Date(Date.now()-3600000).toISOString(),expiresAt:new Date(Date.now()-1800000).toISOString(),answers:{why:['Lose weight'],med:['No medication'],access:['NHS'],budget:['£0 / NHS']}}}))",KEY)
            await page.reload(); await expect(page.locator('.hp-v1')).to_be_visible()
            assert await page.evaluate(f'sessionStorage.getItem({json.dumps(KEY)})') is None
        await checked('Expired handoff is discarded rather than saved',expired)
        async def geometry():
            await page.locator('.hp-v1').scroll_into_view_if_needed()
            dims=await page.locator('.hp-v1').evaluate('(e)=>({left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,width:innerWidth})')
            assert dims['left']>=-1 and dims['right']<=dims['width']+1,dims
            assert not errors, errors
        await checked('Passport fits viewport; no uncaught page errors',geometry)
    finally:
        await context.close()
async def main():
    try:
        async with async_playwright() as pw:
            browser=await pw.chromium.launch(headless=True)
            report['browsers'].append({'engine':'chromium','version':browser.version})
            for name,width in [('mobile',390),('desktop',1440)]:await run_device(browser,name,width)
            await browser.close()
    except Exception:
        report['error']=traceback.format_exc()
    finally:
        report['pass']=bool(report['checks']) and all(c['pass'] for c in report['checks']) and 'error' not in report
        (OUT/'browser-proof.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report,indent=2))
    if not report['pass']:raise SystemExit(1)
if __name__=='__main__':asyncio.run(main())
