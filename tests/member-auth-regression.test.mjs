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

test('an invalid session rejects access without mutating a possibly newer cookie',async()=>{
  const db=new AuthDb('never-matches');
  const request=new Request('https://shiftsometimber.co.uk/v1/member-state',{headers:{Cookie:'sst_session=invalid'}});
  const result=await authenticateMember(request,{DB:db});
  assert.equal(result.response.status,401);
  assert.equal(result.response.headers.get('set-cookie'),null);
});

import worker from '../worker.js';
for(const path of ['/v1/member-state','/v1/me'])test('late expired response cannot erase a fresh login: '+path,async()=>{
 const db=new AuthDb(await hash('valid-token'));
 const original=db.prepare.bind(db);db.prepare=sql=>{const s=original(sql);if(sql.includes('FROM sqlite_master'))s.first=async()=>({count:s.args.length});return s};
 const request=new Request('https://shiftsometimber.co.uk'+path,{headers:{Cookie:'sst_session=old-revoked'}});
 const stale=path==='/v1/member-state'?(await authenticateMember(request,{DB:db})).response:await worker.fetch(request,{DB:db},{});
 assert.equal(stale.status,401);
 // The old response arrives after a different ordinary login issued its cookie.
 let current='valid-token';if(/sst_session=;/.test(stale.headers.get('set-cookie')||''))current='';
 const fresh=await authenticateMember(new Request('https://shiftsometimber.co.uk/v1/member-state',{headers:{Cookie:'sst_session='+current}}),{DB:db});
 assert.equal(fresh.userId,42,'a rejected old read must not delete the new session');
 assert.equal(stale.headers.get('set-cookie'),null);
});
test('explicit logout still revokes and clears the parent and legacy host cookies',async()=>{
 const db=new AuthDb('never-matches');const original=db.prepare.bind(db);db.prepare=sql=>{const s=original(sql);if(sql.includes('FROM sqlite_master'))s.first=async()=>({count:s.args.length});return s};
 const r=await worker.fetch(new Request('https://shiftsometimber.co.uk/v1/auth/logout',{method:'POST',headers:{Cookie:'sst_session=old'}}),{DB:db},{});
 assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Domain=\.shiftsometimber\.co\.uk/);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);
});
