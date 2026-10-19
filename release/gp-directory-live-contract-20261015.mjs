import assert from 'node:assert/strict';

export const GP_SITE='https://shiftsometimber.co.uk';
export const GP_API='https://api.shiftsometimber.co.uk';
export const GP_FIELDS=Object.freeze(['gpPractice','gpPostcode','gpCode','gpAddress','gpSelectionMode']);
const PERSONAL=['firstName','lastName','dateOfBirth','phone','postcode','address1','address2','town','county'];
const FIRST=/^shiftsometimber\+structured-growth-[a-f0-9-]{36}@gmail\.com$/i;
const SECOND=/^shiftsometimber\+structured-progressstory-\d+-desktop@gmail\.com$/i;
const HELD=/\/(?:contact|support|send|email|mail|invite|checkout|payment|order|verification|verify|forgot|recovery|reset)(?:[/?-]|$)/i;
export function assertGpHolder({site,api,email,source,report,second=false}){
 assert.equal(site,GP_SITE);assert.equal(api,GP_API);assert((second?SECOND:FIRST).test(email||''),'Existing labelled synthetic holder required');
 assert.match(source||'',/^[a-f0-9]{40}$/);if(!second){assert.equal(report?.synthetic,true);assert.equal(report?.realCustomerRecordsRead,false);}
}
export function gpView(details){return Object.fromEntries(GP_FIELDS.map(k=>[k,details?.[k]??'']));}
export function assertGpSave(body,baseline){
 assert(body&&typeof body==='object'&&!Array.isArray(body));assert.deepEqual(Object.keys(body).sort(),['details','operationId','revision']);
 assert.match(body.operationId||'',/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i);assert.match(body.revision||'',/^[a-f0-9]{64}$/);
 assert.deepEqual(Object.keys(body.details).sort(),[...PERSONAL,...GP_FIELDS].sort());
 for(const key of PERSONAL)assert.equal(body.details[key],String(baseline[key]??'').trim(),'Do not change unrelated account details: '+key);
 assert(['manual','directory','no_gp'].includes(body.details.gpSelectionMode));
 if(body.details.gpSelectionMode==='no_gp')for(const key of GP_FIELDS.filter(k=>k!=='gpSelectionMode'))assert.equal(body.details[key],'');
 if(body.details.gpSelectionMode==='manual')assert.equal(body.details.gpCode,'');
}
export function assertGpRequest({url,method,body,baseline}){
 const u=new URL(url);assert([GP_SITE,GP_API].includes(u.origin));assert(!HELD.test(u.pathname),'Held email/support/commitment route');
 if(method==='GET'){assert(['/v1/me','/v1/member/details','/v1/member/details/gp-search','/assets/member-experience/member-details.mjs','/assets/member-experience/member-details.css','/assets/member-experience/gp-form.mjs'].includes(u.pathname),'Unscoped GP read');return;}
 assert.equal(u.origin,GP_SITE);assert.equal(method,'PATCH');assert.equal(u.pathname,'/v1/member/details');assertGpSave(body,baseline);
}
export function assertDirectoryResult(value,{nation,nearNorthernIreland=false}={}){
 assert.equal(value.directoryVersion,'672021e21d318162d9aa550f','Use the already verified active directory; do not reimport');
 assert.equal(value.registrationVerified,false);assert.match(value.coverage,/England, Wales, Scotland and Northern Ireland/);
 assert(Array.isArray(value.practices)&&value.practices.length>0);assert(value.practices.length<=12);
 for(const p of value.practices){assert(p.name&&p.code&&p.postcode);assert(Array.isArray(p.address));assert(['England','Wales','Scotland','Northern Ireland'].includes(p.nation));assert(p.distanceMiles===null||Number.isFinite(p.distanceMiles)&&p.distanceMiles>=0);if(p.nation==='Northern Ireland')assert.equal(p.distanceMiles,null,'NI distance remains unknown regardless of search origin');}
 if(nation)assert(value.practices.some(p=>p.nation===nation),'Actual matching result for '+nation+' required');
 if(nearNorthernIreland){assert.equal(value.order,'name_relevance');assert(value.practices.every(p=>p.distanceMiles===null));assert.match(value.distanceNote,/unavailable for Northern Ireland/);}
 if(value.order==='nearest_matching_practices'){const distances=value.practices.map(p=>p.distanceMiles).filter(Number.isFinite);assert(distances.length>0);assert.deepEqual(distances,[...distances].sort((a,b)=>a-b));}
}
