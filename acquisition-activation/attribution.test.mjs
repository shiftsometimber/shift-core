import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseAcquisition,registrationMetadata,VERSION,BROWSER_TTL} from './model.mjs';
import {acquisitionRoutes,readAcquisition,appendAcquisitionExport,PURGE_EXPIRED_SQL} from './server.mjs';
import {activationScorecard} from '../activation-measurement/scorecard.mjs';
import {privacyHealthErasureRoute} from '../privacy-health-erasure-route-v1.js';
import {fixture} from './fixture.mjs';
const input=(extra={})=>{const now=Date.now()-20;return{version:VERSION,source:'google',medium:'organic',consent:true,consentAt:new Date(now).toISOString(),capturedAt:new Date(now).toISOString(),...extra}};
const read=DB=>activationScorecard(DB,{now:Date.now()+1000,days:30});
async function member(f,email='member@attribution.invalid',acquisition=input()){
 const registration=await f.register(email,acquisition);assert.equal(registration.status,201);
 const body=await registration.json();await f.verify(email);const {cookie,response}=await f.login(email);assert.equal(response.status,200);
 return{id:body.user.id,cookie,email};
}
test('only bounded labels and explicit versioned consent are accepted',()=>{
 const v=normaliseAcquisition(input({campaign:'private medical details',email:'not-kept',clickId:'secret',userId:9}));assert.deepEqual(Object.keys(v).sort(),['version','model','source','medium','consent','consentAt','capturedAt','expiresAt'].sort());
 for(const bad of [null,{},input({consent:false}),input({version:'old'}),input({source:'__proto__'}),input({source:'email',medium:'cpc'}),input({source:'a@example.com'}),input({capturedAt:new Date(Date.now()-BROWSER_TTL-1).toISOString()}),input({capturedAt:'bad'}),input({consentAt:new Date(Date.now()+1000).toISOString()})])assert.equal(normaliseAcquisition(bad),null);
});
test('actual registration, email-token verification, password login and saved Journey join to one source',async t=>{
 const f=fixture(t),m=await member(f);
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(m.id);
 assert.equal((await f.save(m.cookie)).status,200);const report=await read(f.DB);
 assert.deepEqual(report.stages.map(x=>x.members),[1,1,1,1]);
 assert.deepEqual(report.acquisition.sources,[{source:'google',medium:'organic',registered:1,verified:1,signedIn:1,activated:1,activationRatePct:100}]);
 assert.doesNotMatch(JSON.stringify(report),/attribution.invalid|currentKg|99|password|token_hash/);
});
test('verification without login and login without save are not activation',async t=>{
 const f=fixture(t);await f.register('first@attribution.invalid',input());await f.verify('first@attribution.invalid');const r=await read(f.DB);assert.deepEqual(r.stages.map(x=>x.members),[1,1,0,0]);assert.equal(r.acquisition.sources[0].activated,0);
 await f.login('first@attribution.invalid');assert.equal((await read(f.DB)).acquisition.sources[0].activated,0);
});
test('failed/duplicate registration cannot overwrite or add a new source',async t=>{
 const f=fixture(t),m=await member(f);assert.equal((await f.register(m.email,input({source:'email',medium:'email'}))).status,409);
 assert.equal(f.db.prepare("SELECT count(*) n FROM audit_log WHERE action='auth.register'").get().n,1);
 assert.equal((await readAcquisition(f.DB,m.id)).source,'google');
});
test('unknown and non-consented acquisition remains explicitly unattributed',async t=>{
 const f=fixture(t);await member(f,'a@attribution.invalid',null);await member(f,'b@attribution.invalid',input({consent:false}));await member(f,'c@attribution.invalid',input({source:'unsupported'}));
 const r=await read(f.DB);assert.equal(r.acquisition.attributedMembers,0);assert.equal(r.acquisition.unattributedMembers,3);assert.equal(r.acquisition.sources[0].source,'unattributed');
});
test('a source is not transferable through another member identity or login',async t=>{
 const f=fixture(t),a=await member(f,'a@attribution.invalid',input({userId:999})),b=await member(f,'b@attribution.invalid',input({source:'email',medium:'email'}));
 const data=await acquisitionRoutes(f.req('/v1/acquisition-attribution',undefined,'GET',b.cookie),f.env);assert.equal((await data.json()).attribution.source,'email');assert.equal((await readAcquisition(f.DB,a.id)).source,'google');
});
test('withdrawal erases only optional attribution and keeps activation and other member data',async t=>{
 const f=fixture(t),a=await member(f),b=await member(f,'second@attribution.invalid',input({source:'newsletter',medium:'email'}));
 f.db.prepare("UPDATE audit_log SET metadata=json_set(metadata,'$.existingEvidence','kept') WHERE user_id=? AND action='auth.register'").run(a.id);
 const r=await acquisitionRoutes(f.req('/v1/acquisition-attribution',{},'DELETE',a.cookie),f.env);assert.equal(r.status,200);
 assert.equal(await readAcquisition(f.DB,a.id),null);assert.equal((await readAcquisition(f.DB,b.id)).source,'newsletter');
 assert.equal(JSON.parse(f.db.prepare("SELECT metadata FROM audit_log WHERE user_id=? AND action='auth.register'").get(a.id).metadata).existingEvidence,'kept');
 assert.equal((await read(f.DB)).acquisition.unattributedMembers,1);assert.equal(f.db.prepare('SELECT count(*) n FROM user_auth').get().n,2);
});
test('private attribution APIs fail closed for unauthenticated and cross-origin requests',async t=>{
 const f=fixture(t),m=await member(f);assert.equal((await acquisitionRoutes(f.req('/v1/acquisition-attribution',undefined,'GET'),f.env)).status,401);
 const x=f.req('/v1/acquisition-attribution',{},'DELETE',m.cookie);x.headers.set('Origin','https://attacker.invalid');assert.equal((await acquisitionRoutes(x,f.env)).status,403);assert.ok(await readAcquisition(f.DB,m.id));
});
test('export includes only this member’s coarse source, not raw audit/other people',async t=>{
 const f=fixture(t),a=await member(f),b=await member(f,'other@attribution.invalid',input({source:'email',medium:'email'}));
 const r=await appendAcquisitionExport(f.req('/v1/privacy/export',{},'POST',a.cookie),f.env,Response.json({original:'kept'})),body=await r.json();assert.equal(body.original,'kept');assert.equal(body.acquisitionAttribution.source,'google');assert.doesNotMatch(JSON.stringify(body),/other@|ip_address|user_id|token/);
});
test('expired records lose attribution without changing account totals, and purge preserves other audit metadata',async t=>{
 const f=fixture(t),m=await member(f);f.db.prepare("UPDATE audit_log SET metadata=json_set(metadata,'$.acquisition.expiresAt','2000-01-01','$.security','kept') WHERE user_id=? AND action='auth.register'").run(m.id);
 const r=await read(f.DB);assert.equal(r.stages[0].members,1);assert.equal(r.acquisition.unattributedMembers,1);
 f.db.exec(PURGE_EXPIRED_SQL);const meta=JSON.parse(f.db.prepare("SELECT metadata FROM audit_log WHERE action='auth.register'").get().metadata);assert.deepEqual(meta,{security:'kept'});
});
test('known synthetic test accounts remain excluded from live-use report',async t=>{const f=fixture(t);await member(f,'excluded@example.invalid');const r=await read(f.DB);assert.equal(r.stages[0].members,0);assert.equal(r.acquisition.sources.length,0);assert.equal(r.excludedKnownTestAccounts,1)});
test('repeated successful save events do not multiply source conversions',async t=>{const f=fixture(t),m=await member(f);f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(?,'my_shift_health_tracking',1)").run(m.id);for(let i=0;i<3;i++)assert.equal((await f.save(m.cookie)).status,200);assert.equal((await read(f.DB)).acquisition.sources[0].activated,1)});
test('refusal of optional health tracking cannot become an activation event',async t=>{const f=fixture(t),m=await member(f);assert.equal((await f.save(m.cookie)).status,409);assert.equal((await read(f.DB)).acquisition.sources[0].activated,0)});
test('generic health erasure also removes the optional source but leaves accounts intact',async t=>{const f=fixture(t),m=await member(f);const r=await privacyHealthErasureRoute(f.req('/v1/privacy/health-tracking',undefined,'DELETE',m.cookie),f.env,{},async()=>Response.json({user:{id:m.id}}));assert.equal(r.status,200);assert.equal(await readAcquisition(f.DB,m.id),null);assert.equal(f.db.prepare('SELECT count(*) n FROM user_auth').get().n,1)});
