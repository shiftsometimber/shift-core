import {plainText} from './ai-site-knowledge.mjs';
// Only a generic public topic leaves SHIFT. Never send a member's message,
// identity, medicines history or saved records to an external search service.
const TOPICS=[[/\bconstipat\w*\b/i,'constipation'],[/\bsleep apnoea\b|\bsnoring\b/i,'sleep apnoea'],[/\bheartburn\b|\bacid reflux\b/i,'heartburn'],[/\bdehydrat\w*\b/i,'dehydration'],[/\bfatigue\b|\btiredness\b/i,'tiredness'],[/\bcholesterol\b/i,'high cholesterol'],[/\bblood pressure\b/i,'high blood pressure'],[/\berectile\b/i,'erectile dysfunction'],[/\banxiety\b/i,'anxiety'],[/\bback pain\b/i,'back pain'],[/\bknee pain\b/i,'knee pain'],[/\bdiarrhoea\b/i,'diarrhoea'],[/\bmenopause\b/i,'menopause']];
export function externalTopic(query){return TOPICS.find(([re])=>re.test(query))?.[1]||null}
const allowed=u=>u.origin==='https://www.nhs.uk'&&/^\/(?:conditions|live-well|mental-health)\/[a-z0-9/-]+$/.test(u.pathname)&&!u.search&&!u.hash;
export async function externalKnowledge(query,{fetcher=fetch,cache=globalThis.caches?.default}={}){
 const topic=externalTopic(query);if(!topic)return[];const cacheKey=new Request('https://shiftsometimber.co.uk/__ai_external_public/'+encodeURIComponent(topic));
 try{
 const hit=await cache?.match(cacheKey);if(hit)return hit.json();
 const signal=AbortSignal.timeout(2500);
 const result=await fetcher('https://www.nhs.uk/search/results?q='+encodeURIComponent(topic),{redirect:'error',signal,headers:{Accept:'text/html'}});if(!result.ok)return[];
 const html=await result.text();if(html.length>1000000)return[];
 const candidates=[...html.matchAll(/href=["']([^"']+)["']/gi)].flatMap(m=>{try{let u=new URL(m[1].replace(/&amp;/g,'&'),'https://www.nhs.uk');if(u.origin==='https://www.nhs.uk'&&u.pathname==='/search/click'){const target=u.searchParams.get('url');if(!target)return[];u=new URL(target,'https://www.nhs.uk');}return allowed(u)&&!/(?:children|babies|pregnancy)/.test(u.pathname)?[u.href]:[]}catch{return[]}});
 const url=[...new Set(candidates)].find(u=>topic.split(' ').some(t=>t.length>3&&u.includes(t)));if(!url)return[];
 const page=await fetcher(url,{redirect:'error',signal,headers:{Accept:'text/html'}});if(!page.ok)return[];const text=await page.text();if(text.length>1500000)return[];
 const title=plainText(text.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'');const main=text.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]||'';
 const content=plainText(main).split(/(?<=[.!?])\s+/).reduce((out,s)=>out.length+s.length<1000?out+s+' ':out,'').trim();if(!title||content.length<120)return[];
 const items=[{id:'external:'+topic,sourceWorld:'external_primary_source',title:'NHS: '+title,content,authority:80,reviewState:'external_unreviewed',citation:url,provenance:[{type:'external_primary',ref:url,checkedAt:new Date().toISOString()}],limitations:'External NHS information, retrieved for general information; not clinically reviewed by SHIFT and not an individual assessment.'}];
 await cache?.put(cacheKey,Response.json(items,{headers:{'Cache-Control':'public, max-age=3600'}}));return items;
 }catch{return[]}
}
