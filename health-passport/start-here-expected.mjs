// Compose the already-approved runtime repairs in the Passport expected asset; no public runtime changes.
import assert from 'node:assert/strict';
import {repairPromiseResponse} from '../public-promise-accuracy-v1.mjs';
export async function approvedStartHereExpected(source){
 assert.equal(source.split('JSON.stringify({recommended,alternative,answers})').length-1,0,'Raw answers must already be removed by the exact Passport repair');
 assert.equal(source.split('JSON.stringify({recommended,alternative})').length-1,2,'Passport cache source drift');
 const request=new Request('https://shiftsometimber.co.uk/start-here-v72.js?v=direct-detail-20260912');
 const response=await repairPromiseResponse(new Response(source,{headers:{'Content-Type':'application/javascript'}}),request);
 const expected=await response.text();
 assert.equal(expected.split('JSON.stringify({recommended,alternative,answers})').length-1,0);
 assert.equal(expected.split('JSON.stringify({recommended,alternative})').length-1,2);
 return expected;
}
