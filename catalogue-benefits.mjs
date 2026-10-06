export const countsCss='<style id="sst-banner-counts-css">html body main#main-content #sst-home-route .sst-free-designed .sst-free-features{margin-bottom:24px!important}html body main#main-content #sst-home-route .sst-free-designed p.sst-free-promise{font-size:17px!important;padding:6px 20px 7px!important}@media(max-width:900px){html body main#main-content #sst-home-route .sst-free-designed .sst-free-features{margin-bottom:24px!important}html body main#main-content #sst-home-route .sst-free-designed p.sst-free-promise{font-size:16px!important;padding:7px 14px!important}}</style>';
export function addCatalogueCounts(html){
 const food='<p>Simple, proper<br>meals for real life.</p>',movement='<p>Doable workouts<br>to feel better.</p>';
 if(html.split(food).length!==2||html.split(movement).length!==2||html.split('</head>').length!==2)throw Error('Existing banner text does not match');
 return html.replace(food,'<p>Over 2,500 recipes.<br>Simple, proper meals<br>for real life.</p>').replace(movement,'<p>Over 2,500 exercise<br>variations. Doable<br><span style="white-space:nowrap">workouts to feel</span><br>better.</p>').replace('</head>',countsCss+'</head>');
}
export function removeCatalogueCounts(html){return html.replace('<p>Over 2,500 recipes.<br>Simple, proper meals<br>for real life.</p>','<p>Simple, proper<br>meals for real life.</p>').replace('<p>Over 2,500 exercise<br>variations. Doable<br><span style="white-space:nowrap">workouts to feel</span><br>better.</p>','<p>Doable workouts<br>to feel better.</p>').replace(countsCss,'');}

import {NUTRITION_PATHS} from './public-nutrition-mytimber.mjs';
export const BENEFIT_PATHS=new Set(['/programme','/member-login','/help','/app',...NUTRITION_PATHS,'/guides/exercise-walking-strength-mobility','/articles/glp-1-and-exercise','/articles/walking-for-weight-loss-men']);
export const benefitsSection='<section data-mytimber-catalogue-benefits="20261006" aria-labelledby="sst-catalogue-benefits-title" style="max-width:1100px;margin:24px auto;padding:20px;box-sizing:border-box;border:1px solid #707762;border-radius:12px;background:#E7E3DA;color:#050505"><h2 id="sst-catalogue-benefits-title" style="color:#050505">More choice, free in My Timber</h2><p style="color:#050505"><a href="/member/grub" style="color:#050505"><strong>Grub: over 2,500 recipes</strong></a> for simple, proper meals. <a href="/member/fit" style="color:#050505"><strong>Fit: over 2,500 exercise variations</strong></a> across 300 illustrated exercises, with options for different levels, equipment and time available.</p><p style="color:#050505">Food, movement, check-ins and progress — all in one place. No purchase needed.</p><a href="/member/dashboard" style="color:#050505;font-weight:700">Explore free My Timber &rarr;</a></section>';
export function catalogueBenefitsHtml(html,path){
 if(path==='/'){
  if(html.includes('id="sst-banner-counts-css"'))return html;
  try{return addCatalogueCounts(html)}catch{return html}
 }
 if(!BENEFIT_PATHS.has(path)||html.includes('data-mytimber-catalogue-benefits="20261006"'))return html;
 if(!/<main\b/i.test(html)||!/<\/main\s*>/i.test(html))return html;
 return html.replace(/<\/main\s*>/i,benefitsSection+'$&');
}
export function removeCatalogueBenefits(html,path){return path==='/'?removeCatalogueCounts(html):html.replace(benefitsSection,'');}
export async function withCatalogueBenefits(request,response){
 const path=new URL(request.url).pathname.replace(/\.html$/,'').replace(/\/+$/,'')||'/';
 if(request.method!=='GET'||response.status!==200||!response.headers.get('content-type')?.includes('text/html')||path!=='/'&&!BENEFIT_PATHS.has(path))return response;
 const before=await response.text(),after=catalogueBenefitsHtml(before,path),headers=new Headers(response.headers);
 if(before!==after){for(const key of ['content-length','content-encoding','etag','last-modified'])headers.delete(key);headers.set('X-Shift-Catalogue-Benefits','20261006');}
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
