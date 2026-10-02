const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const b=await chromium.launch({headless:true});fs.mkdirSync('public-wording-proof',{recursive:true});const out=[];
try{for(const width of [390,1440]){const p=await b.newPage({viewport:{width,height:1000}});
for(const path of ['/treatment-centre','/treatment-centre/medicines-watch']){
const r=await p.goto('https://shift-public-wording-preview.matobrien.workers.dev'+path,{waitUntil:'networkidle'});assert.equal(r.status(),200);
assert.equal(await p.locator('h1').count(),1);
if(path.endsWith('medicines-watch')){assert.match(await p.locator('h1').innerText(),/Medicines &.*Research Watch/s);assert.match(await p.locator('.mw-lead').innerText(),/research and information listings/);assert(await p.locator('details').count()>=6);}
else assert.match(await p.locator('#medicines-watch-entry-title').innerText(),/Medicines & Research Watch/);
const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,'horizontal overflow '+width+' '+path);
await p.screenshot({path:'public-wording-proof/'+width+'-'+(path.endsWith('medicines-watch')?'watch':'treatments')+'.png',fullPage:false});
out.push({width,path,ok:true});
}
await p.goto('https://shift-public-wording-preview.matobrien.workers.dev/',{waitUntil:'networkidle'});
const menu=p.getByRole('button',{name:/menu/i});if(await menu.count())await menu.first().click();else await p.locator('[aria-controls="site-drawer"]').click();
await p.locator('aside.site-drawer .sst-drawer-logo').waitFor({state:'visible'});assert.equal(await p.locator('#sst-drawer-mark-20261002').count(),1);
const mark=await p.locator('.sst-drawer-logo').evaluate(e=>getComputedStyle(e,'::after').backgroundImage);assert.match(mark,/sst-header-brand-mark-20261001/);
await p.screenshot({path:'public-wording-proof/'+width+'-menu.png',fullPage:false});
out.push({width,path:'open menu',mark,ok:true});await p.close();}
fs.writeFileSync('public-wording-proof/checks.json',JSON.stringify(out,null,2));}
finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
