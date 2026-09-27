import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {withEditorialResources} from '../../editorial-resources-v1.js';
import {ARTICLES,PATHS,VERSION,rewriteArticle,UPDATED,STATS} from './render.mjs';
import {CSV,CHART} from '../statistics/assets.js';
import {expectedSeo794ArticleBody} from '../../release/seo794-preservation.mjs';
const live=process.argv.includes('--live'),root=live?'five-article-live':'five-article-proof';mkdirSync(root,{recursive:true});
const origin='https://shiftsometimber.co.uk',hash=v=>createHash('sha256').update(v).digest('hex');
const main=html=>html.match(/<main\b[\s\S]*?<\/main\s*>/i)?.[0];
const header=html=>html.match(/<header\b[\s\S]*?<\/header\s*>/i)?.[0];
const footer=html=>html.match(/<footer\b[\s\S]*?<\/footer\s*>/i)?.[0];
const attributes=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(x=>[x[1].toLowerCase(),x[2]??x[3]??x[4]]));
const evidence={checkedAt:new Date().toISOString(),mode:live?'actual_live_GET':'captured_public_shell_with_candidate_transform',revision:VERSION,articles:[],controls:[],downloads:[],failures:[],productionWrites:false};
async function read(path){const response=await fetch(origin+path,{credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(25000)});assert.equal(response.status,200,path);assert.equal(new URL(response.url).pathname.replace(/\/+$/,''),path.replace(/\/+$/,''),'Unexpected redirect '+path);return response}
function checkDocument(html,path){
 assert.equal([...html.matchAll(/<main\b/gi)].length,1);assert.equal([...html.matchAll(/<h1\b/gi)].length,1);assert.ok(html.includes('data-five-article="'+VERSION+'"'));
 const tags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(m=>attributes(m[0]));for(const name of ['description','og:title','og:description','og:url','twitter:title','twitter:description'])assert.equal(tags.filter(x=>(x.name||x.property||'').toLowerCase()===name).length,1,'One '+name+' '+path);
 const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attributes(m[0])).filter(x=>(x.rel||'').toLowerCase()==='canonical');assert.equal(canonical.length,1);assert.equal(canonical[0].href,origin+path);
 const nodes=[];for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){if(attributes(m[0].split('>')[0]).type==='application/ld+json'){const obj=JSON.parse(m[1]);nodes.push(...(obj['@graph']||[obj]))}}
 const article=nodes.filter(n=>n['@type']==='Article');assert.equal(article.length,1);assert.equal(article[0].headline,ARTICLES[path].title);assert.equal(article[0].dateModified,UPDATED);assert.equal(article[0].reviewedBy,undefined);assert.ok(!nodes.some(n=>n['@type']==='FAQPage'));
 const rewritten=rewriteArticle(html,path);assert.equal(main(html),live?expectedSeo794ArticleBody(main(rewritten),path):main(rewritten),'Article body must match exact approved source and the approved direct Good to Talk link');
 const ids=[...main(html).matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const m of main(html).matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),'Missing anchor '+m[1]);
 return {title:ARTICLES[path].title,canonical:canonical[0].href,articleSha256:hash(main(html)),wordCount:main(html).replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length,sourceCount:ARTICLES[path].sources.length,metadataUnique:true,bodyMatchesSource:true};
}
for(const [index,path] of PATHS.entries()){
 try{const response=await read(path),before=await response.text();let after=before;
 if(!live){after=await(await withEditorialResources(new Response(before,{headers:{'Content-Type':'text/html'}}),new Request(origin+path))).text();assert.equal(header(after),header(before),'Header changed');assert.equal(footer(after),footer(before),'Footer changed');writeFileSync(root+'/'+index+'-before.html',before)}
 const check=checkDocument(after,path);writeFileSync(root+'/'+index+'-after.html',after);evidence.articles.push({index,path,status:response.status,headers:Object.fromEntries(['content-type','x-shift-article-revision','cache-control'].map(k=>[k,response.headers.get(k)])),...check,...(!live?{headerUnchanged:true,footerUnchanged:true,beforeWordCount:main(before).replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length}:{})});
 }catch(error){evidence.failures.push({path,error:error.message})}
}
for(const path of ['/','/programme','/start-here','/treatment-centre','/editorial-standards','/member-login']){
 try{const r=await read(path),html=await r.text();if(path!=='/editorial-standards'){const input=new Response(html,{headers:{'Content-Type':'text/html'}});assert.equal(await withEditorialResources(input,new Request(origin+path)),input)}assert.ok(!html.includes('data-five-article="'),'Article content leaked to '+path);evidence.controls.push({path,status:r.status,sha256:hash(html),fiveArticleMarkerAbsent:true})}catch(e){evidence.failures.push({path,error:e.message})}
}
for(const [suffix,expected] of [['/data.csv',CSV],['/chart.svg',CHART]]){try{const r=await read(STATS+suffix),body=await r.text();assert.equal(body,expected,'Existing data asset changed');evidence.downloads.push({path:STATS+suffix,sha256:hash(body),unchanged:true})}catch(e){evidence.failures.push({path:STATS+suffix,error:e.message})}}
if(live){try{const xml=await(await read('/sitemap.xml')).text();const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,new Set(urls).size);for(const path of PATHS){const block=[...xml.matchAll(/<url\b[^>]*>[\s\S]*?<\/url>/g)].map(m=>m[0]).find(x=>x.includes('<loc>'+origin+path+'</loc>'));assert.ok(block);assert.ok(block.includes('<lastmod>'+UPDATED+'</lastmod>'),path+' lastmod')}evidence.sitemap={urls:urls.length,mentalHealthUrls:urls.filter(x=>x.includes('/mental-health/')).length,fiveDatesCorrect:true}}catch(e){evidence.failures.push({path:'/sitemap.xml',error:e.message})}}
evidence.pass=evidence.articles.length===5&&!evidence.failures.length;writeFileSync(root+'/document-proof.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence,null,2));if(!evidence.pass)process.exitCode=1;
