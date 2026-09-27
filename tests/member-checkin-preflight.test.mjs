import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker-entry-v6.js';
import {fixture} from '../health-passport/fixture.mjs';

const api='https://api.shiftsometimber.co.uk/v1/check-ins';
const official='https://shiftsometimber.co.uk';
const preflight=origin=>new Request(api,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
const request=(method,body,id=1)=>new Request(api,{method,headers:{Origin:official,'Content-Type':'application/json',...(id?{Cookie:'sst_session=test-only-member-'+id}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
function noDatabase(){
 let accesses=0;
 const env={MEMBER_EXPERIENCE_V1_ENABLED:'true',get DB(){accesses++;throw Error('This request must not access the database')}};
 return {env,accesses:()=>accesses};
}

for(const origin of [official,'https://www.shiftsometimber.co.uk'])test('check-in JSON preflight accepts '+origin+' without session or database access',async()=>{
 const guarded=noDatabase(),response=await worker.fetch(preflight(origin),guarded.env,{});
 assert.equal(response.status,204);
 assert.equal(await response.text(),'');
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
 assert.equal(response.headers.get('Access-Control-Allow-Credentials'),'true');
 assert.match(response.headers.get('Access-Control-Allow-Methods'),/(?:^|,\s*)POST(?:,|$)/);
 assert.match(response.headers.get('Access-Control-Allow-Headers'),/(?:^|,\s*)Content-Type(?:,|$)/);
 assert.match(response.headers.get('Vary'),/Origin/);
 assert.equal(guarded.accesses(),0);
});

test('hostile origin receives no CORS permission and preflight still does not touch the database',async()=>{
 const guarded=noDatabase(),response=await worker.fetch(preflight('https://untrusted.example'),guarded.env,{});
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
 assert.equal(guarded.accesses(),0);
});

test('successful preflight does not allow an unauthenticated check-in save',async()=>{
 const guarded=noDatabase(),response=await worker.fetch(request('POST',{mood:'OK',note:'Fictional note'},null),guarded.env,{});
 assert.equal(response.status,401);
 assert.equal((await response.json()).error,'authentication_required');
 assert.equal(response.headers.get('Access-Control-Allow-Origin'),official);
 assert.equal(guarded.accesses(),0);
});

test('real entry preserves consent, saves OK plus note and reads it from the same private account',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());
 t.mock.method(globalThis,'fetch',async()=>{throw Error('Check-in persistence must not make an external request')});
 const payload={mood:'OK',note:'Fictional note: a steady day.',checkedAt:'2000-01-01T00:00:00Z',source:'member-check-in'};
 const blocked=await worker.fetch(request('POST',payload),f.env,{});
 assert.equal(blocked.status,409);
 assert.equal((await blocked.json()).error,'health_consent_required');
 assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM check_ins').get().count,0);
 f.db.prepare("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1)").run();

 const before=Date.now(),saved=await worker.fetch(request('POST',payload),f.env,{});
 assert.equal(saved.status,201,await saved.clone().text());
 assert.equal(saved.headers.get('Access-Control-Allow-Origin'),official);
 const body=await saved.json();
 assert.equal(body.ok,true);assert.equal(body.checkIn.mood,'OK');assert.equal(body.checkIn.note,payload.note);
 assert.ok(Date.parse(body.checkIn.checkedAt)>=before,'Server supplies the actual save time');
 assert.notEqual(body.checkIn.checkedAt,payload.checkedAt);
 const stored=f.db.prepare('SELECT user_id,case_id,wellbeing_score,notes,submitted_at FROM check_ins WHERE id=?').get(body.checkIn.id);
 assert.equal(stored.user_id,1);assert.equal(stored.case_id,null);assert.equal(stored.wellbeing_score,3);assert.equal(stored.notes,payload.note);assert.equal(stored.submitted_at,body.checkIn.checkedAt);

 const reopened=await worker.fetch(request('GET'),f.env,{});
 assert.equal(reopened.status,200);
 const rows=(await reopened.json()).checkIns;
 assert.equal(rows.length,1);assert.equal(rows[0].id,body.checkIn.id);assert.equal(rows[0].mood,'OK');assert.equal(rows[0].note,payload.note);
 const other=await worker.fetch(request('GET',undefined,2),f.env,{});
 assert.equal(other.status,200);assert.deepEqual((await other.json()).checkIns,[]);
});
