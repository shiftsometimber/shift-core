import {improvePublicCopy} from './preview/growth-member/public-copy.mjs';
// Owner approved the Programme day demonstration on 8 October 2026.
export const PROGRAMME_DAY_ASSETS=Object.freeze({
 food:{id:'industrial-dinner-chicken-traybake',src:'/assets/member-experience/food/catalogue-chicken-traybake.webp'},
 fit:{group:'walk',src:'/fit-v3-images/walk.png'}
});
export const programmeDayStyle=`<style data-programme-day-style>
.programme-day{margin:24px 0}.programme-day .pd-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:24px 0}
.programme-day .pd-card{padding:24px;border:1px solid #707762;border-radius:12px;background:#050505;color:#e7e3da;display:flex;flex-direction:column;min-width:0;overflow:hidden}
.programme-day .pd-card h3{color:#e7e3da;font-size:1.35rem;line-height:1.2;margin:8px 0 16px}.programme-day .pd-card p{font-size:1rem;line-height:1.6}
.programme-day .pd-card small{color:#e7e3da;letter-spacing:.12em;font-weight:700}.programme-day .pd-card a{color:#e7e3da!important;text-decoration:underline!important;text-underline-offset:4px}
.programme-day .pd-image{display:block;width:100%;height:auto;aspect-ratio:4/3;object-fit:cover;border-radius:8px;margin:0 0 16px}
.programme-day .pd-image.pd-walk{object-fit:contain;background:#e7e3da}
.programme-day .pd-card .pd-choices{display:flex!important;flex-wrap:wrap;align-items:flex-start;align-content:flex-start!important;justify-content:flex-start!important;flex:0 0 auto!important;height:auto!important;gap:10px;margin:12px 0 20px;padding:0!important;background:transparent!important;border:0!important;min-height:0!important}.programme-day .pd-card .pd-choices a{display:block!important;flex:0 0 auto;align-self:flex-start;margin:0!important;height:auto!important;min-height:0!important;color:#e7e3da!important;background:transparent!important;border:1px solid #707762;border-radius:24px;padding:10px 16px}
.programme-day .pd-card .pd-link{margin-top:auto;padding-top:12px;font-weight:700}
.programme-day .pd-invite{background:#707762;color:#050505;border-radius:12px;padding:28px;margin:24px 0}
.programme-day .pd-invite h3{color:#050505;font-size:1.65rem;line-height:1.2;margin:0 0 14px}
.programme-day .pd-invite,.programme-day .pd-invite h3,.programme-day .pd-invite p,.programme-day .pd-invite a{color:#050505!important}.programme-day .pd-invite .pd-start{display:inline-block;background:#e7e3da;border:1px solid #050505;border-radius:8px;padding:12px 24px;font-weight:700;text-decoration:none!important}
.programme-day a:focus-visible{outline:3px solid currentColor;outline-offset:4px}
.programme-day .pd-note{font-size:.95rem;line-height:1.6}
@media(max-width:800px){.programme-day .pd-grid{grid-template-columns:1fr}.programme-day .pd-card{padding:20px}.programme-day .pd-image{max-height:320px}.programme-day .pd-invite{padding:22px}}
</style>`;
export const programmeDayContent=`<div class="programme-day" data-programme-day="20261008">
<p class="eyebrow">A DAY IN MY TIMBER</p><h2>A useful day in My Timber.</h2><p>Start with the bit of today that needs a hand.</p>
<div class="pd-grid growth-week" data-growth-week>
<article class="pd-card"><small>TODAY</small><h3>What would make today a little easier?</h3><p>Choose a place to start. One useful step is enough.</p><div class="pd-choices"><a href="/member/grub">Food</a><a href="/member/fit">Movement</a><a href="/member/dashboard#today">Getting back on track</a></div><p>Try a step that fits your day. Come back to your Next Shift and say whether it helped.</p><a class="pd-link" href="/member/dashboard#today">Open my Next Shift →</a></article>
<article class="pd-card"><small>GRUB</small><h3>Sort tonight’s tea.</h3><img class="pd-image" src="/assets/member-experience/food/catalogue-chicken-traybake.webp" width="1448" height="1086" alt="Chicken traybake with roast potatoes, broccoli and peppers from the Grub catalogue" loading="lazy" decoding="async"><p><strong>Chicken traybake</strong><br>A proper meal from the Grub catalogue. Find a recipe that fits your time and budget.</p><a class="pd-link" href="/member/grub">Choose a meal in Grub →</a></article>
<article class="pd-card"><small>FIT</small><h3>Make room for movement.</h3><img class="pd-image pd-walk" src="/fit-v3-images/walk.png" width="1280" height="720" alt="The Fit catalogue’s three-panel Easy walk demonstration" loading="lazy" decoding="async"><p><strong>Easy walk</strong><br>A gentle starting option when walking feels comfortable today. Fit has options for your time, kit and saved limitations.</p><a class="pd-link" href="/member/fit">Find an option in Fit →</a></article>
</div>
<aside class="pd-invite"><h3>Your treatment can be elsewhere.<br>Your support can be here.</h3><p>Free whether you buy treatment from SHIFT, use another provider or aren’t taking medication.</p><a class="pd-start" href="/member/dashboard">Start free →</a><p>No treatment purchase needed. Already a member? <a href="/member/dashboard">Open My Timber</a>.</p></aside>
<p class="pd-note">This is an example, not a personalised plan or a checklist you must finish. Start with one thing. My Timber is free; you do not need to buy treatment to use it. My Timber provides practical support. Your prescriber handles medicine decisions.</p></div>`;
const block=/<p class="eyebrow">YOUR FIRST WEEK<\/p>[\s\S]*?<p>This is an example, not a personalised plan or a checklist you must finish\. Start with one thing\. My Timber is free; you do not need to buy treatment to use it\.<\/p>/;
export function improveProgrammeDay(html,path){
 if(path!=='/programme'||html.includes('data-programme-day='))return html;
 const matches=html.match(new RegExp(block.source,'g'));
 if(matches?.length!==1)throw Error('Programme first-week source changed; review before replacement');
 if(!html.includes('</head>'))throw Error('Programme head missing');
 return html.replace(block,programmeDayContent).replace('</head>',programmeDayStyle+'</head>');
}
export async function withProgrammeDay(request,response){
 if(request.method!=='GET'||new URL(request.url).pathname!=='/programme'||response.status!==200||!(response.headers.get('content-type')||'').includes('text/html'))return response;
 const before=await response.text();let after;try{after=improveProgrammeDay(before,'/programme')}catch{after=before}
 if(after===before)return new Response(before,{status:response.status,statusText:response.statusText,headers:response.headers});
 const headers=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 if(after!==before)headers.set('X-Shift-Programme-Day','20261008');return new Response(after,{status:response.status,statusText:response.statusText,headers});
}

const previousModel='<p class="eyebrow">THE MODEL</p><h2>Weight is the front door. Getting your life back is the journey.</h2><p>Use what helps now. Keep the useful parts connected as your needs change.</p>';
const previousWeek=improvePublicCopy('<html><head></head><main>'+previousModel+'</main></html>','/programme').match(/<main>([\s\S]*?)<\/main>/)[1];
export function restoreProgrammeDay(html){
 if(!html.includes('data-programme-day='))return html;
 if(html.split(programmeDayContent).length!==2||html.split(programmeDayStyle).length!==2)throw Error('Programme day copy or style drift');
 return html.replace(programmeDayContent,previousWeek).replace(programmeDayStyle,'');
}
