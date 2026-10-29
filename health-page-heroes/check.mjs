import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pages,replaceHero,imageURL} from './heroes.mjs';
import {heroStyle} from './styles.mjs';
import {composeHeroPages} from './runtime.mjs';
const b=JSON.parse(fs.readFileSync('/workspace/scratch/batch-hero-baseline-20261029.json'));
const assets=JSON.parse(fs.readFileSync(new URL('./assets.json',import.meta.url)));
const outDir=new URL('../dist/heroes/',import.meta.url); fs.mkdirSync(outDir,{recursive:true});
const checks=[];
for(const p of pages){
 const asset=assets[p.id],bytes=fs.readFileSync(new URL('../'+asset.file,import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),asset.sha256,p.id+' asset');
 const before=b[p.id].mainHtml;const result=replaceHero(before,p,asset);const after=result.html;
 assert(result.changed);assert.equal((after.match(/<h1\b/gi)||[]).length,1,p.id+' H1');
 assert.equal((after.match(/data-shift-approved-hero=/g)||[]).length,1);
 assert(b[p.id].ids.includes(p.target.slice(1)),p.id+' CTA target');
 for(const id of b[p.id].ids)assert(after.includes('id="'+id+'"'),p.id+' preserve '+id);
 assert.equal(replaceHero(after,p,asset).html,after,'idempotence');
 if(p.kind==='product'){
  for(const cls of ['availability','actions']){const re=new RegExp('<div class="'+cls+'">[\\s\\S]*?<\\/div>');assert.equal(after.match(re)?.[0],before.match(re)?.[0],p.id+' '+cls);}
  const oldHeroEnd=before.indexOf('</section>',before.indexOf('class="productHero"'))+10;assert(after.endsWith(before.slice(oldHeroEnd)),p.id+' guide');
 }
 if(p.kind==='testosterone')assert(after.endsWith(before.slice(before.indexOf('<section class="th-prompts"'))));
 if(p.kind==='mental')assert(after.endsWith(before.slice(before.indexOf('</section>')+10)));
 if(p.kind==='bloods'){for(const cls of ['arm-feature','footnote'])assert(after.includes(before.match(new RegExp('<[^>]*class="'+cls+'[^>]*>[\\s\\S]*?<\\/[^>]*>'))?.[0]||cls));}
 const runtimeAssets={[p.id]:{...asset,base64:bytes.toString('base64')}};
 const source='<!doctype html><html><head><title>Retained title</title></head><body>'+before+'</body></html>';
 const scheduled=()=>{};const retained={scheduled,fetch:()=>new Response(source,{headers:{'Content-Type':'text/html','ETag':'old'}})};
 const worker=composeHeroPages(retained,runtimeAssets);assert.equal(worker.scheduled,scheduled);
 const response=await worker.fetch(new Request('https://shiftsometimber.co.uk'+p.path),{},{});assert(response.headers.has('X-Shift-Approved-Hero'));assert(!response.headers.has('ETag'));
 assert.equal(await (await worker.fetch(new Request('https://shiftsometimber.co.uk'+p.path+'?product=existing'),{},{})).text(),source);
 assert.equal(Buffer.compare(Buffer.from(await (await worker.fetch(new Request('https://shiftsometimber.co.uk'+imageURL(p,asset)),{},{})).arrayBuffer()),bytes),0);
 const head=b[p.id].head.replace(/<script\b[\s\S]*?<\/script>/gi,'');
 const preview=after.replace(imageURL(p,asset),'data:image/webp;base64,'+bytes.toString('base64'));
 fs.writeFileSync(new URL(p.id+'.html',outDir),'<!doctype html><html><head><base href="https://shiftsometimber.co.uk/"><meta name="viewport" content="width=device-width, initial-scale=1">'+head+'<style>'+heroStyle+'</style></head><body>'+preview+'</body></html>');
 checks.push({page:p.id,assetSha256:asset.sha256,oneH1:true,ctaTargetExists:true,allOriginalIdsRetained:true,originalGuideAndControlsRetained:true,runtimeAndMediaPassed:true});
}
fs.writeFileSync(new URL('./local-checks.json',import.meta.url),JSON.stringify({checkedAt:new Date().toISOString(),checks},null,2)+'\n');
fs.writeFileSync(new URL('mobile.html',outDir),'<!doctype html><html><head><title>Approved heroes mobile QA</title><style>body{background:#707762;color:#E7E3DA;font-family:Arial;margin:20px}section{display:inline-block;vertical-align:top;margin:0 20px 30px 0}iframe{width:390px;height:1050px;border:0;background:#050505}h2{margin:10px}</style></head><body>'+pages.map(p=>'<section><h2>'+p.id+'</h2><iframe title="'+p.id+' mobile" src="'+p.id+'.html"></iframe></section>').join('')+'</body></html>');
console.log('PASS: '+checks.length+' approved hero pages, assets, original guides, availability and CTA targets.');
