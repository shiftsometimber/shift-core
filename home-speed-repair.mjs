import {HOME_BLOCKING_STYLES} from './home-blocking-styles.mjs';
import {RETA_STYLES} from './reta-styles-data.mjs';
import {HOME_BASE_MAIN,HOME_RECOVERY_CSS} from './home-critical-styles.mjs';
// Same complete CSS at the same cascade position; no delayed styles or script changes.
export function repairHomeSpeed(html,path){
 if(path!=='/'||!html.includes('home-hero'))return html;
 const known=html.match(/<main\b[\s\S]*?<\/main>/)?.[0]===HOME_BASE_MAIN;
 if(known)html=html.replace(/(<style\b[^>]*data-home-inline-css="\/assets\/shift-recovery-v6.css[^>]*>)[\s\S]*?(<\/style>)/,(_,a,b)=>a+HOME_RECOVERY_CSS+b);
 return html.replace(/<link\b[^>]*>/gi,tag=>{
  if(!/rel=["']stylesheet["']/i.test(tag))return tag;
  const href=tag.match(/href=["']([^"']+)["']/i)?.[1],css=known&&href==='/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2'?HOME_RECOVERY_CSS:(HOME_BLOCKING_STYLES[href]||RETA_STYLES[href]);
  if(!css)return tag;
  const attrs=tag.replace(/^<link\b/i,'').replace(/\/?\s*>$/,'').replace(/\s(?:href|rel)=["'][^"']*["']/gi,'');
  return '<style'+attrs+' data-home-inline-css="'+href+'">'+css.replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'))+'</style>';
 });
}
