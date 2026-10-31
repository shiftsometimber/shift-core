export const BLOODS_FAQ_PATH='/shift-health/blood-tests';
export const BLOODS_FAQ_QUESTION="Does NHS home testing mean every blood test is available through the NHS App?";
export const BLOODS_FAQ_PARAGRAPHS=["No. An NHS Home Test assessment published on 15 October 2026 describes an early platform starting with HIV self-testing, with other test types envisaged for the future. The assessment itself took place on 30 April. Passing alpha assessment permits conditional progression towards private beta; it does not confirm a public launch of testosterone testing or general blood panels.","For symptoms or a result you are worried about, ask your GP what investigation and follow-up are appropriate. SHIFT Bloods ordering remains closed."];
export const BLOODS_FAQ_SOURCE={"url":"https://digitalhealth.blog.gov.uk/2026/10/15/nhse-home-test-alpha-assessment/","label":"DHSC — NHSE Home Test Alpha Assessment","after":" published 15 October 2026; assessment 30 April 2026."};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const BLOODS_FAQ_HTML='<details data-shift-approved-faq="nhs-home-test-20261029"><summary>'+esc(BLOODS_FAQ_QUESTION)+'</summary>'+BLOODS_FAQ_PARAGRAPHS.map(p=>'<p>'+esc(p)+'</p>').join('')+'<p>Source: <a href="'+esc(BLOODS_FAQ_SOURCE.url)+'">'+esc(BLOODS_FAQ_SOURCE.label)+'</a>,'+esc(BLOODS_FAQ_SOURCE.after)+'</p></details>';
export const BLOODS_FAQ_SCHEMA='<script type="application/ld+json" id="shift-approved-home-test-faq">'+JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:[{'@type':'Question',name:BLOODS_FAQ_QUESTION,acceptedAnswer:{'@type':'Answer',text:BLOODS_FAQ_PARAGRAPHS.join(' ')}}]}).replace(/</g,'\\u003c')+'</script>';
export function addApprovedBloodsFaq(html,path){
 if(path!==BLOODS_FAQ_PATH||html.includes('data-shift-approved-faq="nhs-home-test-20261029"')||html.includes(BLOODS_FAQ_QUESTION))return html;
 const headings=[...html.matchAll(/<h2\b[^>]*>The useful questions\.?<\/h2>/g)];
 if(headings.length!==1||!html.includes('Ordering is closed and no payment can be taken.'))return html;
 const start=html.indexOf('<div class="faqs">',headings[0].index),end=html.indexOf('</div></section>',start);
 if(start<0||end<0||html.slice(start,end).includes('<section'))return html;
 const updated=html.slice(0,end)+BLOODS_FAQ_HTML+html.slice(end);
 return /"@type"\s*:\s*"FAQPage"/.test(updated)?updated:updated.replace('</head>',BLOODS_FAQ_SCHEMA+'</head>');
}
