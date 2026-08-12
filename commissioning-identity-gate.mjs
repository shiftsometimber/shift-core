import assert from 'node:assert/strict';
import {verifyGithubOidc,handleCommissioningIdentity} from './commissioning-identity-v1.js';
const enc=x=>Buffer.from(typeof x==='string'?x:JSON.stringify(x)).toString('base64url');
const {publicKey,privateKey}=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await crypto.subtle.exportKey('jwk',publicKey);jwk.kid='commissioning-test';jwk.alg='RS256';jwk.use='sig';
const realFetch=globalThis.fetch;globalThis.fetch=async url=>String(url).includes('/.well-known/jwks')?new Response(JSON.stringify({keys:[jwk]}),{status:200}):realFetch(url);
const now=Math.floor(Date.now()/1000),base={iss:'https://token.actions.githubusercontent.com',aud:'shift-production-commissioning',repository:'shiftsometimber/shift-core',actor_id:'315011648',workflow_ref:'shiftsometimber/shift-core/.github/workflows/production-commissioning.yml@refs/heads/main',iat:now-5,nbf:now-5,exp:now+300};
async function jwt(claims=base){const h=enc({alg:'RS256',kid:jwk.kid,typ:'JWT'}),p=enc(claims),signed=`${h}.${p}`,sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',privateKey,new TextEncoder().encode(signed));return `${signed}.${Buffer.from(sig).toString('base64url')}`}
const valid=await jwt();assert.equal((await verifyGithubOidc(valid)).ok,true);
assert.equal((await verifyGithubOidc(await jwt({...base,actor_id:'999'}))).ok,false,'wrong actor accepted');
assert.equal((await verifyGithubOidc(await jwt({...base,aud:'wrong'}))).ok,false,'wrong audience accepted');
assert.equal((await verifyGithubOidc(await jwt({...base,repository:'evil/fork'}))).ok,false,'wrong repository accepted');
assert.equal((await verifyGithubOidc(await jwt({...base,workflow_ref:'shiftsometimber/shift-core/.github/workflows/evil.yml@refs/heads/main'}))).ok,false,'wrong workflow accepted');

const statements=[];const DB={prepare(sql){return{bind(...args){return{async run(){statements.push({sql,args});return{success:true}}}}}}};
const req=new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers:{'content-type':'application/json','x-shift-commissioning-oidc':valid},body:JSON.stringify({email:'shiftsometimber+finish-123-a@gmail.com',firstName:'DaveA',password:'irrelevant'})});
const response=await handleCommissioningIdentity(req,{DB},{},async()=>new Response(JSON.stringify({ok:true,emailVerified:false,user:{id:42,email:'shiftsometimber+finish-123-a@gmail.com'}}),{status:201,headers:{'content-type':'application/json','set-cookie':'sst_session=test; Path=/; HttpOnly'}}));
assert.equal(response.status,201);const data=await response.json();assert.equal(data.emailVerified,true);assert.equal(data.verificationRequired,false);assert.equal(data.commissioningIdentity,'github_actions_oidc');assert.match(response.headers.get('set-cookie')||'',/sst_session=test/);assert.ok(statements.some(x=>x.sql.includes('UPDATE user_auth SET email_verified=1')));
const badEmail=new Request('https://api.shiftsometimber.co.uk/v1/auth/register',{method:'POST',headers:{'content-type':'application/json','x-shift-commissioning-oidc':valid},body:JSON.stringify({email:'realperson@example.com'})});
assert.equal((await handleCommissioningIdentity(badEmail,{DB},{},async()=>{throw new Error('must not reach registration')})).status,403);
console.log('PASS secure commissioning identity: RS256 GitHub OIDC requires exact audience/repository/actor/approved workflow and is restricted to synthetic Shift aliases; public email verification remains untouched.');
