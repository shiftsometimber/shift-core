// Scoped review candidate. No production entry point imports this module.
export const continuityToday='/member/dashboard?entry=continuity#today';
export const continuityReviewPaths=['/clinic-gone-quiet','/provider-switch'];
const intro=`<section data-growth-continuity aria-labelledby="continuity-now-title"><h2 id="continuity-now-title">Your prescription does not have to move.</h2><p>My Timber is free. You can use it alongside treatment from another provider, between providers or after treatment. You do not need to buy treatment from SHIFT.</p><div class="continuity-grid"><div><h3>Keep your starting point</h3><p>Use the same My Timber account for your saved Journey priorities, Life Back goals and check-ins. Changing provider is not a reason to create another account.</p></div><div><h3>Keep the practical help</h3><p>Grub, Fit and your Next Shift remain in My Timber. Pick one useful thing for today; you do not have to complete every tool.</p></div><div><h3>Keep a say in what happens next</h3><p>Tell us whether your offered step helped or did not fit. Your saved feedback helps shape the next practical suggestion.</p></div></div><p>Changing provider does not reset your My Timber account. Manage optional health tracking and your saved information in <a href="/member/settings">Settings</a>.</p><p>This is practical support, not a transfer of clinical records or a prescription. Your clinician remains responsible for medicine decisions.</p><div class="continuity-actions"><a class="continuity-button" href="${continuityToday}">Open Today in free My Timber →</a></div><p class="continuity-meta">Already a member? Sign in to the same account. New here? Create a free account, then choose your first useful step.</p></section>`;
export function improveContinuityEntry(html,path){
 if(!continuityReviewPaths.includes(path)||html.includes('data-growth-continuity'))return html;
 const old=path==='/clinic-gone-quiet'?'<a class="continuity-button" href="/start-here">Start with where you are →</a>':'<a class="continuity-button" href="/start-here">Tell SHIFT where you are now →</a>';
 if(html.split(old).length!==2||!html.includes('</main>'))throw Error('Continuity entry baseline changed: '+path);
 const next=html.replace(old,`<a class="continuity-button" data-continuity-primary href="${continuityToday}">Open Today in free My Timber →</a>`);
 // Insert immediately after the opening actions, before the established guidance.
 const marker='</div><section>';
 if(!next.includes(marker))throw Error('Continuity actions layout changed: '+path);
 return next.replace(marker,'</div>'+intro+'<section>');
}
const welcome=`<section id="continuityWelcome" aria-labelledby="continuity-welcome-title"><h2 id="continuity-welcome-title">Same you. Same My Timber.</h2><p>You do not need to switch prescriptions or restart your Journey. Pick up your next useful step below.</p><details><summary>New here, or looking for your records?</summary><p>Start with one <a href="/member/check-in">check-in</a>, or go straight to <a href="/member/grub">Grub</a> or <a href="/member/fit">Fit</a>. Optional health tracking asks for your consent before saving.</p><p><a href="/member/life-back">Your Life Back goal</a> · <a href="/member/settings">Your data choices</a></p></details></section>`;
const css='<style data-continuity-welcome-style>#continuityWelcome{padding:16px 20px;margin:0 0 16px;border:1px solid #707762;border-radius:16px;background:#050505;color:#e7e3da}#continuityWelcome :is(h2,p,strong,a){color:#e7e3da!important;-webkit-text-fill-color:#e7e3da!important}#continuityWelcome h2{font-size:1.25rem;line-height:1.25;margin:0 0 8px}#continuityWelcome p{line-height:1.5;margin:8px 0}#continuityWelcome summary{cursor:pointer;min-height:44px;display:list-item;align-content:center;color:#e7e3da!important}#continuityWelcome a{text-decoration:underline!important;text-underline-offset:3px}#continuityWelcome a:focus-visible{outline:3px solid #e7e3da;outline-offset:4px}</style>';
export function improveContinuityArrival(html,url){
 const u=new URL(url);
 if(u.pathname!=='/member/dashboard'||u.searchParams.get('entry')!=='continuity'||html.includes('id="continuityWelcome"'))return html;
 const marker='<section id="memberDayGuide"';
 if(!html.includes(marker)||!html.includes('</head>'))throw Error('Today guide baseline changed');
 return html.replace(marker,welcome+marker).replace('</head>',css+'</head>');
}
