import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {repairRetaPresentation,RETA_PATH} from '../../reta-presentation-repair.mjs';
import {RETA_IMAGE} from '../../reta-editorial-asset.mjs';
const phase=process.argv[2];assert(['before','after'].includes(phase));mkdirSync('reta-proof',{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const paths=['/',RETA_PATH,'/shift-health','/articles/mounjaro-cost-uk','/start-here','/mounjaro','/wegovy','/programme','/about','/member/dashboard','/member/settings','/member-login','/my-timber/privacy','/account-deletion','/sitemap.xml','/DEPLOYMENT-FINGERPRINT.json'];
const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const get=async p=>{const r=await fetch('https://shiftsometimber.co.uk'+p,{headers:{'Cache-Control':'no-cache','User-Agent':'SHIFT-scoped-release-proof/1.0'}});assert.equal(r.status,200,p);return {body:await r.text(),headers:Object.fromEntries(r.headers)}};
const pages={};for(const p of paths)pages[p]=await get(p);
if(phase==='before'){
 assert(!pages[RETA_PATH].body.includes('data-reta-editorial-image'),'Already released; do not repeat deployment');
 for(const asset of JSON.parse(readFileSync('editorial/retatrutide/media/style-provenance.json'))){assert.equal(sha((await get(asset.url)).body),asset.sha256,asset.url+' drift')}
 writeFileSync('reta-proof/live-before.json',JSON.stringify(pages,null,2));console.log('Captured',paths.length,'live routes and verified stylesheet provenance');
}else{
 const old=JSON.parse(readFileSync('reta-proof/live-before.json')),checks=[];
 for(const p of paths){
  if(p==='/sitemap.xml'){
   const urls=h=>[...h.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]).sort();assert.deepEqual(urls(pages[p].body),urls(old[p].body));checks.push({path:p,urlsBefore:urls(old[p].body).length,urlsAfter:urls(pages[p].body).length,removed:0,added:0});continue;
  }
  let expected=p===RETA_PATH?repairRetaPresentation(old[p].body,p):old[p].body;
  writeFileSync('reta-proof/'+p.replace(/\W/g,'_')+'-after.html',pages[p].body);
  const same=clean(expected)===clean(pages[p].body);checks.push({path:p,expectedSha256:sha(clean(expected)),actualSha256:sha(clean(pages[p].body)),exactExpectedMatch:same});
 }
 writeFileSync('reta-proof/live-preservation.json',JSON.stringify({at:new Date().toISOString(),checks},null,2));
 assert(checks.every(x=>x.exactExpectedMatch!==false),'Unexpected live page difference: inspect live-preservation.json');
 const r=await fetch('https://shiftsometimber.co.uk'+RETA_IMAGE.path);assert.equal(r.status,200);assert.equal(sha(Buffer.from(await r.arrayBuffer())),RETA_IMAGE.sha256);
 for(const name of ['content-security-policy','strict-transport-security','x-content-type-options','referrer-policy','x-frame-options','permissions-policy'])assert(pages[RETA_PATH].headers[name],name);
 console.log('PASS: exact declared Reta change, 14 other routes unchanged, sitemap URLs preserved, image bytes and security headers verified.');
}
