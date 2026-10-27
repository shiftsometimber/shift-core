import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fixture} from '../../health-passport/fixture.mjs';
import {supportTeamRoutes} from '../../shift-coach/support-team.mjs';
import {accountThreadSubject} from '../../shift-coach/support.mjs';
test('the live acceptance operator cannot list, claim or reply to a real member ticket',async t=>{
 const f=fixture({seed:false});t.after(()=>f.close());
 f.db.exec(`CREATE TABLE member_status(user_id INTEGER PRIMARY KEY,source TEXT);
 CREATE TABLE hq_users(id INTEGER PRIMARY KEY,email TEXT,name TEXT,role TEXT,status TEXT,mfa_enabled INTEGER,last_login_at TEXT);
 CREATE TABLE hq_sessions(id INTEGER PRIMARY KEY,hq_user_id INTEGER,token_hash TEXT,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);
 CREATE TABLE support_tickets(reference TEXT PRIMARY KEY,user_id INTEGER,subject TEXT,priority TEXT,status TEXT,body TEXT,assigned_hq_user_id INTEGER,created_at TEXT,updated_at TEXT,closed_at TEXT);`);
 f.db.prepare('UPDATE users SET email=? WHERE id=1').run('my-timber-v6-dan@example.invalid');
 f.db.prepare('INSERT INTO member_status VALUES(?,?)').run(1,'my_timber_release_test_v6');
 f.db.prepare('INSERT INTO member_status VALUES(?,?)').run(2,'member');
 const token='isolated-hq-test-token';
 f.db.prepare('INSERT INTO hq_users VALUES(?,?,?,?,?,?,?)').run(9001,'operator@example.invalid','My Timber automated test operator','support_test','active',0,null);
 f.db.prepare('INSERT INTO hq_sessions VALUES(?,?,?,?,?,?)').run(1,9001,createHash('sha256').update(token).digest('hex'),'2099-01-01T00:00:00Z',null,null);
 const refs=[1,2].map(id=>'APP-'+id+'-'+('test-reference-'+id).padEnd(20,'x'));
 for(const id of [1,2])f.db.prepare('INSERT INTO support_tickets VALUES(?,?,?,?,?,?,?,?,?,?)').run(refs[id-1],id,accountThreadSubject,'normal','open',JSON.stringify({format:'shift-coach-thread-1',request:id===1?'Synthetic app question':'Private member text',replies:[],confirmation:null}),null,'2026-10-26T12:00:00Z','2026-10-26T12:00:00Z',null);
 const req=body=>new Request('https://shiftsometimber.co.uk/v1/hq/support/coaching',{method:body?'POST':'GET',headers:{Origin:'https://shiftsometimber.co.uk',Cookie:'sst_hq_session='+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
 const listed=await(await supportTeamRoutes(req(),f.env)).json();
 assert.equal(listed.tickets.length,1);assert.equal(listed.tickets[0].reference,refs[0]);assert.doesNotMatch(JSON.stringify(listed),/Private member text/);
 for(const kind of ['claim','reply']){
  const denied=await supportTeamRoutes(req({kind,reference:refs[1],token:'unknown',operationId:crypto.randomUUID(),text:'A test reply'}),f.env);
  assert.equal(denied.status,404);
 }
 const ticket=listed.tickets[0];
 assert.equal((await supportTeamRoutes(req({kind:'claim',reference:ticket.reference,token:ticket.token,operationId:crypto.randomUUID()}),f.env)).status,201);
 assert.equal(f.db.prepare('SELECT assigned_hq_user_id FROM support_tickets WHERE user_id=2').get().assigned_hq_user_id,null);
});
