// Exact-draft refinements: usable confirmation links, strict input types, full retained GP form matrix.
import fs from 'node:fs';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';
assert.equal(process.env.GITHUB_REF,'refs/heads/fix/account-completion-20260923');
function once(s,a,b){assert.equal(s.split(a).length,2,'Patch anchor mismatch: '+a.slice(0,80));return s.replace(a,b);}
function edit(path,marker,fn){const s=fs.readFileSync(path,'utf8');if(s.includes(marker))return;assert.equal(s,execFileSync('git',['show','1da3dd3dc8e75143df81ca607e5a8daaf1b14c2b:'+path],{encoding:'utf8'}),'Unexpected source drift: '+path);const next=fn(s);assert(next.includes(marker));fs.writeFileSync(path,next);}
edit('member-experience/member-email-change.mjs','renderEmailChangeMessage',s=>{
 s=once(s,"||!validEmail(body.newEmail?.trim())","||typeof body.newEmail!=='string'||typeof body.confirmEmail!=='string'||!validEmail(body.newEmail.trim())");
 const render=String.raw`export function renderEmailChangeMessage(text){
 return '<div style="font-family:Arial,sans-serif;max-width:620px;white-space:pre-wrap">'+escape(text).replace(/https:\/\/(?:shiftsometimber\.co\.uk|www\.shiftsometimber\.co\.uk|shift-stabilisation-preview\.matobrien\.workers\.dev)\/member\/email-change#token=[a-f0-9]{64}&amp;action=(?:confirm|cancel)/g,url=>'<a href="'+url+'">Open secure confirmation</a>')+'</div>';
}
`;
 s=once(s,'async function send(env,to,subject,text){',render+'async function send(env,to,subject,text){');
 return once(s,"html:'<div style=\"font-family:Arial,sans-serif;max-width:620px;white-space:pre-wrap\">'+escape(text)+'</div>'","html:renderEmailChangeMessage(text)");
});
edit('member-experience/tests/member-email-change.test.mjs','confirmation emails contain explicit escaped links',s=>{
 s=once(s,'memberEmailChangeRoute,verifyEmailChangePassword','memberEmailChangeRoute,verifyEmailChangePassword,renderEmailChangeMessage');
 return s+String.raw`
test('confirmation emails contain explicit escaped links and no executable user markup',()=>{const url='https://shiftsometimber.co.uk/member/email-change#token='+'a'.repeat(64)+'&action=confirm';const html=renderEmailChangeMessage('Click '+url+' <img src=x onerror=alert(1)>');assert(html.includes('<a href="https://shiftsometimber.co.uk/member/email-change#token='));assert(html.includes('&amp;action=confirm'));assert(!html.includes('<img'));assert(html.includes('&lt;img'));});
test('non-string email inputs produce validation errors, not service failures',async t=>{const f=setup(t);for(const patch of [{newEmail:123},{confirmEmail:123},{newEmail:null},{confirmEmail:{}}])assert.equal((await start(f,{...change(),...patch})).response.status,400);assert.equal(f.mail.length,0);});
`;
});
edit('account-completion/delivery-browser.mjs','// Await both independent forms before visual evidence.',s=>once(s,"await page.locator('#memberDeliveryPanel').scrollIntoViewIfNeeded();","// Await both independent forms before visual evidence.\n  await page.waitForFunction(()=>document.getElementById('memberDetailsFields')?.disabled===false&&document.getElementById('memberDeliveryFields')?.disabled===false);await page.locator('#memberDeliveryPanel').scrollIntoViewIfNeeded();"));
edit('preview/member-details/gp-browser-proof.mjs','GP_FORM_TEST_PATH',s=>{
 s=once(s,"const dir='work/staging/generated/review-evidence';","const formPath=process.env.GP_FORM_TEST_PATH||'/__review/gp-form';assert(['/__review/gp-form','/__review/gp-form-alternate'].includes(formPath));\nconst dir='work/staging/generated/review-evidence'+(formPath.endsWith('-alternate')?'/gp-alternate':'');");
 s=once(s,"origin+'/__review/gp-form'","origin+formPath");
 return once(s,"await import('./assurance-proof.mjs');","if(!formPath.endsWith('-alternate'))await import('./assurance-proof.mjs');");
});
edit('preview/member-details/worker.mjs',"path==='/__review/gp-form-alternate'",s=>once(s," if(path==='/__preview/clinical-disabled')"," if(path==='/__review/gp-form-alternate'&&request.method==='GET'){const r=await env.STAGING_ASSETS.fetch(new Request(new URL('/review-gp-assessment-alternate.html',u)));return page(await r.text(),r.status);}\n if(path==='/__preview/clinical-disabled')"));
edit('preview/member-details/prepare.mjs','review-gp-assessment-alternate.html',s=>s+String.raw`
// Separately render the other existing assessment template, never its submission handler.
let alternate=readFileSync('frontend/medicine-front-door/treatment-assessment.html','utf8');
assert.equal((alternate.match(/<script src="\/treatment-assessment\.js[^>]*><\/script>/g)||[]).length,1);
alternate=alternate.replace(/<script src="\/treatment-assessment\.js[^>]*><\/script>/,'');
alternate=alternate.replace('<form id="assessment"','<form method="post" action="/__preview/clinical-disabled" id="assessment"');
alternate=alternate.replace('<button type="submit">','<button type="submit" disabled>');
alternate=alternate.replace('<main>','<main><p role="note"><strong>ALTERNATE EXISTING FORM: FICTIONAL LOOKUP ONLY. Clinical submission and payment are disabled.</strong></p>');
writeFileSync(dir+'/assets/review-gp-assessment-alternate.html',alternate);
`);
console.log('Exact account-email and GP preview refinements applied; no shared shell or production configuration changed.');
