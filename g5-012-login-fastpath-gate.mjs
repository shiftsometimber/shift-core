import fs from 'node:fs';
const login=fs.readFileSync('member-login-fastpath-v1.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const fail=[];const need=(ok,msg)=>{if(!ok)fail.push(msg)};
need(login.includes("const LOGIN_PATH='/v1/auth/login'"),'fast path is not bounded to member login');
need(login.includes("iterations<100000"),'PBKDF2 work factor floor weakened');
need(login.includes("hash:'SHA-256'")&&login.includes("scheme!==PBKDF2_SCHEME"),'password verification contract weakened');
need(login.includes('constantTimeEqual'),'password hash comparison is not constant-time');
need(login.includes('const LOCK_AFTER=8')&&login.includes('15*60*1000'),'existing 8-attempt/15-minute lockout contract weakened');
need(login.includes("HttpOnly; Secure; SameSite=Lax"),'session cookie security contract weakened');
need(login.includes('crypto.getRandomValues')&&login.includes("token_hash"),'session entropy/hash contract weakened');
need(login.includes('await env.DB.batch([')&&login.includes("'auth.login'")&&login.includes("INSERT INTO user_sessions"),'successful post-password mutations are not collapsed into one D1 batch');
need(entry.includes("import {fastMemberLogin} from './member-login-fastpath-v1.js'"),'canonical Worker does not load fast login');
need(entry.includes('const fastLogin=await fastMemberLogin(request,env);if(fastLogin){await recordFinalLogin'),'fast login bypasses product analytics login/return evidence');
if(fail.length){console.error(JSON.stringify({proof:'G5_012_LOGIN_FASTPATH_SOURCE',status:'FAIL',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'G5_012_LOGIN_FASTPATH_SOURCE',status:'PASS',checks:10,boundary:'same PBKDF2, lockout, session-cookie and analytics semantics; only successful post-password D1 mutations are batched'},null,2));
