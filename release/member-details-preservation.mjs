// Reverse only the two exact owner-approved startup transforms for the existing
// full-page preservation gate. Any other byte or route change still fails.
import assert from 'node:assert/strict';
import {stabilisePublicHtml,programmeBridge,loginReservationStyles} from '../public-startup-stability.mjs';
const status='<section id="memberSessionStatus" aria-label="Account access"><p role="status">Checking your sign-in…</p></section><script src="/assets/member-experience/session.mjs"></script>';
export function preserveApprovedStartup(path,body){
 const text=body.toString('utf8');let before=text;
 const once=(a,b='')=>{assert.equal(before.split(a).length,2,'Unexpected startup preservation signature: '+path);before=before.replace(a,b);};
 if(path==='/programme'&&text.includes('data-programme-layout="stable-v1"')){
  once(programmeBridge);once('<link data-programme-layout="stable-v1" rel="stylesheet" href="/assets/shift-service-bridge-v1.css?v=2">');
 }else if(path==='/member-login'&&text.includes('data-login-layout="stable-v1"')){
  once(' data-login-layout="stable-v1"');once('<style data-login-reservation>'+loginReservationStyles+'</style>');
  once('<main class="preview-wrap">'+status,'<main class="preview-wrap">');
  const match=before.match(/<body\b[^>]*>/);assert(match,'Missing original body');
  once(match[0],match[0]+status);
 }else return body;
 assert.equal(stabilisePublicHtml(path,before),text,'Unknown startup transformation: '+path);
 return Buffer.from(before);
}
