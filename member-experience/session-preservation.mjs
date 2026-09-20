import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sessionStyles,withSessionState} from './session-state.mjs';

// Reverse only the exact reviewed login presentation transition. The existing
// whole-page fingerprint still detects any other login/credential/content edit.
export function preserveLoginSession(path,body){
 if(path!=='/member-login')return body;
 const current=body.toString('utf8');if(!current.includes('id="memberSessionStatus"'))return body;
 let html=current;
 const remove=part=>{assert.equal(html.split(part).length,2,'Expected one exact session presentation block');html=html.replace(part,'')};
 remove(' data-member-session="pending"');
 remove('<style>'+sessionStyles+'</style>');
 remove('<section id="memberSessionStatus" aria-label="Account access"><p role="status">Checking your sign-in…</p></section><script src="/assets/member-experience/session.mjs"></script>');
 html=html.replace(/(id="previewAuth") hidden/,'$1');
 const source=readFileSync(new URL('../frontend/member/my-timber-preview.html',import.meta.url),'utf8');
 const start=source.indexOf('async function existing()'),end=source.indexOf('function setMode(',start);
 assert(start>=0&&end>start);
 const replacement='async function existing(){await window.SST_MEMBER_SESSION.check(showMember)}\n      ';
 assert.equal(html.split(replacement).length,2);html=html.replace(replacement,source.slice(start,end));
 html=html.replace('async function showMember(){window.SST_MEMBER_SESSION.ready();','async function showMember(){');
 html=html.replace(String.raw`const destination=requestedDestination()||(/^\/member-login(?:\.html)?\/?$/.test(location.pathname)?'/member/dashboard'+location.hash:'');`,'const destination=requestedDestination();');
 assert.equal(withSessionState(html).replace('<style>'+sessionStyles+'</style>',''),current.replace('<style>'+sessionStyles+'</style>',''),'Login differs from the exact approved session transition');
 return Buffer.from(html);
}
