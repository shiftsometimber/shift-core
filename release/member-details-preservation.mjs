// Reverse only the two exact owner-approved startup transforms for the existing
// full-page preservation gate. Any other byte or route change still fails.
import {removeHomeBanner} from '../home-route-banner.mjs';
import assert from 'node:assert/strict';
import {HOME_BLOCKING_STYLES} from '../home-blocking-styles.mjs';
import {stabilisePublicHtml,programmeBridge,loginReservationStyles} from '../public-startup-stability.mjs';
const status='<section id="memberSessionStatus" aria-label="Account access"><p role="status">Checking your sign-in…</p></section><script src="/assets/member-experience/session.mjs"></script>';
export function preserveApprovedStartup(path,body){
 const original=body.toString('utf8');const text=path==='/'?removeHomeBanner(original):original;body=Buffer.from(text);let before=text;
 const once=(a,b='')=>{assert.equal(before.split(a).length,2,'Unexpected startup preservation signature: '+path);before=before.replace(a,b);};
 if(path==='/'&&text.includes('data-home-inline-css="/assets/my-timber-pwa.css"')){
  const css=HOME_BLOCKING_STYLES['/assets/my-timber-pwa.css'].replace(/\/\*[\s\S]*?\*\//g,c=>c.replaceAll('<','&lt;'));
  once('<style data-home-inline-css="/assets/my-timber-pwa.css">'+css+'</style>','<link rel="stylesheet" href="/assets/my-timber-pwa.css">');
 }else if(path==='/programme'&&text.includes('data-programme-layout="stable-v1"')){
  once(programmeBridge);once('<link data-programme-layout="stable-v1" rel="stylesheet" href="/assets/shift-service-bridge-v1.css?v=2">');
 }else if(path==='/member-login'&&text.includes('data-login-layout="stable-v1"')){
  once(' data-login-layout="stable-v1"');once('<style data-login-reservation>'+loginReservationStyles+'</style>');
  once('<main class="preview-wrap">'+status,'<main class="preview-wrap">');
  const match=before.match(/<body\b[^>]*>/);assert(match,'Missing original body');
  once(match[0],match[0]+status);
 }else return body;
 assert.equal(path==='/'?removeHomeBanner(stabilisePublicHtml(path,before)):stabilisePublicHtml(path,before),text,'Unknown startup transformation: '+path);
 return Buffer.from(before);
}
