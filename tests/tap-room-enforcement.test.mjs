import test from 'node:test';
import assert from 'node:assert/strict';
import {tapRoomRoutes} from '../tap-room-v1.js';

class Statement {
  constructor(db,sql){this.db=db;this.sql=sql;this.args=[]}
  bind(...args){this.args=args;return this}
  async first(){
    const {sql}=this,config=this.db.config;
    if(sql.includes('FROM user_sessions s JOIN users u'))return{id:1,first_name:'Matt',session_id:11,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:null};
    if(sql.includes('FROM user_auth a LEFT JOIN tap_room_profiles'))return{email_verified:1,profile_id:1,display_name:'Matt',joined_at:'2026-08-01',treatment_rules_ack_at:config.ack?'2026-08-01':null,privacy_prompt_seen_at:null,status:config.profileStatus||'active'};
    if(sql.includes('SELECT user_id FROM member_state'))return{user_id:1};
    if(sql.includes('FROM tap_room_restrictions'))return config.restricted?{id:3,ends_at:'2099-01-01T00:00:00.000Z'}:null;
    if(sql.includes('SELECT id,room_slug,user_id FROM tap_room_posts'))return config.parent===false?null:{id:10,room_slug:config.roomSlug||'sport-banter',user_id:2};
    if(sql.includes('SELECT 1 blocked FROM tap_room_blocks'))return config.blocked?{blocked:1}:null;
    if(sql.includes("SELECT id FROM tap_room_posts WHERE id=? AND status='visible'"))return config.reportPost===false?null:{id:10};
    if(sql.includes('FROM tap_room_reports WHERE reporter_user_id=? AND post_id=?'))return config.duplicateReport?{id:91}:null;
    if(sql.includes('SELECT COUNT(*) n FROM tap_room_reports'))return{n:config.reportCount||0};
    return null;
  }
  async run(){this.db.runs.push({sql:this.sql,args:this.args});return{meta:{last_row_id:101}}}
  async all(){return{results:[]}}
}

class FakeDb {
  constructor(config={}){this.config=config;this.runs=[]}
  prepare(sql){return new Statement(this,sql)}
  async batch(statements){return statements.map(()=>({success:true}))}
}

function env(config={}){return{DB:new FakeDb(config),TAP_ROOM_MODERATION_OWNER:"Matt O'Brien",TAP_ROOM_MODERATION_BACKUP:"Linda O'Brien",TAP_ROOM_P0_EMAIL:'hello@shiftsometimber.co.uk'}}
function request(path,body={body:'A normal reply'}){return new Request(`https://shiftsometimber.co.uk${path}`,{method:'POST',headers:{Cookie:'sst_session=valid-session','Content-Type':'application/json'},body:JSON.stringify(body)})}
async function payload(response){return{status:response.status,body:await response.json()}}

test('a posting restriction also blocks replies',async()=>{
  const result=await payload(await tapRoomRoutes(request('/v1/tap-room/posts/10/replies'),env({restricted:true}),{}));
  assert.equal(result.status,403);assert.equal(result.body.error,'posting_restricted');
});

test('Treatment acknowledgement is required before replying',async()=>{
  const result=await payload(await tapRoomRoutes(request('/v1/tap-room/posts/10/replies'),env({roomSlug:'treatment-experiences',ack:false}),{}));
  assert.equal(result.status,428);assert.equal(result.body.error,'treatment_rules_acknowledgement_required');
});

test('blocking either way prevents interaction with a thread owner',async()=>{
  const result=await payload(await tapRoomRoutes(request('/v1/tap-room/posts/10/replies'),env({blocked:true,ack:true}),{}));
  assert.equal(result.status,403);assert.equal(result.body.error,'interaction_blocked');
});

test('removed profiles cannot re-enter the Tap Room',async()=>{
  const result=await payload(await tapRoomRoutes(new Request('https://shiftsometimber.co.uk/v1/tap-room',{headers:{Cookie:'sst_session=valid-session'}}),env({profileStatus:'removed'}),{}));
  assert.equal(result.status,403);assert.equal(result.body.error,'tap_room_access_suspended');
});

test('reports require a real visible post',async()=>{
  const result=await payload(await tapRoomRoutes(request('/v1/tap-room/posts/999/report',{category:'crisis'}),env({reportPost:false}),{}));
  assert.equal(result.status,404);assert.equal(result.body.error,'post_not_found');
});

test('duplicate reports are de-duplicated before P0 delivery',async()=>{
  let sent=0;const e=env({duplicateReport:true});e.EMAIL={send:async()=>{sent++}};
  const result=await payload(await tapRoomRoutes(request('/v1/tap-room/posts/10/report',{category:'crisis'}),e,{}));
  assert.equal(result.status,200);assert.equal(result.body.duplicate,true);assert.equal(sent,0);
});
