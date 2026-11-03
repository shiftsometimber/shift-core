import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';
import {v7CrewRoutes,v7CrewSnapshot,publishV7Effort} from '../v7-crew.mjs';
import {v7State} from '../v7-model.mjs';
const schema=fs.readFileSync(new URL('../v7-crew-schema.sql',import.meta.url),'utf8');
function setup(t){const f=fixture({seed:false});t.after(()=>f.close());f.db.exec(schema);f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',1),(2,'my_shift_health_tracking',1)");return f;}
const request=(input,id=1)=>new Request('https://shiftsometimber.co.uk/v1/my-timber/crew',{method:'POST',headers:{Origin:'https://shiftsometimber.co.uk',Cookie:'sst_session=test-only-member-'+id,'Content-Type':'application/json'},body:JSON.stringify({expectedAccount:id,...input})});
test('crew ACLs come from authenticated membership and disclose only opted-in effort',async t=>{
 const f=setup(t);const made=await v7CrewRoutes(request({action:'create',alias:'One',consented:true}),f.env);assert.equal(made.status,200);
 const other=await v7CrewRoutes(request({action:'create',alias:'Two',consented:true},2),f.env);assert.equal(other.status,200);
 assert.deepEqual((await v7CrewSnapshot(f.env.DB,1)).members.map(m=>m.alias),['One']);
 assert.deepEqual((await v7CrewSnapshot(f.env.DB,2)).members.map(m=>m.alias),['Two']);
 assert.equal((await v7CrewRoutes(request({action:'invite',expectedAccount:1},2),f.env)).status,409);
 const payload=JSON.stringify(await made.json());assert(!/user_id|weight|BMI|symptom|medicine/.test(payload));
});
test('joining requires deliberate consent, an unexpired invitation and space',async t=>{
 const f=setup(t);await v7CrewRoutes(request({action:'create',alias:'One',consented:true}),f.env);
 const invitation=await(await v7CrewRoutes(request({action:'invite'}),f.env)).json(),code=new URL(invitation.inviteUrl).searchParams.get('crew');
 assert.equal((await v7CrewRoutes(request({action:'join',alias:'Two',code},2),f.env)).status,400);
 assert.equal((await v7CrewRoutes(request({action:'join',alias:'Two',code,consented:true},2),f.env)).status,200);
 assert.equal((await v7CrewSnapshot(f.env.DB,2)).members.length,2);
 f.db.exec("INSERT INTO consents(user_id,consent_type,granted) VALUES(1,'my_shift_health_tracking',0)");
 assert.deepEqual((await v7CrewSnapshot(f.env.DB,2)).members.map(m=>m.alias),['Two']);
 await v7CrewRoutes(request({action:'leave'},2),f.env);assert.equal((await v7CrewSnapshot(f.env.DB,2)).joined,false);
});
test('Monday reads the new weekly score without resetting lifetime pile',async t=>{
 const f=setup(t);await v7CrewRoutes(request({action:'create',alias:'One',consented:true}),f.env);
 const progress={v7:{days:{'2026-11-01':{on:'2026-11-01',log:{id:'one'}}}}};
 await publishV7Effort(f.env.DB,1,progress,'2026-11-01T20:00:00Z');
 assert.equal((await v7CrewSnapshot(f.env.DB,1,'2026-11-01T20:00:00Z')).members[0].logs,1);
 assert.equal((await v7CrewSnapshot(f.env.DB,1,'2026-11-02T02:00:00Z')).members[0].logs,0);
 assert.equal(v7State(progress,'2026-11-02T02:00:00Z').count,1);
});
