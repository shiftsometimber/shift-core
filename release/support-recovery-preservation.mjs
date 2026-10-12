import assert from 'node:assert/strict';
import {accountRecovery,recoveryControls,controlRecovery} from '../shift-coach/support-content-20261010.mjs';
// Compare the exact support recovery already registered under owner lane 1065.
// No public content is edited here; all bytes outside these three reviewed blocks
// and the reviewed urgent-help anchor still enter the full-page fingerprint.
export function preserveSupportRecovery(path,input,{required=false}={}){
 if(path!=='/help')return input;
 const html=input.toString('utf8');assert(Buffer.from(html).equals(input),'Help must be valid UTF-8');
 const count=s=>html.split(s).length-1;
 const paragraph='<p>For registration, verification, sign-in or password-reset problems, start at <a href="/member-login">My Timber sign-in</a>. Never send your password by email.</p>';
 const oldHeading='<h2>Health and urgent support</h2>',newHeading='<h2 id="urgent-help">Health and urgent support</h2>';
 assert.equal(count(paragraph),1,'Help account boundary drift');
 const blocks=[accountRecovery,recoveryControls,controlRecovery];
 const markers=['<section data-support-recovery="2026-10-11">','<style data-support-controls="2026-10-11">','<script data-support-control-recovery="2026-10-11">'];
 for(let i=0;i<blocks.length;i++)assert.equal(count(blocks[i]),count(markers[i]),'Help support recovery source drift');
 const present=count(accountRecovery);assert(present===0||present===1,'Duplicate Help support recovery');
 for(const block of blocks)assert.equal(count(block),present,'Partial Help support recovery');
 assert.equal(count(oldHeading)+count(newHeading),1,'Help urgent heading drift');
 assert.equal(count(newHeading),present,'Help urgent anchor drift');
 if(present){assert.equal(count(paragraph+accountRecovery),1,'Help recovery position drift');assert.equal(count(recoveryControls+'</head>'),1,'Help controls position drift');assert.equal(count(controlRecovery+'</body>'),1,'Help control script position drift');}
 if(required)assert.equal(present,1,'Reviewed Help support recovery missing');
 let normal=html;for(const block of blocks)normal=normal.replace(block,'');
 return Buffer.from(normal.replace(newHeading,oldHeading));
}
