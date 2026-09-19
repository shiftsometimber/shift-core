import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ARTICLE} from './editorial/public-bundle.mjs';
const fetchLive=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});assert.equal(r.status,200,url+' must be live');return r};
const response=await fetchLive(ARTICLE.proposed_url);const html=await response.text();
assert.equal(response.headers.get('X-Shift-Article-Revision'),'wegovy-cost-uk-20260919-matt-images-contrast');
assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes(ARTICLE.title));assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large">/);assert(html.includes('rel="canonical" href="'+ARTICLE.proposed_url+'"'));
assert(html.includes(ARTICLE.authorBio));assert.match(html,/id="shift-article-contrast"/);assert.doesNotMatch(html,/noindex|data:image|preview only/i);
const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1]);assert.equal(schema.author.name,'Matt O’Brien');assert(schema.datePublished);assert.equal(schema.mainEntityOfPage,ARTICLE.proposed_url);
const main=html.match(/<main[\s\S]*?<\/main>/)[0];assert.equal((main.match(/<img\b/g)||[]).length,3);
const images=[];for(const img of ARTICLE.images){assert(main.includes(img.url));const url=new URL(img.url,ARTICLE.proposed_url).href;const r=await fetchLive(url);const type=r.headers.get('Content-Type');assert.match(type,/^image\//);images.push({url,status:r.status,type,bytes:(await r.arrayBuffer()).byteLength})}
const hub=await (await fetchLive(ARTICLE.hub_url)).text();assert.equal((hub.match(/data-babylove-article="wegovy-cost-uk"/g)||[]).length,1);
const sitemap=await (await fetchLive('https://shiftsometimber.co.uk/sitemap.xml')).text();assert.equal(sitemap.split('<loc>'+ARTICLE.proposed_url+'</loc>').length-1,1);
const proof={ok:true,url:ARTICLE.proposed_url,checkedAt:new Date().toISOString(),author:schema.author.name,publishedAt:schema.datePublished,images,knowledgeListing:true,sitemap:true,indexable:true,htmlSha256:createHash('sha256').update(html).digest('hex')};
writeFileSync('babylove-live-proof.json',JSON.stringify(proof,null,2)+'\n');console.log(JSON.stringify(proof,null,2));
