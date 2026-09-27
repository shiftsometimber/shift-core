import {RETA_STYLES} from './reta-styles-data.mjs';
// Same complete CSS at the same cascade position; no delayed styles or script changes.
export function repairHomeSpeed(html,path){
 if(path!=='/'||!html.includes('home-hero'))return html;
 return html.replace(/<link\b[^>]*>/gi,tag=>{
  if(!/rel=["']stylesheet["']/i.test(tag))return tag;
  const href=tag.match(/href=["']([^"']+)["']/i)?.[1],css=RETA_STYLES[href];
  if(!css)return tag;
  const attrs=tag.replace(/^<link\b/i,'').replace(/\/?\s*>$/,'').replace(/\s(?:href|rel)=["'][^"']*["']/gi,'');
  return '<style'+attrs+' data-home-inline-css="'+href+'">'+css.replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'))+'</style>';
 });
}
