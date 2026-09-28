import {HOME_BLOCKING_STYLES} from './home-blocking-styles.mjs';
import {RETA_STYLES} from './reta-styles-data.mjs';
import {HOME_BASE_MAIN,HOME_RECOVERY_CSS} from './home-critical-styles.mjs';
export const HOME_HERO_BEFORE=HOME_BASE_MAIN.match(/<img\b[^>]*src="[^"]*hero[^"]*"[^>]*>/i)?.[0];
export const HOME_HERO_AFTER=HOME_HERO_BEFORE?.replace('decoding="async"','decoding="sync"');
const attr=name=>HOME_HERO_BEFORE?.match(new RegExp(' '+name+'="([^"]*)"'))?.[1];
export const HOME_HERO_PRELOAD='<link rel="preload" as="image" href="'+attr('src')+'" imagesrcset="'+attr('srcset')+'" imagesizes="'+attr('sizes')+'" fetchpriority="high" data-home-hero-preload>';
// Same complete CSS at the same cascade position; no delayed styles or script changes.
export function repairHomeSpeed(html,path,{final=false}={}){
 if(path!=='/'||!html.includes('home-hero'))return html;
 const known=html.match(/<main\b[\s\S]*?<\/main>/)?.[0]===HOME_BASE_MAIN;
 if(known)html=html.replace(/(<style\b[^>]*data-home-inline-css="\/assets\/shift-recovery-v6.css[^>]*>)[\s\S]*?(<\/style>)/,(_,a,b)=>a+HOME_RECOVERY_CSS+b);
 html=html.replace(/<link\b[^>]*>/gi,tag=>{
  if(!/rel=["']stylesheet["']/i.test(tag))return tag;
  const href=tag.match(/href=["']([^"']+)["']/i)?.[1],css=known&&href==='/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2'?HOME_RECOVERY_CSS:(HOME_BLOCKING_STYLES[href]||RETA_STYLES[href]);
  if(!css||(!final&&href==='/assets/my-timber-pwa.css'))return tag;
  const attrs=tag.replace(/^<link\b/i,'').replace(/\/?\s*>$/,'').replace(/\s(?:href|rel)=["'][^"']*["']/gi,'');
  return '<style'+attrs+' data-home-inline-css="'+href+'">'+css.replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'))+'</style>';
 });
 if(final&&HOME_HERO_BEFORE&&html.includes(HOME_HERO_BEFORE)){
  html=html.replace(HOME_HERO_BEFORE,HOME_HERO_AFTER);
  if(!html.includes('data-home-hero-preload'))html=html.replace(/<head\b[^>]*>/,m=>m+HOME_HERO_PRELOAD);
 }
 return html;
}
