import assert from 'node:assert/strict';
import {repairSeoPresentation} from '../public-seo-presentation.mjs';
import {tickerStyles} from '../public-navigation-policy.mjs';
const oldTicker=tickerStyles.replace('background:#050505!important;color:#E7E3DA!important;border-block:1px solid #707762!important','background:#707762;color:#050505;border-block:1px solid #050505').replace('color:#E7E3DA!important;-webkit-text-fill-color:#E7E3DA!important;text-decoration:none','color:#050505;text-decoration:none').replace('outline:2px solid #E7E3DA;outline-offset:3px','outline:2px solid #050505;outline-offset:3px');
// Forward-normalise only the exact owner-approved presentation delta. Keep all
// remaining page bytes in the existing full-response preservation comparison.
export function preserveSeo794(path,input,{required=false}={}){
 let html=input.toString('utf8');if(!/<html\b/i.test(html)||!/<main\b/i.test(html))return input;
 const sample=repairSeoPresentation('<html><head></head><body><main></main></body></html>',path);
 const style=sample.match(/<style data-seo-contrast-20260923>[\s\S]*?<\/style>/)?.[0];
 if(!style)return input;
 if(required){assert.equal(html.split(style).length-1,1,path+': exact approved contrast stylesheet absent');assert.equal(repairSeoPresentation(html,path),html,path+': image optimisation missing');}
 // Put this exact style in one comparison position; subsequent PWA transforms
 // may append styles after the production shell step.
 html=html.replace(style,'');html=repairSeoPresentation(html,path);
 const old='<style data-shift-public-news>'+oldTicker+'</style>',current='<style data-shift-public-news>'+tickerStyles+'</style>';
 if(required&&html.includes('id="shift-public-news"'))assert.equal(html.split(current).length-1,1,path+': exact approved ticker contrast absent');
 html=html.replace(old,current);
 if(html.includes(current))html=html.replace(current,'').replace('</head>',current+'</head>');
 const hidden='<style data-shift-public-news>.medicine-ticker-v138{display:none!important}</style>';
 if(html.includes(hidden))html=html.replace(hidden,'').replace('</head>',hidden+'</head>');
 for(const oldPath of ['/good-to-talk','/good-to-talk.html','/good-to-talk/'])html=html.replaceAll('href="'+oldPath+'"','href="/mens-mental-health"');
 if(path==='/shift-health'){
  const oldTitle='SHIFT Health | Wider Men’s Health',title='Men’s Health: Energy, Sleep &amp; Wellbeing | SHIFT Health';
  if(required){assert(html.includes('<h1>SHIFT Health: what would you like to sort?</h1>'));assert(html.includes('<title>'+title+'</title>'));}
  html=html.replace('<h1>What would you like to sort?</h1>','<h1>SHIFT Health: what would you like to sort?</h1>');
  html=html.replace('<title>'+oldTitle+'</title>','<title>'+title+'</title>').replaceAll('content="'+oldTitle+'"','content="'+title+'"');
  html=html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,tag=>tag.replaceAll(oldTitle,title.replaceAll('&amp;','&')));
 }
 return Buffer.from(html);
}
