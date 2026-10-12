import assert from 'node:assert/strict';
import {accountRecovery,recoveryControls,controlRecovery} from '../shift-coach/support-content-20261010.mjs';

// Only the frozen, approved /help additions are reversible here. All other
// response bytes continue through the original full-page fingerprint check.
const oldHeading='<h2>Health and urgent support</h2>';
const currentHeading='<h2 id="urgent-help">Health and urgent support</h2>';
const count=(html,block)=>html.split(block).length-1;
export function preserveSupportRecovery(path,input,{required=false}={}){
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
 assert.equal(count(html,recoveryControls+'</head>'),1,'Help recovery style moved');
 assert.equal(count(html,controlRecovery+'</body>'),1,'Help recovery script moved');
 return Buffer.from(html.replace(accountRecovery,'').replace(recoveryControls,'').replace(controlRecovery,'').replace(currentHeading,oldHeading));
}
