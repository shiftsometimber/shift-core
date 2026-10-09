import assert from 'node:assert/strict';import {pillarFooter,pillarChromeStyle} from './candidate.mjs';
import {applyPillarMetadata} from './candidate.mjs';
import {candidate} from './content.mjs';
import {RANKING_GROWTH_PAGES} from '../public-seo-growth-data.mjs';
// Invert only the exact approved mood addition and metadata. The older article
// proof then continues to compare every original paragraph, source and care link.
export function preservePillarMood(path,input){
 if(path!=='/mental-health/mental-health-and-weight'||!input.includes('data-weight-understanding-addition'))return input;
 let html=input;
 const block='<section id="awareness-first-step" class="shift-understanding" data-weight-understanding-addition>'+candidate.moodAddition+'</section>';
 assert.equal(html.split(block).length,2,'Exact approved mood support addition required');
 html=html.replace(block,'');
 const pairs=RANKING_GROWTH_PAGES[path].replacements.filter(x=>x.kind!=='body');
 const expected=applyPillarMetadata('<html><head>'+pairs.map(x=>x.after).join('')+'</head><main></main></html>',path);
 for(const pair of pairs){
  let tag;
  if(pair.kind==='title')tag=expected.match(/<title>[\s\S]*?<\/title>/)[0];
  else if(pair.kind==='article-schema')tag=expected.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/)[0];
  else {const key=pair.kind.slice('metadata:'.length);tag=[...expected.matchAll(/<meta\b[^>]*>/g)].map(x=>x[0]).find(x=>x.includes('="'+key+'"'));}
  assert.ok(tag,'Known mood metadata pair required: '+pair.kind);
  assert.equal(html.split(tag).length,2,'Exact approved mood metadata required: '+pair.kind);
  html=html.replace(tag,pair.after);
 }
 return html;
}
export function preservePillarChrome(path,input){let h=input.toString('utf8');if(h.includes('data-male-obesity-footer')){assert.equal(h.split(pillarFooter).length,2,'Exact approved pillar footer required');h=h.replace(pillarFooter,'');}const link='<a href="/male-obesity">Male obesity</a>';h=h.replace(/(<aside\b[^>]*id=["']site-drawer["'][^>]*>)([\s\S]*?)(<\/aside>)/i,(all,open,body,close)=>open+body.replace(link,'')+close);if(h.includes('data-pillar-chrome')){assert.equal(h.split(pillarChromeStyle).length,2,'Exact pillar chrome styles required');h=h.replace(pillarChromeStyle,'');}return Buffer.from(h);}
