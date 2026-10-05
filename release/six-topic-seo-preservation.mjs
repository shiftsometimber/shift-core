import assert from 'node:assert/strict';
import {SIX_TOPIC_SEO,withSixTopicGuides} from '../public-seo-closeout.mjs';
// Compare the previous full document with exactly the reviewed additive transform.
// A later content change still alters the full-body hash and fails preservation.
export function preserveSixTopicSeo(path,input,{required=false}={}){
 if(!SIX_TOPIC_SEO[path])return input;
 const html=input.toString('utf8');
 if(required)assert(html.includes(`data-six-topic-seo="${path}"`),'Reviewed SEO section missing: '+path);
 return Buffer.from(withSixTopicGuides(html,path));
}
