import assert from 'node:assert/strict';
import {improvePublicCopy} from '../preview/growth-member/public-copy.mjs';
const original={
 '/programme':'<p class="eyebrow">THE MODEL</p><h2>Weight is the front door. Getting your life back is the journey.</h2><p>Use what helps now. Keep the useful parts connected as your needs change.</p>',
 '/help':'<p>Choose the route that best matches what you need. We keep help straightforward and private.</p>'
};
const sample=path=>improvePublicCopy('<html><head></head><body><main>'+original[path]+'</main></body></html>',path);
export function preserveGrowthCopy(path,input,{required=false}={}){
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
