import test from 'node:test';
import assert from 'node:assert/strict';
import {recipeProjection,exerciseProjection,safeImage,finite} from './projection.mjs';
import {recipeSchema,enhancePublicHtml,isPrivatePath} from './schema.mjs';
import {indexPage,detail,recipeSearchMetadata} from './content.mjs';
import {withAeoGeo,ROBOTS,completeSitemap} from './delivery.mjs';
import {safeAiReferrer,safeSearchReferrer,repairAnalytics} from './analytics.mjs';
import {activeDeployment,replaceActiveTraffic} from './deployment.mjs';
import {repairCoverChrome,repairPublicChrome,FRAME_SIGNATURE} from './chrome.mjs';
import {verifyPackage,ENTRY,capturedOriginal} from './package.mjs';
import {repairLlms} from './delivery.mjs';
import vm from 'node:vm';
const base='https://shiftsometimber.co.uk',shell={header:'<header>Shared header</header>',footer:'<footer>Shared footer</footer>'};
const date='2026-11-02T08:00:00Z';
const recipe={id:'r',title:'Egg & tomato',path:'/recipes/egg-tomato',description:'Ingredients and method.',ingredients:['100g egg','100g tomato'],method:['Cook the egg.','Serve with tomato.'],servings:1,minutes:10,prepMinutes:5,cookMinutes:5,nutrition:{kcal:150,protein_g:12,carbohydrate_g:3,fat_g:9,fibre_g:null,saturates_g:0},methodology:'Estimated nutrition.',allergens:['egg'],safety:[],storage:[],equipment:[],image:null};
const data={publishedAt:date,recipes:[recipe],exercises:[]};
test('projection retains unknown nutrients rather than coercing them to zero',()=>{
 const r=recipeProjection({id:'r',title:'A meal',data:{servings:1,ingredients:[{amount:'1',item:'egg'}],method:['Cook.'],nutrition:{kcal:100,protein_g:0,fibre_g:null}}});
 assert.equal(r.nutrition.protein_g,0);assert.equal(r.nutrition.fibre_g,null);assert.equal(finite(null),null);
 const schema=recipeSchema({...r,path:'/recipes/a',description:'Meal'},date);assert.equal(schema.nutrition.proteinContent,'0 g');assert(!('fiberContent'in schema.nutrition));assert(!('image'in schema));assert(!('aggregateRating'in schema));
});
test('only public first-party images pass the projection',()=>{
 assert.equal(safeImage('https://evil.example/x.png'),null);assert.equal(safeImage('/member/photos/me.png'),null);assert.equal(safeImage('javascript:alert(1)'),null);assert.equal(safeImage('/fit-v3-images/row.png'),base+'/fit-v3-images/row.png');
});
test('movement variants become one canonical page with visible example doses',()=>{
 const rows=['a','b'].map((id,i)=>({id,title:'Sit to stand',data:{canonical_movement:'sit-to-stand',instructions:['Use a stable chair.'],dose_text:(i+1)+' sets',equipment:['chair']}}));
 const result=exerciseProjection(rows);assert.equal(result.length,1);assert.equal(result[0].doses.length,2);assert.equal(result[0].sourceVariants,2);
});
test('recipe pages render content and matching JSON-LD without JavaScript',()=>{
 const {html}=detail(recipe,'recipes',data,shell);assert(html.includes('<h1>Egg &amp; tomato</h1>'));assert(html.includes('100g egg'));assert(html.includes('id="step-1"'));assert(html.includes('Not available'));assert(html.includes('"@type":"Recipe"'));assert(html.includes('/member-register'));assert(!html.includes('medically reviewed'));
});
test('text and JSON-LD cannot break out of their containers',()=>{
 const item={...recipe,title:'</script><img src=x onerror=alert(1)>',method:['<script>alert(2)</script>']};
 const {html}=detail(item,'recipes',data,shell);assert(!html.includes('<img src=x'));assert(html.includes('\\u003c/script>'));assert(html.includes('&lt;script&gt;alert(2)&lt;/script&gt;'));
});
test('pagination is server rendered and search variants are noindex',()=>{
 const d={...data,recipes:Array.from({length:50},(_,i)=>({...recipe,title:'Meal '+i,path:'/recipes/meal-'+i}))};
 const a=indexPage('recipes',d,shell,new URL(base+'/recipes'));assert(a.html.includes('rel="next"'));assert(!a.html.includes('href="/recipes/meal-49"'));
 const b=indexPage('recipes',d,shell,new URL(base+'/recipes?page=2'));assert(b.html.includes('<link rel="canonical" href="'+base+'/recipes?page=2">'));assert(b.html.includes('href="/recipes/meal-49"'));
 const search=indexPage('recipes',d,shell,new URL(base+'/recipes?q=Meal'));assert(search.html.includes('noindex,follow'));
});
test('private routes bypass all catalogue access and all transformations',async()=>{
 let count=0;const original={marker:1,async fetch(request){return new Response('private original',{headers:{'Cache-Control':'private, no-store','Set-Cookie':'same=1'}})}};
 const worker=withAeoGeo(original,{catalogue(){count++;throw Error('Must not run')},shell});assert.equal(worker.marker,1);
 for(const path of ['/member/dashboard','/member-login','/v1/member/me','/api/auth','/checkout','/treatment-order','/admin','/hq/x']){
  assert(isPrivatePath(path));const r=await worker.fetch(new Request(base+path));assert.equal(await r.text(),'private original');assert.equal(r.headers.get('Set-Cookie'),'same=1');
 }
 assert.equal(count,0);
});
test('POST requests and external hosts pass through unchanged',async()=>{
 let n=0;const worker=withAeoGeo({async fetch(){n++;return new Response('original')}},{catalogue(){throw Error('Must not run')},shell});
 assert.equal(await(await worker.fetch(new Request(base+'/recipes',{method:'POST',body:'unchanged'}))).text(),'original');
 assert.equal(await(await worker.fetch(new Request('https://other.example/robots.txt'))).text(),'original');assert.equal(n,2);
});
test('GET and HEAD provide the public catalogue without a session or cookies',async()=>{
 const worker=withAeoGeo({fetch(){throw Error('No upstream for owned pages')}},{catalogue:async()=>data,shell});
 for(const method of ['GET','HEAD']){
  const response=await worker.fetch(new Request(base+recipe.path,{method,headers:{Cookie:'private=member'}}));assert.equal(response.status,200);assert.equal(response.headers.get('Set-Cookie'),null);assert.match(response.headers.get('Cache-Control'),/^public/);const text=await response.text();assert.equal(text.length>0,method==='GET');assert(!text.includes('private=member'));
 }
});
test('inspection marker also covers already-correct public documents and HEAD',async()=>{
 const html='<html><head><meta name="robots" content="noindex"></head><main>Existing noindex page.</main></html>';
 const worker=withAeoGeo({fetch:async request=>new Response(request.method==='HEAD'?null:html,{headers:{'Content-Type':'text/html','ETag':'same'}})},{catalogue(){throw Error('Not needed')},shell});
 for(const method of ['GET','HEAD']){
  const response=await worker.fetch(new Request(base+'/already-correct',{method}));assert.equal(response.headers.get('X-Shift-AEO-GEO'),'aeo-geo-20261102-v1');assert.equal(response.headers.get('ETag'),'same');assert.equal(await response.text(),method==='GET'?html:'');
 }
});
test('owned unknown slugs return a genuine noindex 404 and aliases redirect once',async()=>{
 const worker=withAeoGeo({fetch(){throw Error('not reached')}},{catalogue:async()=>data,shell});
 const missing=await worker.fetch(new Request(base+'/recipes/unknown'));assert.equal(missing.status,404);assert((await missing.text()).includes('noindex,follow'));
 const alias=await worker.fetch(new Request(base+recipe.path+'.html'));assert.equal(alias.status,301);assert.equal(alias.headers.get('Location'),base+recipe.path);
});
test('public HTTP routes redirect directly to the canonical HTTPS host without loading content',async()=>{
 const worker=withAeoGeo({fetch(){throw Error('Not reached')}},{catalogue(){throw Error('No public content over HTTP')},shell});
 for(const [from,to] of [['http://shiftsometimber.co.uk/recipes',base+'/recipes'],['http://www.shiftsometimber.co.uk'+recipe.path+'.html/',base+recipe.path],['http://shiftsometimber.co.uk/robots.txt',base+'/robots.txt'],['http://shiftsometimber.co.uk/llms.txt',base+'/llms.txt']]){
  const r=await worker.fetch(new Request(from));assert.equal(r.status,301);assert.equal(r.headers.get('Location'),to);assert.equal(await r.text(),'');
 }
});
test('robots allow the requested bots but retain account, payment and admin disallows',()=>{
 for(const agent of ['Googlebot','Bingbot','OAI-SearchBot','GPTBot','PerplexityBot','ClaudeBot','Google-Extended'])assert(ROBOTS.includes('User-agent: '+agent+'\n'));
 assert(!/^Disallow: \/$/m.test(ROBOTS));for(const path of ['/member','/checkout','/admin','/v1/'])assert(ROBOTS.includes('Disallow: '+path+'\n'));
});
test('sitemap drops private URLs, duplicates and exclusions and retains real dates',()=>{
 const node=path=>'<url><loc>'+base+path+'</loc><lastmod>2026-01-01</lastmod></url>';
 const xml='<urlset>'+node('/about')+node('/about')+node('/member/dashboard')+node('/old')+'</urlset>';
 const output=completeSitemap(xml,data,{'/about':{lastmod:'2026-10-24'},'/old':{exclude:true}});
 assert.equal(output.split('<loc>'+base+'/about</loc>').length,2);assert(!output.includes('/member/'));assert(!output.includes('/old'));assert(output.includes('2026-10-24'));assert(output.includes(recipe.path));assert(output.includes(data.publishedAt));
});
test('audited product query pages retain their distinct sitemap canonicals',()=>{
 const node=path=>'<url><loc>'+base+path+'</loc></url>';
 const result=completeSitemap('<urlset>'+node('/shift-health/supplements-nutrition?product=whey')+node('/about?utm_source=tracking')+'</urlset>',data);
 assert(result.includes('?product=whey'));assert(!result.includes('utm_source'));
});
test('existing organisational bylines and clinical claims are not invented',()=>{
 const original='<html><head><script type="application/ld+json">'+JSON.stringify({'@type':'Article',author:{'@type':'Organization',name:'SHIFT Team'},dateModified:'2026-10-24'})+'</script></head><body><main><h1>A guide</h1><p>Original clinical words.</p></main></body></html>';
 const result=enhancePublicHtml(original,'/articles/guide');assert(result.includes('Original clinical words.'));assert(result.includes('Last updated'));assert(result.includes('"@type":"Organization","name":"SHIFT Team"'));assert(!result.includes('reviewedBy'));assert(!result.includes('"@type":"Person"'));assert(result.includes('/expert-contributors'));
});
test('existing public organisation has one consistent legal identity',()=>{
 const html='<html><head><script type="application/ld+json">'+JSON.stringify({'@type':'Organization','@id':base+'/#organization',name:'Other name'})+'</script></head><main><h1>Page</h1></main></html>';
 const next=enhancePublicHtml(html,'/about');assert(!next.includes('Other name'));assert(next.includes('17393135'));assert(next.includes('"legalName":"Shift Some Timber Ltd"'));assert.equal(next.split('"@id":"'+base+'/#organization","name":').length,2);
});
test('AI measurement recognises only the named HTTPS origins and never the private URL',()=>{
 for(const host of ['chat.openai.com','chatgpt.com','perplexity.ai','gemini.google.com','copilot.microsoft.com'])assert.equal(safeAiReferrer('https://'+host+'/private-conversation?health=PRIVATE#secret'),'https://'+host+'/');
 for(const url of ['https://chatgpt.com.attacker.example/','http://chatgpt.com/private','https://unknown.example/','data:text/html,secret','https://shiftsometimber.co.uk/member/dashboard'])assert.equal(safeAiReferrer(url),'');
});
test('the existing consent, private-page suppression and tag-manager guards survive the referrer repair',()=>{
 const script="if(!allowed||loaded)return;window.gtag('set',{page_location:location.origin+path,page_referrer:'',allow_google_signals:false});";
 const patched=repairAnalytics(script);assert(patched.startsWith('if(!allowed||loaded)return;'));assert(patched.includes('page_location:location.origin+path'));assert(patched.includes('allow_google_signals:false'));assert(!patched.includes('page_referrer:document.referrer'));assert.equal(repairAnalytics('different source'),'different source');
});
test('long recipe metadata is concise without changing the full heading, canonical, image approval or Recipe identity',()=>{
 const full='Apple and banana chocolate fruit dessert to share with berries, oats, pumpkin seeds and dark chocolate';
 const item={...recipe,path:'/recipes/apple-and-banana-dessert',title:full,description:full+'. Ingredients, step-by-step method and estimated nutrition per serving. Save your food plans in My Timber.',image:null};
 const html=detail(item,'recipes',data,shell).html;
 const title=html.match(/<title>([^<]*)<\/title>/)?.[1],meta=html.match(/<meta name="description" content="([^"]*)"/)?.[1];
 assert(title&&title.length<=62,title);assert(meta&&meta.length<=155,meta);
 assert(!/[—–…]\\s*\\| SHIFT/.test(title),title);assert(!/[—–…]\\./.test(meta),meta);
 assert(html.includes('<h1>'+full+'</h1>'));assert(html.includes('"name":"'+full+'"'));
 assert(html.includes('href="'+base+item.path+'"'));assert(!html.includes('class="aeo-photo"'));
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||'{}')['@graph'];
 const r=graph?.find(x=>x['@type']==='Recipe');assert(r);assert.equal(r.name,full);assert(!('image' in r));
 const approved={...item,image:base+'/assets/approved-recipe.webp'};
 const approvedHtml=detail(approved,'recipes',data,shell).html;
 const approvedGraph=JSON.parse(approvedHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]||'{}')['@graph'];
 assert.deepEqual(approvedGraph.find(x=>x['@type']==='Recipe').image,[approved.image]);
 assert(approvedHtml.includes('src="'+approved.image+'"'));
 assert.equal(recipeSearchMetadata('Short meal','Short meal.').title,'Short meal');
});
test('Google and Bing organic referrers retain only verified HTTPS origins, never search terms or other domains',()=>{
 for(const [raw,expected] of [
  ['https://www.google.co.uk/search?q=PRIVATE','https://www.google.co.uk/'],
  ['https://www.google.com/search?q=PRIVATE','https://www.google.com/'],
  ['https://www.bing.com/search?q=PRIVATE','https://www.bing.com/'],
  ['https://www.google.co.uk.evil.example/search?q=PRIVATE',''],
  ['https://private.example/record?search=PRIVATE',''],
  ['http://www.google.co.uk/search?q=PRIVATE',''],
  ['https://shiftsometimber.co.uk/member/dashboard?health=PRIVATE','']
 ])assert.equal(safeSearchReferrer(raw),expected);
 const patched=repairAnalytics("page_referrer:''");
 assert(!patched.includes('page_referrer:document.referrer'));
 assert(!patched.includes('PRIVATE'));assert(patched.includes('www.google.co.uk'));
});
test('a retained zero-percent version never becomes the selected live source',()=>{
 const d=activeDeployment({id:'deployment',versions:[{version_id:'old-zero',percentage:0},{version_id:'actual-live',percentage:100}]});
 assert.equal(d.versions[0].version_id,'actual-live');assert.deepEqual(replaceActiveTraffic(d,'new-live'),[{version_id:'old-zero',percentage:0},{version_id:'new-live',percentage:100}]);
 assert.throws(()=>activeDeployment({versions:[{version_id:'a',percentage:50},{version_id:'b',percentage:50}]}));
 assert.throws(()=>activeDeployment({versions:[{version_id:'a',percentage:0}]}));
});
test('only the signed-out or pending dashboard cover avoids the late wrapper',()=>{
 const code=repairCoverChrome(FRAME_SIGNATURE+'body.wrapped++;}\nframeBody();');
 for(const [path,state,welcome,expected] of [['/member/dashboard','pending',true,0],['/member/dashboard','signed-out',true,0],['/member/dashboard','ready',true,1],['/member/dashboard','signed-out',false,1],['/recipes/test','signed-out',true,1]]){
  const body={dataset:{memberSession:state},wrapped:0};vm.runInNewContext(code,{location:{pathname:path},document:{body,querySelector:()=>welcome?{}:null}});assert.equal(body.wrapped,expected,path+' '+state);
 }
 assert.equal(repairCoverChrome('unrelated original'), 'unrelated original');
});
test('llms discovery has labelled links and does not duplicate its added sections',()=>{
 const result=repairLlms('# SHIFT\n\n## Pages\n- https://shiftsometimber.co.uk/about\n');
 assert(result.includes('- [About](https://shiftsometimber.co.uk/about)'));assert(!/^- https:/m.test(result));assert.equal(repairLlms(result),result);
});
test('the client-rendered shared footer retains the new library links',()=>{
 const master={header:'UNCHANGED',footer:'<footer><h2>Explore</h2><a href="/tools">Tools</a></footer>'};
 const before='const master='+JSON.stringify(master)+',css="unchanged";';const after=repairPublicChrome(before);
 const parsed=JSON.parse(after.slice('const master='.length,after.indexOf(',css=')));assert.equal(parsed.header,'UNCHANGED');assert(parsed.footer.includes('href="/recipes"'));assert(parsed.footer.includes('href="/exercises"'));assert(parsed.footer.includes('href="/tools"'));assert.equal(repairPublicChrome(after),after);
});
test('the public homepage shell leaves the member app header alone',()=>{
 const signature="/* Shared homepage shell. No API, account or communications operations. */\n;(()=>{'use strict';\n";
 const before=signature+"window.publicShellRan=true;})();";
 const after=repairPublicChrome(before);assert.equal(repairPublicChrome(after),after);
 for(const [path,welcome,expected] of [['/member/dashboard',true,false],['/member/dashboard',false,true],['/recipes/meal',true,true],['/',false,true]]){
  const window={};vm.runInNewContext(after,{window,location:{pathname:path},document:{querySelector:()=>welcome?{}:null}});assert.equal(!!window.publicShellRan,expected,path);
 }
});
test('an inspected owned wrapper can be updated without stacking wrappers or changing its original module',()=>{
 const entry='import original from "../original.mjs";\nexport * from "../original.mjs";\nimport {withAeoGeo} from "./delivery.mjs";\nimport {catalogue} from "./data.mjs";\nimport * as shell from "./shell.mjs";\nimport metadata from "./sitemap-metadata.mjs";\nexport default withAeoGeo(original,{catalogue,shell,metadata});\n';
 const original={name:'original.mjs',content_base64:Buffer.from('ORIGINAL').toString('base64')};
 const modules=[original,...['entry.mjs','delivery.mjs','schema.mjs','content.mjs','analytics.mjs','chrome.mjs','sitemap-metadata.mjs','data.mjs','shell.mjs'].map(n=>({name:'aeo-geo/'+n,content_base64:Buffer.from(n==='entry.mjs'?entry:n).toString('base64')}))];
 const before={main_module:ENTRY,modules};assert.throws(()=>capturedOriginal(before));const captured=capturedOriginal(before,{allowOwned:true});assert.equal(captured.main,'original.mjs');assert.deepEqual(captured.modules,[original]);assert.equal(captured.owned.length,9);
 assert.throws(()=>capturedOriginal({...before,modules:[...modules,{name:'aeo-geo/unknown.mjs'}]},{allowOwned:true}));
 assert.throws(()=>capturedOriginal({...before,modules:modules.map(m=>m.name===ENTRY?{...m,content_base64:Buffer.from(entry+'unknown();').toString('base64')}:m)},{allowOwned:true}));
});
test('binary modules, content types, assets and bindings must survive provider verification',()=>{
 const module={name:'font.bin',content_type:'application/octet-stream',content_base64:Buffer.from([0,255,128,1]).toString('base64')};
 const before={main_module:'original.mjs',bindings:[],compatibility_date:'2026-10-01',assets:{id:'same'},modules:[module]};
 const planned={main_module:ENTRY,modules:[module,{name:ENTRY,content_type:'application/javascript+module',content_base64:Buffer.from('export default {};').toString('base64')}]};
 const staged={...before,...planned};assert(verifyPackage(before,staged,planned));
 assert.throws(()=>verifyPackage(before,{...staged,modules:[{...module,content_type:'application/javascript+module'},planned.modules[1]]},planned));
 assert.throws(()=>verifyPackage(before,{...staged,assets:{id:'different'}},planned));
});
