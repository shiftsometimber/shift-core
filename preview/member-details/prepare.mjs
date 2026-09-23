// Preserve the existing pinned source capture. Scope these changes to this preview.
import '../stabilisation/prepare.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const dir='work/staging/generated',file=dir+'/config.json',c=JSON.parse(readFileSync(file));
assert.equal(c.name,'shift-stabilisation-preview');assert.equal(c.vars.SHIFT_ENVIRONMENT,'stabilisation-preview-20260917');assert.equal(c.d1_databases.length,0);
c.main='../../../preview/member-details/worker.mjs';c.compatibility_flags=['nodejs_compat'];
c.vars.MEMBER_GP_LOOKUP_ENABLED='true';c.vars.PUBLIC_SITE_URL='https://shift-stabilisation-preview.matobrien.workers.dev';c.vars.ALLOWED_ORIGINS=c.vars.PUBLIC_SITE_URL;c.vars.MY_TIMBER_PWA_ENABLED='true';
// No address-provider key is invented, borrowed from production, or exposed.
delete c.triggers;delete c.send_email;delete c.ai;delete c.routes;delete c.route;
writeFileSync(file,JSON.stringify(c,null,2));
// The retained staging sign-in belonged to the old Work trial. Only its captured
// preview asset changes landing; real login, cookies and production are unchanged.
const loginPath=dir+'/assets/staging/login.mjs',login=readFileSync(loginPath,'utf8');
assert.equal(login.split(":'/member/work'").length-1,1,'Unexpected staging landing source');
writeFileSync(loginPath,login.replace(":'/member/work'",":'/member/dashboard'"));
mkdirSync(dir+'/review-evidence',{recursive:true});
console.log('Prepared account-details preview from pinned current sources, no production bindings.');

// Lookup-only rendering of the current clinical form; its production handler is not run.
let assessment=readFileSync('frontend/member/treatment-assessment.html','utf8');
assert.equal((assessment.match(/<script src="\/treatment-assessment\.js[^>]*><\/script>/g)||[]).length,1);
assessment=assessment.replace(/<script src="\/treatment-assessment\.js[^>]*><\/script>/,'');
assessment=assessment.replace('<form id="assessment"','<form method="post" action="/__preview/clinical-disabled" id="assessment"');
assessment=assessment.replace('<button type="submit">','<button type="submit" disabled>');
assessment=assessment.replace('<main>','<main><p role="note"><strong>FICTIONAL LOOKUP PREVIEW ONLY. Clinical submission and payment are disabled. Use fictional details only.</strong> <a href="/__review">Back to review</a></p>');
writeFileSync(dir+'/assets/review-gp-assessment.html',assessment);

// Separately render the other existing assessment template, never its submission handler.
let alternate=readFileSync('frontend/medicine-front-door/treatment-assessment.html','utf8');
assert.equal((alternate.match(/<script src="\/treatment-assessment\.js[^>]*><\/script>/g)||[]).length,1);
alternate=alternate.replace(/<script src="\/treatment-assessment\.js[^>]*><\/script>/,'');
alternate=alternate.replace('<form id="assessment"','<form method="post" action="/__preview/clinical-disabled" id="assessment"');
alternate=alternate.replace('<button type="submit">','<button type="submit" disabled>');
alternate=alternate.replace('<main>','<main><p role="note"><strong>ALTERNATE EXISTING FORM: FICTIONAL LOOKUP ONLY. Clinical submission and payment are disabled.</strong></p>');
writeFileSync(dir+'/assets/review-gp-assessment-alternate.html',alternate);
