import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import * as shell from '../aeo-geo-proof/shell.mjs';
import {catalogue} from '../aeo-geo-proof/data.mjs';
import {detail,indexPage} from './content.mjs';
import {catalogueSitemap} from './delivery.mjs';
const data=await catalogue();assert.deepEqual(data,JSON.parse(readFileSync('aeo-geo-proof/public-catalogue.json')));
let schemas=0,withoutPhoto=0,bytes=0;const urls=new Set(),missing=[];
for(const kind of ['recipes','exercises']){
 for(const item of data[kind]){
  assert(!urls.has(item.path),'Duplicate public canonical');urls.add(item.path);
  const {html,status}=detail(item,kind,data,shell);assert.equal(status,200);bytes+=Buffer.byteLength(html);
  assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.equal((html.match(/rel="canonical"/g)||[]).length,1);
  assert(html.includes('href="https://shiftsometimber.co.uk'+item.path+'"'));assert(!/<img\b(?![^>]*\balt=)/i.test(html));
  assert(!html.includes('reviewedBy'));assert(!html.includes('"aggregateRating"'));assert(!html.includes('data_json'));assert(!html.includes('review_json'));
  const nodes=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1]));schemas+=nodes.length;
  const entity=nodes[0]['@graph'].find(n=>n['@type']===(kind==='recipes'?'Recipe':'HowTo'));assert(entity);assert.equal(entity.name,item.title);
  if(kind==='recipes'){assert.deepEqual(entity.recipeIngredient,item.ingredients);assert.equal(entity.recipeInstructions.length,item.method.length);if(!item.image)withoutPhoto++;}
  else assert.equal(entity.step.length,item.steps.length);
 }
 const {html}=indexPage(kind,data,shell,new URL('https://shiftsometimber.co.uk/'+kind));assert(html.includes('rel="next"'));assert(!html.includes('noindex,follow'));
 const xml=catalogueSitemap(data[kind],data.publishedAt);assert.equal((xml.match(/<loc>/g)||[]).length,data[kind].length);
}
const report={at:new Date().toISOString(),documents:data.recipes.length+data.exercises.length,validJsonLdDocuments:schemas,uniqueCanonicalUrls:urls.size,recipesMissingApprovedPhotos:withoutPhoto,recipeRichResultsEligible:withoutPhoto===0,independentClinicalReviewClaimed:false,averageHtmlBytes:Math.round(bytes/urls.size),allKeyContentServerRendered:true,accountOrMemberRecordsIncluded:false};
writeFileSync('aeo-geo-proof/document-qualification.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
