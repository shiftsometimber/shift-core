import {HOME_HEADER_NAV_CSS} from './home-header-baseline-20261024.mjs';
import {CURRENT_HOME_MAIN} from './home-current-main-private-20261018.mjs';
import {HOME_V42_CSS} from './home-v42-critical.mjs';
import {HOME_BLOCKING_STYLES} from './home-blocking-styles.mjs';
import {RETA_STYLES} from './reta-styles-data.mjs';
import {HOME_BASE_MAIN,HOME_RECOVERY_CSS} from './home-critical-styles.mjs';
// Same complete CSS at the same cascade position; no delayed styles or script changes.
export function repairHomeSpeed(html,path,{final=false}={}){
 if(path!=='/'||!html.includes('home-hero'))return html;
 const main=html.match(/<main\b[\s\S]*?<\/main>/)?.[0];
 const fullStyles=[...html.matchAll(/<style\b([^>]*)>([\s\S]*?)<\/style>/g)];
 const current=main===CURRENT_HOME_MAIN&&[
  ['/assets/v42h.css?v=42p6',HOME_BLOCKING_STYLES['/assets/v42h.css?v=42p6']],
  ['/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2',RETA_STYLES['/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2']]
 ].every(([path,css])=>{const rows=fullStyles.filter(row=>row[1].includes('data-home-inline-css="'+path+'"'));return rows.length===1&&rows[0][2]===css.replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'));});
 const known=main===HOME_BASE_MAIN||current;
 if(known)html=html.replace(/(<style\b[^>]*data-home-inline-css="\/assets\/header-navigation-v2.css"[^>]*>)([\s\S]*?)(<\/style>)/, (tag,a,css,b)=>[RETA_STYLES['/assets/header-navigation-v2.css'],HOME_HEADER_NAV_CSS].includes(css)?a+HOME_HEADER_NAV_CSS+b:tag);
 if(known)html=html.replace(/(<style\b[^>]*data-home-inline-css="\/assets\/v42h.css\?v=42p6"[^>]*>)([\s\S]*?)(<\/style>)/, (tag,a,css,b)=>[HOME_BLOCKING_STYLES['/assets/v42h.css?v=42p6'].replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;')),HOME_V42_CSS].includes(css)?a+HOME_V42_CSS+b:tag);
 if(known)html=html.replace(/(<style\b[^>]*data-home-inline-css="\/assets\/shift-recovery-v6.css[^>]*>)[\s\S]*?(<\/style>)/,(_,a,b)=>a+HOME_RECOVERY_CSS+b);
 return html.replace(/<link\b[^>]*>/gi,tag=>{
  if(!/rel=["']stylesheet["']/i.test(tag))return tag;
  const href=tag.match(/href=["']([^"']+)["']/i)?.[1],css=known&&href==='/assets/shift-recovery-v6.css?v=cos-live-recovery-20260909-r2'?HOME_RECOVERY_CSS:(known&&href==='/assets/v42h.css?v=42p6'?HOME_V42_CSS:(known&&href==='/assets/header-navigation-v2.css'?HOME_HEADER_NAV_CSS:(HOME_BLOCKING_STYLES[href]||RETA_STYLES[href])));
  if(!css||(!final&&href==='/assets/my-timber-pwa.css'))return tag;
  const attrs=tag.replace(/^<link\b/i,'').replace(/\/?\s*>$/,'').replace(/\s(?:href|rel)=["'][^"']*["']/gi,'');
  return '<style'+attrs+' data-home-inline-css="'+href+'">'+css.replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'))+'</style>';
 });
}
