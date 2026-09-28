// Preview-only transformations of freshly captured public HTML. No production import.
import {improveContinuityEntry,continuityReviewPaths} from './continuity-journey.mjs';
const style=`<style data-growth-copy>.growth-week{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:24px 0}.growth-week article{border:1px solid #707762;padding:20px;border-radius:12px;background:#050505;color:#e7e3da}.growth-week h3{font-size:1.2rem;line-height:1.3;color:#e7e3da}.growth-week p,.growth-promise p{font-size:1rem;line-height:1.65}.growth-week article a,.growth-promise a{color:#e7e3da!important;text-decoration:underline!important;text-underline-offset:3px}.growth-promise{margin:24px 0;padding:24px;border:1px solid #707762;border-radius:12px;background:#050505;color:#e7e3da}.growth-promise h2{color:#e7e3da}.growth-week a:focus-visible,.growth-promise a:focus-visible{outline:3px solid #e7e3da;outline-offset:4px}@media(max-width:700px){.growth-week{grid-template-columns:1fr}}</style>`;
const week=`<p class="eyebrow">YOUR FIRST WEEK</p><h2>One useful step. A week that feels more manageable.</h2><p>You do not need a new personality by Monday. Pick the part of your week that needs a hand, try one step and come back to say whether it helped.</p><div class="growth-week" data-growth-week><article><h3>Make one meal easier</h3><p>Open Grub in My Timber and choose a meal that fits your time and budget. Start with one dinner, not a complete kitchen overhaul.</p><a href="/member/grub">Choose a meal in Grub</a></article><article><h3>Make room for movement</h3><p>Use Fit to find an option that suits your time, available kit and saved limitations. Choose something manageable for your week.</p><a href="/member/fit">Find an option in Fit</a></article><article><h3>Keep what helps</h3><p>Return to your Next Shift and tell us whether it fitted your week. A difficult week is information, not a reason to start everything again.</p><a href="/member/dashboard#today">Open my Next Shift</a></article></div><p>This is an example, not a personalised plan or a checklist you must finish. Start with one thing. My Timber is free; you do not need to buy treatment to use it.</p>`;
const promise=`<section class="growth-promise" data-growth-promise><h2>What you get from SHIFT</h2><p><strong>Free My Timber:</strong> your practical place for food, movement, goals and check-ins. Choose what helps, keep your saved progress and return to your next step.</p><p><strong>Treatments:</strong> prices and availability are shown on the treatment pages. No stock available today. Using My Timber does not require a treatment purchase or a change of provider.</p><p><strong>Help finding your way:</strong> use the contact routes below for account or website help. Ask Timber provides automated guidance; it is not a conversation with a clinician. For questions about your medicine, contact your prescriber or pharmacist.</p><p><a href="/programme">See what a first week could look like</a> · <a href="/member/dashboard">Open My Timber</a></p></section>`;
const goodToTalkAlignment=`<style data-good-to-talk-alignment>
main#main-content.template-mens-mental-health > .standard-layout{margin-inline:auto!important}
main#main-content.template-mens-mental-health .shift-guided-front__inner{margin-inline:auto!important;text-align:center}
main#main-content.template-mens-mental-health .shift-guided-front h1,
main#main-content.template-mens-mental-health .shift-guided-kicker,
main#main-content.template-mens-mental-health .shift-guided-intro{margin-inline:auto!important}
main#main-content.template-mens-mental-health .shift-guided-card{text-align:center;align-items:center}
main#main-content.template-mens-mental-health .shift-guided-actions{justify-content:center}
main#main-content.template-mens-mental-health .shift-guided-alert{justify-content:center;flex-wrap:wrap;text-align:center}
</style>`;
export const copyChanges=[{path:'/programme',purpose:'Replace abstract model paragraph with a useful first-week example; preserve existing tools and navigation.'},{path:'/help',purpose:'Explain the free member offer, stock position and existing help routes without inventing response times.'},{path:'/mens-mental-health',purpose:'Centre the Good to Talk opening layout, heading, introduction and choices; preserve all content, links and shell.'}];
export function improvePublicCopy(html,path){
 if(continuityReviewPaths.includes(path))return improveContinuityEntry(html,path);
 if(path==='/mens-mental-health'){
  if(html.includes('data-good-to-talk-alignment'))return html;
  if(!html.includes('template-mens-mental-health')||!html.includes('</head>'))throw Error('Good to Talk baseline changed: inspect before editing');
  return html.replace('</head>',goodToTalkAlignment+'</head>');
 }
 if(html.includes('data-growth-copy'))return html;
 if(path==='/programme'){
  const before='<p class="eyebrow">THE MODEL</p><h2>Weight is the front door. Getting your life back is the journey.</h2><p>Use what helps now. Keep the useful parts connected as your needs change.</p>';
  if(html.split(before).length!==2)throw Error('Programme baseline changed: inspect before editing');
  return html.replace(before,week).replace('</head>',style+'</head>');
 }
 if(path==='/help'){
  const marker='Choose the route that best matches what you need. We keep help straightforward and private.';
  const expression=/<p\b[^>]*>Choose the route that best matches what you need\. We keep help straightforward and private\.<\/p>/;
  if(!html.includes(marker)||!expression.test(html))throw Error('Help baseline changed: inspect before editing');
  return html.replace(expression,m=>m+promise).replace('</head>',style+'</head>');
 }
 return html;
}
copyChanges.push(...continuityReviewPaths.map(path=>({path,purpose:'Give Continuity a direct free Today entrance and explain retained non-clinical support without prescription transfer.'})));
