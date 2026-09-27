"""Real captured public shells, candidate article bodies and current public assets.
No account access, form submission or external analytics delivery. Chromium only.
"""
import asyncio,json,pathlib
from urllib.parse import urlparse
from playwright.async_api import async_playwright
OUT=pathlib.Path('five-article-proof'); manifest=json.loads((OUT/'document-proof.json').read_text())
ORIGIN='https://shiftsometimber.co.uk'
async def main():
 result={'mode':'current captured public HTML and styles with candidate article transform','productionWrites':False,'thirdPartyRequestsDelivered':False,'cases':[]}
 cache={}; blocked=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch()
  for width in [390,1440]:
   for item in manifest['articles']:
    ctx=await browser.new_context(viewport={'width':width,'height':900},service_workers='block');errors=[]
    async def route(r):
     u=urlparse(r.request.url)
     if u.hostname not in ['shiftsometimber.co.uk','www.shiftsometimber.co.uk']:
      blocked.append({'host':u.hostname,'type':r.request.resource_type});await r.fulfill(status=200,content_type='application/javascript',body='/* third-party delivery disabled in preview */');return
     if r.request.resource_type=='document':
      if u.path.rstrip('/')!=item['path']:await r.abort();return
      await r.fulfill(status=200,content_type='text/html',body=(OUT/(str(item['index'])+'-after.html')).read_text());return
     if r.request.method!='GET':blocked.append({'path':u.path,'method':r.request.method});await r.fulfill(status=403,content_type='application/json',body='{}');return
     if u.path.startswith('/v1/') and u.path!='/v1/radar/ticker':await r.fulfill(status=401,content_type='application/json',body='{"error":"unauthorised_preview"}');return
     if len(cache)>180:raise RuntimeError('Bounded public asset capture exceeded')
     if r.request.url not in cache:
      response=await ctx.request.get(r.request.url,timeout=25000);cache[r.request.url]=(response.status,response.headers.get('content-type','application/octet-stream'),await response.body())
     status,typ,body=cache[r.request.url];await r.fulfill(status=status,content_type=typ,body=body)
    await ctx.route('**/*',route);page=await ctx.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
    try:
     await page.goto(ORIGIN+item['path'],wait_until='networkidle',timeout=45000)
     banner=page.locator('[data-consent="necessary"]')
     if await banner.count() and await banner.first.is_visible():await banner.first.click()
     await page.locator('article.fa-guide h1').wait_for();await page.evaluate('document.fonts.ready')
     measurements=await page.evaluate('''() => {
      const article=document.querySelector('article.fa-guide');
      const rgb=s=>{const a=s.match(/[\\d.]+/g);return a?a.slice(0,3).map(Number):null};
      const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
      const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
      const bad=[];
      for(const el of article.querySelectorAll('h1,h2,h3,p,li,th,td,caption,figcaption,a')){
       if(!el.textContent.trim()||!el.getClientRects().length)continue;
       let parent=el,bg=null;
       while(parent){const s=getComputedStyle(parent);if(s.backgroundColor!=='rgba(0, 0, 0, 0)'&&s.backgroundColor!=='transparent'){bg=rgb(s.backgroundColor);break}parent=parent.parentElement}
       const style=getComputedStyle(el),fg=rgb(style.color),ratio=fg&&bg?contrast(fg,bg):0;
       const large=parseFloat(style.fontSize)>=24||(parseFloat(style.fontSize)>=18.66&&parseInt(style.fontWeight)>=700);
       if(ratio<(large?3:4.5))bad.push({tag:el.tagName,text:el.textContent.trim().slice(0,90),ratio,foreground:style.color,background:bg});
      }
      const ids=Array.from(article.querySelectorAll('[id]'),el=>el.id);
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,articleVisible:article.getBoundingClientRect().width>0,contrastFailures:bad,duplicateIds:ids.filter((x,i)=>ids.indexOf(x)!==i),tableOverflowContained:Array.from(article.querySelectorAll('table'),t=>t.closest('.fa-table')?.scrollWidth>=t.scrollWidth),textLength:article.innerText.length};
     }''')
     await page.locator('.fa-toc a[href="#sources"]').click();target_visible=await page.locator('#sources').is_visible()
     await page.evaluate('window.scrollTo(0,0)');await page.screenshot(path=str(OUT/(str(item['index'])+'-'+str(width)+'.png')),full_page=True)
     passed=measurements['h1']==1 and measurements['articleVisible'] and measurements['scrollWidth']<=width+1 and not measurements['contrastFailures'] and not measurements['duplicateIds'] and all(measurements['tableOverflowContained']) and target_visible and not errors
     result['cases'].append({'path':item['path'],'width':width,'pass':passed,'measurements':measurements,'pageErrors':errors,'sourcesAnchorUsable':target_visible,'screenshot':str(item['index'])+'-'+str(width)+'.png'})
    except Exception as e:result['cases'].append({'path':item['path'],'width':width,'pass':False,'error':str(e),'pageErrors':errors})
    finally:await ctx.close()
  for item in manifest['articles']:
   ctx=await browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
   await ctx.route('**/*',lambda route:route.abort())
   page=await ctx.new_page();await page.set_content((OUT/(str(item['index'])+'-after.html')).read_text())
   passed=await page.locator('article.fa-guide h1').count()==1 and await page.locator('#sources li').count()==item['sourceCount']
   result['cases'].append({'path':item['path'],'javascript':False,'pass':passed});await ctx.close()
  await browser.close()
 result['assetCount']=len(cache);result['blockedThirdPartyOrWriteRequests']=blocked;result['pass']=len(result['cases'])==15 and all(x['pass'] for x in result['cases'])
 (OUT/'browser-proof.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
 if not result['pass']:raise SystemExit(1)
asyncio.run(main())
