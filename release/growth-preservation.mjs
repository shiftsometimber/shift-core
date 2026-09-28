import {continuityPages} from '../public-continuity.mjs';
import assert from 'node:assert/strict';
import {improvePublicCopy} from '../preview/growth-member/public-copy.mjs';
const original={
 '/programme':'<p class="eyebrow">THE MODEL</p><h2>Weight is the front door. Getting your life back is the journey.</h2><p>Use what helps now. Keep the useful parts connected as your needs change.</p>',
 '/help':'<p>Choose the route that best matches what you need. We keep help straightforward and private.</p>'
};
const sample=path=>improvePublicCopy('<html><head></head><body><main>'+original[path]+'</main></body></html>',path);
export function preserveGrowthCopy(path,input,{required=false}={}){
 if(['/mens-mental-health','/clinic-gone-quiet','/provider-switch'].includes(path)){
  let html=input.toString('utf8');
  const talk=path==='/mens-mental-health',marker=talk?'data-good-to-talk-alignment':'data-growth-continuity';
  if(!html.includes(marker)){assert(!required,path+': approved addition absent');return input;}
  const baseline=talk?'<html><head></head><main class="template-mens-mental-health"></main></html>':'<html><head></head><main>'+continuityPages[path].body+'</main></html>';
  const expected=improvePublicCopy(baseline,path);
  if(talk){const style=expected.match(/<style data-good-to-talk-alignment>[\s\S]*?<\/style>/)[0];assert.equal(html.split(style).length,2,'Alignment stylesheet drift');html=html.replace(style,'');}
  else{
   const addition=expected.match(/<section data-growth-continuity[\s\S]*?<\/section>/)[0];
   const cta=expected.match(/<a class="continuity-button" data-continuity-primary[^>]*>[\s\S]*?<\/a>/)[0];
   const previous=continuityPages[path].body.match(/<a class="continuity-button" href="\/start-here">[\s\S]*?<\/a>/)[0];
   assert.equal(html.split(addition).length,2,'Continuity explanation drift');assert.equal(html.split(cta).length,2,'Continuity CTA drift');
   html=html.replace(addition,'').replace(cta,previous);
  }
  return Buffer.from(html);
 }
 if(!original[path])return input;
 let html=input.toString('utf8');
 const expected=sample(path),style=expected.match(/<style data-growth-copy>[\s\S]*?<\/style>/)[0];
 const body=expected.match(/<main>([\s\S]*?)<\/main>/)[1];
 const addition=path==='/help'?body.slice(original[path].length):body;
 if(!html.includes('data-growth-copy')){assert(!required,path+': reviewed growth copy absent');return input;}
 assert.equal(html.split(style).length-1,1,path+': changed growth stylesheet');
 assert.equal(html.split(addition).length-1,1,path+': changed growth copy');
 html=html.replace(style,'').replace(addition,path==='/help'?'':original[path]);
 return Buffer.from(html);
}
