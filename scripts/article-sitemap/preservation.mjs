import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const phase=process.argv[2];assert(['before','after'].includes(phase));mkdirSync('article-sitemap-proof',{recursive:true});
const clean=s=>s.replace(/<script\b[^>]*\bsrc=["']https:\/\/static.cloudflareinsights.com[^"']*["'][\s\S]*?<\/script>/gi,'').replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi,'');
const hash=s=>createHash('sha256').update(clean(s)).digest('hex');
const pages={};
for(const path of ['/','/programme','/about','/articles/mounjaro-cost-uk','/member-login','/DEPLOYMENT-FINGERPRINT.json']){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{headers:{'User-Agent':'SHIFT-Article-Sitemap-Verification/1.0','Cache-Control':'no-cache'}});
 assert.equal(r.status,200,path);pages[path]={sha256:hash(await r.text()),status:r.status};
}
writeFileSync('article-sitemap-proof/'+phase+'.json',JSON.stringify(pages,null,2));
if(phase==='after')assert.deepEqual(pages,JSON.parse(readFileSync('article-sitemap-proof/before.json')),'Existing public/member pages changed');
console.log(JSON.stringify({phase,pages}));
