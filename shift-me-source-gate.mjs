import fs from 'node:fs';

const route=fs.readFileSync(new URL('./shift-me-v1.js',import.meta.url),'utf8');
const entry=fs.readFileSync(new URL('./worker-entry-shift-me-v1.js',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('./wrangler-shift-me.jsonc',import.meta.url),'utf8');
const browser=fs.readFileSync(new URL('./frontend/member/shift-me-api-v1.js',import.meta.url),'utf8');

const checks=[
  ['consent required',route.includes('consent_required')],
  ['authenticated via existing me route',route.includes("new URL('/v1/me'")],
  ['approved image types bounded',route.includes("image/jpeg")&&route.includes("image/png")&&route.includes("image/webp")&&route.includes('MAX_BYTES')],
  ['ordinary bloke prompt guard',route.includes('normal bloke')&&route.includes('fitness influencer')],
  ['model guard excludes bodybuilder/model drift',route.includes('bodybuilder')&&route.includes('fashion model')&&route.includes('six pack')],
  ['source photo not persisted',!route.includes('source_image_base64')&&!route.includes('source_photo_base64')&&route.includes('sourcePhotoStored:false')],
  ['all persisted reads are member-scoped',route.includes('WHERE user_id=? AND deleted_at IS NULL LIMIT 1')],
  ['generated write is member-scoped unique',route.includes('user_id INTEGER NOT NULL UNIQUE')&&route.includes('ON CONFLICT(user_id) DO UPDATE')],
  ['deletion is member-scoped',route.includes("UPDATE shift_me_v1 SET deleted_at=CURRENT_TIMESTAMP,image_base64='' WHERE user_id=? AND deleted_at IS NULL")],
  ['deleted asset bytes are cleared',route.includes("image_base64=''" )],
  ['generated image response is private/no-store',route.includes("'Cache-Control':'private, no-store'")&&route.includes("'X-Content-Type-Options':'nosniff'" )],
  ['worker composes without replacing base implementation',entry.includes("import base from './worker-entry-v6.js'")&&entry.includes('shiftMeRoutes')],
  ['deploy config keeps AI binding',config.includes('"ai"')&&config.includes('"binding":"AI"')],
  ['deploy config keeps D1 binding',config.includes('"binding":"DB"')],
  ['browser adapter uses authenticated cookies',browser.includes("credentials:'include'")],
  ['browser adapter sends appearance',browser.includes("form.append('appearance'")],
  ['browser adapter has bounded render timeout',browser.includes('90000')&&browser.includes('AbortController')],
];
const failed=checks.filter(([,ok])=>!ok);
for(const [name,ok]of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
if(failed.length){console.error(`Shift Me source gate failed: ${failed.map(([n])=>n).join(', ')}`);process.exit(1);}
console.log(`Shift Me source gate PASS (${checks.length}/${checks.length})`);
