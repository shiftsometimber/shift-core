import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export const safetyMarkers=['Need urgent help?','My Timber is not monitored for urgent help.','tel:999','tel:111','tel:116123','Headline privacy','Quotes stay blurred until you tap.','Hide headline','mt-r-quote-masked','aria-hidden','Stopping or continuing treatment is never a personal failure.'];
export function verifySafetyRuntime(client){
 for(const marker of safetyMarkers)assert(client.includes(marker),'Delivered My Timber safety/privacy requirement missing: '+marker);
 assert(client.includes("if(detail==='symptoms')c.append(urgent())"),'Side-effects card must contain direct urgent help');
 assert(client.includes('headlinePreference')&&client.includes('preferenceOwner'),'Headline choice must be account scoped');
 for(const phone of ['tel:999','tel:111','tel:116123'])assert(client.includes("'"+phone+"'")||client.includes('"'+phone+'"'),'Urgent-help link must be a clean telephone URI: '+phone);
 new Function(client);
 return {markers:safetyMarkers.length,sideEffectsUrgentHelp:true,accountScopedHeadline:true};
}
export async function verifyLive({origin='https://shiftsometimber.co.uk',expectedSHA}={}){
 const response=await fetch(origin+'/assets/my-timber-layout.mjs',{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(response.status,200);
 const client=await response.text(),sha256=createHash('sha256').update(client).digest('hex');if(expectedSHA)assert.equal(sha256,expectedSHA,'Served My Timber client differs from this release');
 const controls=verifySafetyRuntime(client);
 const page=await fetch(origin+'/member/dashboard',{cache:'no-store',signal:AbortSignal.timeout(30000)});assert.equal(page.status,200);
 assert((await page.text()).includes('/assets/my-timber-layout.mjs'),'Live member page must load the checked runtime');
 return {at:new Date().toISOString(),origin,sha256,...controls,scope:'Live delivered runtime and page linkage; authenticated account/device acceptance is separate',productionWrites:0};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)console.log(JSON.stringify(await verifyLive({expectedSHA:process.env.SHIFT_EXPECTED_MEMBER_LAYOUT_SHA}),null,2));
