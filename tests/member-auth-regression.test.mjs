import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticateMember} from '../member-state-fast-v1.js';

async function hash(value){const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));return[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('')}

class AuthDb {
  constructor(validHash){this.validHash=validHash;this.lookups=[];this.touches=0}
  prepare(sql){
    const db=this,statement={args:[],bind(...args){this.args=args;return this},async first(){if(sql.includes('FROM user_sessions')){db.lookups.push(this.args[0]);if(this.args[0]===db.validHash)return{id:42,session_id:7,expires_at:'2099-01-01T00:00:00.000Z',revoked_at:null}}return null},async run(){if(sql.includes('UPDATE user_sessions SET last_used_at'))db.touches++;return{success:true}}};
    return statement;
  }
}

test('a stale duplicate cookie cannot hide the valid session cookie',async()=>{
  const db=new AuthDb(await hash('valid-token'));
  const request=new Request('https://shiftsometimber.co.uk/v1/member-state',{headers:{Cookie:'sst_session=stale-token; theme=dark; sst_session=valid-token'}});
  const result=await authenticateMember(request,{DB:db});
  assert.equal(result.userId,42);assert.equal(db.lookups.length,2);assert.equal(db.touches,1);
});

test('an invalid session clears the parent-domain cookie',async()=>{
  const db=new AuthDb('never-matches');
  const request=new Request('https://shiftsometimber.co.uk/v1/member-state',{headers:{Cookie:'sst_session=invalid'}});
  const result=await authenticateMember(request,{DB:db});
  assert.equal(result.response.status,401);
  assert.match(result.response.headers.get('set-cookie'),/Domain=\.shiftsometimber\.co\.uk/);
  assert.match(result.response.headers.get('set-cookie'),/Max-Age=0/);
});
