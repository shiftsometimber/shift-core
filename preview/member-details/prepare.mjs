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
mkdirSync(dir+'/review-evidence',{recursive:true});
console.log('Prepared account-details preview from pinned current sources, no production bindings.');
