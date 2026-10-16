import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from '../../health-passport/fixture.mjs';
import {authenticateMember} from '../../member-state-fast-v1.js';
import {memberDetailsLookupRoute} from '../member-details-lookups.mjs';
const origin='https://shiftsometimber.co.uk';
const targets=[['/v1/member/details/gp-search?q=London','GET'],['/v1/member/details/address-search','POST']];
async function compare(request,env){
 const original=await authenticateMember(request.clone(),env);assert(original.response);
 const result=await memberDetailsLookupRoute(request,env);assert.equal(result.status,original.response.status);assert.equal(result.statusText,original.response.statusText);assert.equal(await result.text(),await original.response.text());
 for(const [key,value]of original.response.headers)if(!['cache-control','vary','x-content-type-options','x-robots-tag'].includes(key))assert.equal(result.headers.get(key),value);
 assert.equal(result.headers.get('Cache-Control'),'no-store, private');assert.equal(result.headers.get('Vary'),'Cookie');assert.equal(result.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(result.headers.get('X-Robots-Tag'),'noindex, nofollow');assert.equal(result.headers.get('Set-Cookie'),null);
}
test('anonymous private lookup denials preserve exact authentication status/body without reading or writing records',async()=>{
 const env={DB:{prepare(){throw Error('Anonymous denial must never access records');}}};
 for(const [path,method]of targets)await compare(new Request(origin+path,{method,headers:{Origin:origin}}),env);
});
for(const kind of ['expired','revoked','unknown'])test(kind+' lookup session denial is private, preserves authentication and leaves both synthetic accounts unchanged',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());
 if(kind==='expired')f.db.prepare("UPDATE user_sessions SET expires_at='2000-01-01T00:00:00Z' WHERE user_id=1").run();
 if(kind==='revoked')f.db.prepare("UPDATE user_sessions SET revoked_at='2026-10-16T00:00:00Z' WHERE user_id=1").run();
 const tables=['users','user_sessions','consents','member_state','audit_log'],snap=()=>Object.fromEntries(tables.map(name=>[name,f.db.prepare('SELECT * FROM '+name).all()])),before=snap();
 for(const [path,method]of targets)await compare(new Request(origin+path,{method,headers:{Origin:origin,Cookie:'sst_session='+(kind==='unknown'?'unknown-synthetic-token':'test-only-member-1')}}),f.env);
 assert.deepEqual(snap(),before);
});
