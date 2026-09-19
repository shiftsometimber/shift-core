"""Readability acceptance for the same isolated fictional-account preview.
Checks actual computed text fill, background and ancestor opacity; then proves
that the check rejects the previously observed cream-on-cream regression.
"""
import asyncio, json, pathlib, traceback
from playwright.async_api import async_playwright, expect
ORIGIN='http://127.0.0.1:8765'
OUT=pathlib.Path('passport-proof/browser'); OUT.mkdir(parents=True,exist_ok=True)
MEASURE=r'''cards=>{
 const rgba=s=>{const m=s.match(/^rgba?\(([^)]+)\)$/);if(!m)throw Error('Unsupported computed colour: '+s);const v=m[1].split(',').map(Number);return [v[0],v[1],v[2],v.length===4?v[3]:1]};
 const over=(a,b)=>[0,1,2].map(i=>a[i]*a[3]+b[i]*(1-a[3]));
 const light=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 const samples=[];
 for(const card of cards){
  for(const e of card.querySelectorAll('p,h4,summary,strong,small,button,a')){
   if(!e.textContent.trim()||!e.getClientRects().length)continue;
   const chain=[];let opacity=1,visible=true;
   for(let n=e;n;n=n.parentElement){const s=getComputedStyle(n);chain.unshift(s);opacity*=Number(s.opacity);if(s.visibility!=='visible'||s.display==='none')visible=false}
   let bg=[255,255,255];for(const s of chain)bg=over(rgba(s.backgroundColor),bg);
   const s=getComputedStyle(e),fg=over(rgba(s.getPropertyValue('-webkit-text-fill-color')||s.color),bg);
   const a=light(fg),b=light(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   samples.push({text:e.textContent.trim().slice(0,100),colour:s.color,textFill:s.getPropertyValue('-webkit-text-fill-color'),background:bg,contrast:ratio,opacity,visible,pass:visible&&opacity>=.99&&ratio>=4.5});
  }
 }
 return {cards:cards.length,samples,pass:cards.length>=3&&samples.length>=12&&samples.every(s=>s.pass)};
}'''
async def main():
 report={'scope':'isolated preview; fictional data; painted text contrast only','checks':[]}
 try:
  async with async_playwright() as p:
   browser=await p.chromium.launch(headless=True)
   for name,width in [('mobile',390),('desktop',1440)]:
    context=await browser.new_context(viewport={'width':width,'height':900})
    await context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(ORIGIN+'/') else r.abort())
    await context.request.post(ORIGIN+'/__preview/reset')
    page=await context.new_page();page.set_default_timeout(12000)
    await page.goto(ORIGIN+'/__preview/login')
    await page.get_by_label('Email').fill('fictional-1@example.invalid')
    await page.get_by_label('Preview password').fill('preview-only')
    await page.get_by_role('button',name='Sign in to the preview').click()
    await expect(page.locator('.hp-card')).to_be_visible()
    await page.locator('.hp-record details summary').click()
    cards=page.locator('.hp-record')
    actual=await cards.evaluate_all(MASURE if False else MEASURE)
    report['checks'].append({'device':name,'check':'Questionnaire, provider results and order records have readable painted text',**actual})
    await page.locator('.hp-section').filter(has=page.get_by_role('heading',name='Health MOT and results.',exact=True)).screenshot(path=str(OUT/(name+'-readable-results.png')))
    await page.locator('.hp-v1').screenshot(path=str(OUT/(name+'-readable-passport.png')))
    assert actual['pass'],json.dumps(actual)
    # Negative control: reproduce the exact wrong background locally. A presence-
    # only or falsely passing test would miss this and must fail this test suite.
    bad=await page.add_style_tag(content='.hp-v1 article.hp-record{background:#E7E3DA!important}')
    broken=await cards.evaluate_all(MEASURE)
    assert not broken['pass'],'Readability detector missed the injected regression'
    await bad.evaluate('(e)=>e.remove()')
    restored=await cards.evaluate_all(MEASURE);assert restored['pass']
    report['checks'].append({'device':name,'check':'Injected cream-on-cream failure detected; readable source restored','pass':True})
    await context.close()
   await browser.close()
 except Exception:
  report['error']=traceback.format_exc()
 finally:
  report['pass']=len(report['checks'])==4 and all(x['pass'] for x in report['checks']) and 'error' not in report
  (OUT/'contrast-proof.json').write_text(json.dumps(report,indent=2))
  print(json.dumps(report,indent=2))
 if not report['pass']:raise SystemExit(1)
if __name__=='__main__':asyncio.run(main())
