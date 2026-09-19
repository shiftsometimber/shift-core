import test from 'node:test';
import assert from 'node:assert/strict';
import {hostedMutationAllowed} from './hosted-origin.mjs';
const origin='https://shift-passport-preview-20260919.example.workers.dev';
const form={'Origin':'null','Sec-Fetch-Site':'same-origin','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document','Content-Type':'application/x-www-form-urlencoded'};
const request=(path='/v1/auth/logout',headers=form,method='POST')=>new Request(origin+path,{method,headers});
test('native same-origin logout is allowed when no-referrer suppresses Origin',()=>{
 assert.equal(hostedMutationAllowed(request()),true);const h={...form};delete h.Origin;assert.equal(hostedMutationAllowed(request(undefined,h)),true);
});
test('cross-site, same-site, missing provenance, fetch and foreign origin never use the navigation exception',()=>{
 for(const h of [{...form,'Sec-Fetch-Site':'cross-site'},{...form,'Sec-Fetch-Site':'same-site'},{...form,'Sec-Fetch-Site':''},{...form,'Sec-Fetch-Mode':'cors'},{...form,'Sec-Fetch-Dest':'empty'},{...form,Origin:'https://outside.example'},{Origin:'null'}])assert.equal(hostedMutationAllowed(request(undefined,h)),false);
});
test('Origin-suppressed navigation cannot write Passport data or other account state',()=>{
 for(const p of ['/v1/health-passport/records','/v1/consents','/v1/profile','/v1/auth/login'])assert.equal(hostedMutationAllowed(request(p)),false);
 for(const m of ['DELETE','PATCH','PUT'])assert.equal(hostedMutationAllowed(request(undefined,form,m)),false);
});
test('ordinary exact-Origin requests keep their original policy',()=>{
 assert.equal(hostedMutationAllowed(request('/v1/health-passport/records',{Origin:origin,'Content-Type':'application/json'})),true);
 assert.equal(hostedMutationAllowed(request('/v1/health-passport/records',{Origin:'https://outside.example','Content-Type':'application/json'})),false);
});
