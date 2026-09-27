import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {healthSlugs} from '../shift-health-public.mjs';
import {mentalHealthDescription} from '../public-seo-closeout.mjs';

const origin=(process.argv[2]||'https://shiftsometimber.co.uk').replace(/\/+$/,'');
const fetchText=async(path,options={})=>{
  let last;
  for(let attempt=1;attempt<=3;attempt++){
    try{
      const response=await fetch(origin+path,{redirect:'manual',headers:{'cache-control':'no-cache'},...options});
      const text=options.method==='HEAD'?'':await response.text();
      return {response,text};
    }catch(error){last=error;if(attempt<3)await new Promise(resolve=>setTimeout(resolve,1000*attempt));}
  }
  throw last;
};
const meta=(html,key,attribute='name')=>[...html.matchAll(new RegExp(`<meta\\b(?=[^>]*\\b${attribute}\\s*=\\s*["']${key.replace(':','\\:')}["'])[^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*>`,'gi'))].map(match=>match[1]);
const jsonLd=html=>[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(match=>JSON.parse(match[1]));
const organizations=value=>{
  const found=[];
  const walk=item=>{if(!item||typeof item!=='object')return;if(item['@type']==='Organization')found.push(item);for(const child of Object.values(item))Array.isArray(child)?child.forEach(walk):walk(child)};
  walk(value);return found;
};

const sitemap=await fetchText('/sitemap.xml');assert.equal(sitemap.response.status,200);
const locations=[...sitemap.text.matchAll(/<loc>(https:\/\/shiftsometimber\.co\.uk[^<]+)<\/loc>/g)].map(match=>new URL(match[1]).pathname);
const newsPaths=locations.filter(path=>/^\/medicine-news\/[^/]+$/.test(path));
assert.ok(newsPaths.length>=166,`Expected at least 166 newsroom articles; found ${newsPaths.length}`);
const newsroomFailures=[];
for(let start=0;start<newsPaths.length;start+=12){
  await Promise.all(newsPaths.slice(start,start+12).map(async path=>{
    const {response,text}=await fetchText(path);if(response.status!==200){newsroomFailures.push(`${path}: HTTP ${response.status}`);return;}
    let records;try{records=jsonLd(text)}catch(error){newsroomFailures.push(`${path}: invalid JSON-LD ${error.message}`);return;}
    const orgs=records.flatMap(organizations);
    if(!orgs.length)newsroomFailures.push(`${path}: no Organization`);
    else if(orgs.some(org=>org.logo?.url!=='https://shiftsometimber.co.uk/assets/shift-wordmark.png'))newsroomFailures.push(`${path}: Organization.logo incomplete`);
  }));
}
assert.deepEqual(newsroomFailures,[]);

const healthPaths=['/shift-health',...healthSlugs.map(slug=>'/shift-health/'+slug)],healthFailures=[];
for(const path of healthPaths){
  const {response,text}=await fetchText(path);if(response.status!==200){healthFailures.push(`${path}: HTTP ${response.status}`);continue;}
  for(const key of ['twitter:card','twitter:title','twitter:description','twitter:image'])if(meta(text,key).length!==1)healthFailures.push(`${path}: ${key} count ${meta(text,key).length}`);
}
assert.deepEqual(healthFailures,[]);

const watch=await fetchText('/treatment-centre/medicines-watch'),treatments=await fetchText('/treatment-centre');
assert.equal(watch.response.status,200);assert.equal(meta(watch.text,'description').length,1);assert.equal(meta(watch.text,'og:description','property').length,1);assert.equal(meta(watch.text,'twitter:description').length,1);
assert.notEqual(meta(watch.text,'description')[0],meta(treatments.text,'description')[0]);

const mentalHealth={};
for(const path of ['/mental-health/medication-and-weight','/mental-health/when-someone-refuses-help']){
  const {response,text}=await fetchText(path),expected=mentalHealthDescription(path);assert.equal(response.status,200);
  for(const [key,attribute] of [['description','name'],['og:description','property'],['twitter:description','name']])assert.deepEqual(meta(text,key,attribute),[expected],`${path}: ${key}`);
  mentalHealth[path]=expected;
}

const redirects={
  '/faq/why-do-i-have-no-motivation':'/articles/motivation-vs-routine-men',
  '/faq/why-do-i-feel-tired-all-the-time':'/shift-health/testosterone-energy',
  '/faq/how-can-i-lose-weight':'/start-here',
  '/faq/how-much-sleep-do-i-need':'/articles/sleep-and-weight-men',
  '/faq/what-is-a-healthy-blood-pressure':'/guides/blood-pressure-guide',
  '/faq/what-is-a-healthy-bmi':'/tools/bmi',
};
for(const [path,target] of Object.entries(redirects)){
  const {response}=await fetchText(path,{method:'HEAD'});assert.equal(response.status,301,path);assert.equal(new URL(response.headers.get('location')).pathname,target,path);
}

const proof={checkedAt:new Date().toISOString(),origin,sitemapUrls:locations.length,newsroomArticles:newsPaths.length,newsroomOrganizationLogoFailures:newsroomFailures,shiftHealthRoutes:healthPaths.length,shiftHealthTwitterFailures:healthFailures,medicinesWatchDescription:meta(watch.text,'description')[0],mentalHealth,legacyFaqRedirects:Object.keys(redirects).length,status:'PASS'};
await writeFile('seo-closeout-live-proof.json',JSON.stringify(proof,null,2)+'\n');
console.log(JSON.stringify(proof,null,2));
