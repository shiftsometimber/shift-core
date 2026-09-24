import {RETA_STYLES} from './reta-styles-data.mjs';
import {RETA_IMAGE} from './reta-editorial-asset.mjs';
export const RETA_PATH='/guides/retatrutide-uk-guide';
const origin='https://shiftsometimber.co.uk';
export const RETA_IMAGE_ALT='Original research illustration: an open notebook and magnifying glass';
const figure='<figure data-reta-editorial-image style="margin:0 0 28px"><img src="'+RETA_IMAGE.path+'" alt="'+RETA_IMAGE_ALT+'" width="1200" height="800" loading="lazy" decoding="async" style="display:block;width:100%;height:auto;aspect-ratio:3/2;border-radius:10px"><figcaption style="font-size:14px;line-height:1.5;margin-top:8px">Research explained. Original SHIFT illustration; not a medicine or product image.</figcaption></figure>';
function metadata(html,key,value){
 const re=new RegExp('<meta\\b(?=[^>]*\\b(?:name|property)=["\\\']'+key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'["\\\'])[^>]*>','gi');
 const tag='<meta '+(key.startsWith('og:')?'property':'name')+'="'+key+'" content="'+value+'">';
 return re.test(html)?html.replace(re,()=>tag):html.replace('</head>',()=>tag+'</head>');
}
export function repairRetaPresentation(html,path){
 if(path.replace(/\/+$/,'')!==RETA_PATH||!html.includes('data-reta-guide='))return html;
 html=html.replace(/<script\b(?=[^>]*\btype=["']application\/ld\+json["'])[^>]*>([\s\S]*?)<\/script>/gi,(tag,raw)=>{
  let obj;try{obj=JSON.parse(raw)}catch{return tag}
  if(!['Article','MedicalWebPage'].includes(obj['@type']))return tag;
  // Both inherited publication dates conflict and lack verifiable provenance.
  // Preserve the evidenced substantive revision date; do not invent a launch date.
  delete obj.datePublished;
  obj.image={ '@type':'ImageObject',url:origin+RETA_IMAGE.path,width:1200,height:800,caption:RETA_IMAGE_ALT };
  return tag.slice(0,tag.indexOf('>')+1)+JSON.stringify(obj).replaceAll('</','<\\/')+'</script>';
 });
 for(const key of ['og:image','twitter:image'])html=metadata(html,key,origin+RETA_IMAGE.path);
 for(const key of ['og:image:alt','twitter:image:alt'])html=metadata(html,key,RETA_IMAGE_ALT);
 html=metadata(html,'og:image:width','1200');html=metadata(html,'og:image:height','800');html=metadata(html,'og:image:type','image/webp');
 if(!html.includes('data-reta-editorial-image'))html=html.replace('<div class="reta-body">',()=>'<div class="reta-body">'+figure);
 // Inline the exact existing styles at their original cascade positions. No
 // selector pruning, delayed styles, rewritten URLs or consent-script changes.
 html=html.replace(/<link\b[^>]*>/gi,tag=>{
  if(!/rel=["']stylesheet["']/i.test(tag))return tag;
  const href=tag.match(/href=["']([^"']+)["']/i)?.[1],css=RETA_STYLES[href];
  if(!css)return tag;
  const attrs=tag.replace(/^<link\b/i,'').replace(/\/?\s*>$/,'').replace(/\s(?:href|rel)=["'][^"']*["']/gi,'');
  return '<style'+attrs+' data-reta-inline-css="'+href+'">'+css.replace(/\/\*[\s\S]*?\*\//g,comment=>comment.replaceAll('<','&lt;'))+'</style>';
 });
 return html;
}
