import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {pillarChromeStyle} from '../obesity-awareness/candidate.mjs';
import {accountRecovery,recoveryControls,controlRecovery} from '../shift-coach/support-content-20261010.mjs';

// Only the frozen, approved /help additions are reversible here. All other
// response bytes continue through the original full-page fingerprint check.
const oldHeading='<h2>Health and urgent support</h2>';
const currentHeading='<h2 id="urgent-help">Health and urgent support</h2>';
const count=(html,block)=>html.split(block).length-1;

export const SUPPORT_SECURITY_PATH='/turnstile-auth-v1.js?v=timeout-20260912';
const CLIENT_PATH='frontend/member/turnstile-auth-v1.js';
let securitySnapshots;
export function supportSecuritySnapshots(){
 if(!securitySnapshots){
  const read=ref=>execFileSync('git',['show',ref+':'+CLIENT_PATH]);
  const prior=read('4df439d8fb03f29f030e25c413e40f0fac57c042'),current=read('fb8f56205c00e24f1f54194dea9a99a5d0c0a884');
  const hash=b=>createHash('sha256').update(b).digest('hex');
  assert.equal(hash(prior),'f263162055532bf088fefc7c0aa3bf6b6f8ab78e59186400e4c5038a895a1a6a');
  assert.equal(hash(current),'8320b681a691ea4be2dc449f85a284d2d55c5c13fea1593d9223ee37da0fd7a2');
  securitySnapshots={prior,current};
 }
 return {prior:Buffer.from(securitySnapshots.prior),current:Buffer.from(securitySnapshots.current)};
}
export function preserveSupportSecurity(path,input,{required=false}={}){
 if(path!==SUPPORT_SECURITY_PATH)return input;
 assert(Buffer.isBuffer(input),'Security client preservation requires exact response bytes');
 const {prior,current}=supportSecuritySnapshots();
 assert(input.equals(prior)||input.equals(current),'Security client differs from exact approved source');
 if(required)assert(input.equals(current),'Security client is missing the approved contact-only recovery');
 return input.equals(prior)?input:Buffer.from(prior);
}
export function preserveSupportRecovery(path,input,{required=false}={}){
 if(path===SUPPORT_SECURITY_PATH)return preserveSupportSecurity(path,input,{required});
 if(path!=='/help')return input;
 const html=input.toString('utf8');
 assert(Buffer.from(html).equals(input),'Help must be valid UTF-8');
 const blocks=[accountRecovery,recoveryControls,controlRecovery,currentHeading];
 const counts=blocks.map(block=>count(html,block));
 const markerCounts=[
  (html.match(/<section\b[^>]*\bdata-support-recovery=/g)||[]).length,
  (html.match(/<style\b[^>]*\bdata-support-controls=/g)||[]).length,
  (html.match(/<script\b[^>]*\bdata-support-control-recovery=/g)||[]).length,
  (html.match(/\bid=["']urgent-help["']/g)||[]).length
 ];
 assert.deepEqual(markerCounts,counts,'Help recovery differs from exact approved source');
 assert(counts.every(n=>n===0)||counts.every(n=>n===1),'Help recovery is partial or duplicated');
 if(required)assert(counts.every(n=>n===1),'Help is missing approved account recovery');
 if(counts.every(n=>n===0))return input;
 assert.equal(count(html,oldHeading),0,'Help has duplicate urgent headings');
 const oldParagraph='<p>For registration, verification, sign-in or password-reset problems, start at <a href="/member-login">My Timber sign-in</a>. Never send your password by email.</p>';
 assert.equal(count(html,oldParagraph+accountRecovery),1,'Help recovery moved outside approved insertion boundary');
 assert.equal(count(html,recoveryControls+'</head>')+count(html,recoveryControls+pillarChromeStyle+'</head>'),1,'Help recovery style moved outside exact approved head boundary');
 assert.equal(count(html,controlRecovery+'</body>'),1,'Help recovery script moved');
 return Buffer.from(html.replace(accountRecovery,'').replace(recoveryControls,'').replace(controlRecovery,'').replace(currentHeading,oldHeading));
}
