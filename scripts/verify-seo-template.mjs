import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {PATHS,STATS} from '../editorial/five-articles/render.mjs';
import {SHARING_IMAGE_PATHS,PUBLIC_LINK_TARGETS,repairPublicSeoLinks} from '../public-seo-closeout.mjs';
import {candidateDocument} from '../preview/seo-template/transform.mjs';
import {publicPageEvidence,assertPublicPagesPreserved} from '../medicines-watch/preservation.mjs';

const origin='https://shiftsometimber.co.uk',live=process.argv.includes('--live');
const preview=process.argv.find(a=>a.startsWith('--preview='))?.slice(10),base=preview||origin;
const out=live?'seo-template-live-proof':'seo-template-candidate-proof';
await mkdir(out,{recursive:true});
const hash=body=>createHash('sha256').update(body).digest('hex');
const attr=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(m=>[m[1].toLowerCase(),m[2]??m[3]]));
const tags=(html,key)=>[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attr(m[0])).filter(a=>(a.name||a.property)?.toLowerCase()===key).map(a=>a.content);
const nodes=html=>{
 const result=[];const walk=x=>{if(x&&typeof x==='object'){if(x['@type'])result.push(x);for(const y of Object.values(x))Array.isArray(y)?y.forEach(walk):walk(y)}};
 for(const m of html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi))if(attr(m[0].split('>')[0]).type==='application/ld+json')walk(JSON.parse(m[0].replace(/^<script\b[^>]*>/i,'').replace(/<\/script\s*>$/i,'')));
 return result;
};
async function read(path,method='GET',host=base){
 const response=await fetch(host+path,{method,redirect:'manual',signal:AbortSignal.timeout(30000),headers:{'User-Agent':'Mozilla/5.0 (compatible; ShiftSomeTimberSEOAudit/1.0)','Cache-Control':'no-cache'}});
 return {response,html:method==='HEAD'?'':await response.text()};
}
const linkedPages=['/weight-loss-injections-for-men','/programme','/tools','/tools/calories','/tools/sleep','/tools/steps','/tools/walking','/tools/water','/progress-centre-methodology','/guides/exercise-walking-strength-mobility','/guides/nutrition-protein-calories-meal-planning','/guides/sleep-stress-mindset-emotional-eating-maintenance'];
const paths=[...new Set([...PATHS,...SHARING_IMAGE_PATHS,'/shift-newsroom','/articles/wegovy-cost-uk',...linkedPages])];
const proof={checkedAt:new Date().toISOString(),mode:live?'live':preview?'preview':'candidate',base,pages:[],redirects:[],advisories:[],failures:[]};
const main=html=>html.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
for(let start=0;start<paths.length;start+=5){
 await Promise.all(paths.slice(start,start+5).map(async path=>{
  try{
   const {response,html:before}=await read(path);assert.equal(response.status,200,path);
   const html=live||preview?before:await candidateDocument(before,path),records=nodes(html);
   const filename=path.slice(1).replaceAll('/','_');
   await writeFile(out+'/'+filename+'.html',html);
   if(!live&&!preview){
    await writeFile(out+'/'+filename+'-before.html',before);
    assert.equal(main(html),repairPublicSeoLinks(main(before)),'Visible article content changed outside direct link replacements');
    if(path==='/programme')assertPublicPagesPreserved([publicPageEvidence(path,200,html,{hash})],[publicPageEvidence(path,200,before,{hash})]);
   }
   const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attr(m[0])).filter(a=>a.rel==='canonical');
   assert.equal(canonical.length,1);assert.equal(canonical[0].href,origin+path);
   assert.equal((html.match(/<h1\b/gi)||[]).length,1);
   for(const key of ['twitter:card','twitter:title','twitter:description','twitter:image']){assert.equal(tags(html,key).length,1,path+' '+key);assert.ok(tags(html,key)[0])}
   if(!preview){assert.ok(!tags(html,'robots').some(x=>/noindex/i.test(x)));assert.ok(!/noindex/i.test(response.headers.get('X-Robots-Tag')||''))}
   const organizations=records.filter(n=>n['@type']==='Organization');
   if([...PATHS,'/shift-newsroom','/articles/wegovy-cost-uk'].includes(path))assert.ok(organizations.length>0,'Organization record missing');
   for(const org of organizations)assert.equal(org.logo?.url,origin+'/assets/shift-wordmark.png');
   for(const tag of html.match(/<a\b[^>]*>/gi)||[]){const href=attr(tag).href;if(!href)continue;const u=new URL(href,origin);if(u.origin===origin)assert.ok(!PUBLIC_LINK_TARGETS[u.pathname],'Legacy link remains: '+href)}
   if(path==='/articles/wegovy-cost-uk')assert.equal((html.match(/class="drawer-backdrop"/g)||[]).length,1);
   const article=records.find(n=>['Article','BlogPosting'].includes(n['@type']));
   if(PATHS.includes(path)){
    assert.equal(article.dateModified,'2026-09-19');
    if(path===STATS)assert.equal(article.image,origin+STATS+'/chart.svg');
    if(!article.datePublished)proof.advisories.push({path,field:'datePublished',reason:path===STATS?'No original publication date in source.':'Source has conflicting original publication dates; verified update date retained.'});
    if(!article.image)proof.advisories.push({path,field:'image',reason:'No representative image in the visible article; publisher logo is not an article image.'});
   }
   proof.pages.push({path,status:response.status,sha256:hash(html),contentPreserved:!live&&!preview,organizations:records.filter(n=>n['@type']==='Organization').length,twitterComplete:true,...(article?{datePublished:article.datePublished||null,image:article.image||null}:{})});
  }catch(error){proof.failures.push({path,error:error.message})}
 }));
}
const faq={
 '/faq/why-do-i-have-no-motivation':'/articles/motivation-vs-routine-men',
 '/faq/why-do-i-feel-tired-all-the-time':'/shift-health/testosterone-energy',
 '/faq/how-can-i-lose-weight':'/start-here',
 '/faq/how-much-sleep-do-i-need':'/articles/sleep-and-weight-men',
 '/faq/what-is-a-healthy-blood-pressure':'/guides/blood-pressure-guide',
 '/faq/what-is-a-healthy-bmi':'/tools/bmi',
};
if(!preview)await Promise.all(Object.entries(faq).map(async([path,target])=>{
 try{for(const method of ['GET','HEAD']){const {response}=await read(path,method,origin);assert.equal(response.status,301);assert.equal(new URL(response.headers.get('location'),origin).href,origin+target)}const {response}=await read(target,'GET',origin);assert.equal(response.status,200);proof.redirects.push({path,target,status:301,targetStatus:200,methods:['GET','HEAD']})}catch(error){proof.failures.push({path,error:error.message})}
}));
if(!preview){const {response,html}=await read('/sitemap.xml','GET',origin);assert.equal(response.status,200);await writeFile(out+'/sitemap.xml',html);const urls=[...html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,new Set(urls).size);for(const path of paths)assert.ok(urls.includes(origin+path),path+' missing from sitemap');proof.sitemap={count:urls.length,sha256:hash(html)}}
proof.pages.sort((a,b)=>a.path.localeCompare(b.path));proof.pass=proof.pages.length===paths.length&&proof.failures.length===0;
await writeFile(out+'/proof.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2));if(!proof.pass)process.exitCode=1;
