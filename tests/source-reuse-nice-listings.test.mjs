import test from 'node:test';
import assert from 'node:assert/strict';
import {NICE_TOPIC,niceTopicListingLinks,scanNiceTopic,niceGuidanceStage} from '../radar-source-policy-v1.js';
const topicPath=new URL(NICE_TOPIC).pathname;
const published=topicPath+'/products?Status=Published&Status=Terminated';
const development=topicPath+'/products?Status=InDevelopment';
const link=(href,label='Topic list')=>`<a href="${href.replaceAll('&','&amp;')}">${label}</a>`;
test('current topic product URLs are followed only when supplied by the topic page',()=>{
 const html=link(published)+link(development)+link('/guidance/other-topic/products?Status=Published')+link('https://unrelated.invalid'+published);
 assert.deepEqual(niceTopicListingLinks(html),['https://www.nice.org.uk'+published,'https://www.nice.org.uk'+development]);
});
test('broad supplied topic lists take precedence over narrower subsets within the request bound',()=>{
 const narrow=Array.from({length:5},(_,i)=>link(topicPath+'/products?Status=Published&ProductType=Subset'+i)).join('');
 const got=niceTopicListingLinks(narrow+link(published)+link(development));
 assert.equal(got.length,4);assert.deepEqual(got.slice(0,2),['https://www.nice.org.uk'+published,'https://www.nice.org.uk'+development]);
});
test('published plus terminated listing is not misrepresented as current final guidance',async()=>{
 const item={title:'Weight management evidence',url:'https://www.nice.org.uk/guidance/ta9999'};
 const fetcher=async url=>new Response(String(url)===NICE_TOPIC?link(published):link(item.url,item.title));
 const parser=(html)=>html.includes('ta9999')?[item]:[];
 const result=await scanNiceTopic(fetcher,parser);
 assert.equal(result[0].guidance_stage,'published_or_terminated_requires_individual_check');
 assert.equal(result[0].source_date,undefined);
 assert.equal(niceGuidanceStage({...item,title:'Weight management (terminated appraisal)'}),'terminated_appraisal');
});
test('blocked linked listing is a failed source observation, not a successful empty feed',async()=>{
 const requested=[];
 const fetcher=async url=>{requested.push(String(url));return String(url)===NICE_TOPIC?new Response(link(published)):new Response('Forbidden',{status:403})};
 await assert.rejects(scanNiceTopic(fetcher,()=>[]),/http_403/);
 assert.deepEqual(requested,[NICE_TOPIC,'https://www.nice.org.uk'+published]);
});
test('repeated source links are read once and no unsupplied pagination is invented',async()=>{
 const item={title:'Weight management guidance',url:'https://www.nice.org.uk/guidance/ng9999'},requested=[];
 const fetcher=async url=>{requested.push(String(url));return new Response(String(url)===NICE_TOPIC?link(published)+link(published):link(item.url,item.title))};
 const result=await scanNiceTopic(fetcher,html=>html.includes('ng9999')?[item,item]:[]);
 assert.equal(requested.length,2);assert.equal(result.length,1);
});
