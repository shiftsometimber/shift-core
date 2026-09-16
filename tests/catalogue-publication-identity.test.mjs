import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import {verifyCataloguePublicationOidc,verifyNewsroomPublicationOidc,verifyGithubOidc} from '../commissioning-identity-v1.js';
import {cataloguePublicationRoute} from '../catalogue-publication-v1.js';
import {CATALOGUE_PUBLICATION_RELEASE as release} from '../catalogue-publication-release-v1.mjs';

const encode=value=>Buffer.from(typeof value==='string'?value:JSON.stringify(value)).toString('base64url');
const algorithm={name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'};
const {publicKey,privateKey}=await crypto.subtle.generateKey(algorithm,true,['sign','verify']);
const wrongKeys=await crypto.subtle.generateKey(algorithm,true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',publicKey),kid:'fixed-publication-identity-test',alg:'RS256',use:'sig'};
let originalFetch;
before(()=>{originalFetch=globalThis.fetch;globalThis.fetch=async url=>{
  assert.equal(String(url),'https://token.actions.githubusercontent.com/.well-known/jwks','identity tests must not access another network destination');
  return Response.json({keys:[jwk]});
}});
after(()=>{globalThis.fetch=originalFetch});

function claims(audience='shift-catalogue-publication'){
  const now=Math.floor(Date.now()/1000);
  return{iss:'https://token.actions.githubusercontent.com',aud:audience,repository:'shiftsometimber/shift-core',repository_id:'1328867509',repository_owner_id:'315011648',actor_id:'315011648',workflow_ref:'shiftsometimber/shift-core/.github/workflows/cloudflare-production-promote.yml@refs/heads/main',ref:'refs/heads/main',sub:'repo:shiftsometimber@315011648/shift-core@1328867509:ref:refs/heads/main',event_name:'push',sha:'a'.repeat(40),iat:now-5,nbf:now-5,exp:now+300};
}
async function token(payload=claims(),{key=privateKey,header={}}={}){
  const signed=encode({alg:'RS256',kid:jwk.kid,typ:'JWT',...header})+'.'+encode(payload);
  const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(signed));
  return signed+'.'+Buffer.from(signature).toString('base64url');
}

test('real RSA-signed main push identity authorizes only its exact publication audience',async()=>{
  const catalogue=await token(),newsroom=await token(claims('shift-newsroom-publication'));
  assert.equal((await verifyCataloguePublicationOidc(catalogue)).ok,true);
  assert.equal((await verifyNewsroomPublicationOidc(newsroom)).ok,true);
  assert.equal((await verifyCataloguePublicationOidc(newsroom)).ok,false);
  assert.equal((await verifyNewsroomPublicationOidc(catalogue)).ok,false);
  assert.equal((await verifyGithubOidc(catalogue)).ok,false);
  assert.equal((await verifyGithubOidc(newsroom)).ok,false);
  const generic=await token({...claims('shift-production-commissioning'),workflow_ref:'shiftsometimber/shift-core/.github/workflows/production-commissioning.yml@refs/heads/main'});
  assert.equal((await verifyGithubOidc(generic)).ok,true,'existing commissioning policy still works');
  assert.equal((await verifyCataloguePublicationOidc(generic)).ok,false);
  assert.equal((await verifyNewsroomPublicationOidc(generic)).ok,false);
});

test('publication policy rejects another repo, actor, workflow, branch, subject, event or invalid source SHA',async()=>{
  const base=claims();
  const cases=[
    {iss:'https://hostile.example'}, {repository:'other/shift-core'},
    {repository_id:'1'}, {repository_owner_id:'1'}, {actor_id:'1'},
    {workflow_ref:base.workflow_ref+'/suffix'},
    {workflow_ref:base.workflow_ref.replace('@refs/heads/main','@refs/heads/feature')},
    {workflow_ref:base.workflow_ref.replace('cloudflare-production-promote.yml','production-commissioning.yml')},
    {workflow_ref:'fork/'+base.workflow_ref}, {ref:'refs/heads/feature'},
    {sub:'repo:shiftsometimber/shift-core:pull_request'},
    {sub:'repo:shiftsometimber/shift-core:environment:production'},
    {event_name:'pull_request'}, {event_name:'workflow_dispatch'},
    {sha:''}, {sha:'a'.repeat(39)}, {sha:'z'.repeat(40)}, {sha:'A'.repeat(40)}, {sha:['a'.repeat(40)]}
  ];
  for(const override of cases)assert.equal((await verifyCataloguePublicationOidc(await token({...base,...override}))).ok,false,JSON.stringify(override));
});

test('publication audiences must be exact scalars even when an array includes an otherwise valid value',async()=>{
  for(const aud of ['',null,'shift-production-commissioning',['shift-catalogue-publication'],['shift-catalogue-publication','shift-newsroom-publication'],['shift-production-commissioning','shift-catalogue-publication']]){
    const signed=await token({...claims(),aud});
    assert.equal((await verifyCataloguePublicationOidc(signed)).ok,false,JSON.stringify(aud));
    assert.equal((await verifyNewsroomPublicationOidc(signed)).ok,false,JSON.stringify(aud));
  }
});

test('publication rejects expired, stale, future, reversed, missing or nonnumeric time claims',async()=>{
  const base=claims(),now=Math.floor(Date.now()/1000);
  for(const override of [{exp:now-1},{iat:now-601},{iat:now+61},{nbf:now+61},{exp:now+601},{iat:base.exp+1},{nbf:base.exp+1},{iat:null},{exp:null},{nbf:null},{iat:'not-a-number'},{exp:'not-a-number'},{nbf:'not-a-number'},{iat:String(base.iat)},{exp:String(base.exp)},{nbf:String(base.nbf)},{iat:undefined},{exp:undefined},{nbf:undefined}]){
    assert.equal((await verifyCataloguePublicationOidc(await token({...base,...override}))).ok,false,JSON.stringify(override));
  }
});

test('publication requires the expected signing algorithm, known key and valid signature',async()=>{
  assert.equal((await verifyCataloguePublicationOidc(await token(claims(),{key:wrongKeys.privateKey}))).ok,false);
  assert.equal((await verifyCataloguePublicationOidc(await token(claims(),{header:{alg:'HS256'}}))).ok,false);
  assert.equal((await verifyCataloguePublicationOidc(await token(claims(),{header:{kid:'unknown-signing-key'}}))).ok,false);
  const signed=await token(),parts=signed.split('.');parts[1]=encode({...claims(),sha:'b'.repeat(40)});
  assert.equal((await verifyCataloguePublicationOidc(parts.join('.'))).ok,false,'modified signed claims');
  for(const malformed of ['', 'a.b', 'a.b.c','a.b.c.d'])assert.equal((await verifyCataloguePublicationOidc(malformed)).ok,false);
});

test('catalogue route refuses unauthenticated, cross-audience and non-POST requests without touching D1',async()=>{
  let accesses=0;const env={get DB(){accesses++;throw new Error('D1 must not be accessed')}};
  const url='https://api.shiftsometimber.co.uk/v1/commissioning/catalogue-publication';
  assert.equal((await cataloguePublicationRoute(new Request(url,{method:'POST',body:'{}'}),env)).status,403);
  assert.equal((await cataloguePublicationRoute(new Request(url),env)).status,405);
  const newsroom=await token(claims('shift-newsroom-publication'));
  assert.equal((await cataloguePublicationRoute(new Request(url,{method:'POST',headers:{'x-shift-catalogue-oidc':newsroom},body:'{}'}),env)).status,403);
  assert.equal(accesses,0);
});

test('authenticated selector cannot inject content, SQL, alternate hashes or oversized payloads',async()=>{
  let accesses=0;const env={get DB(){accesses++;throw new Error('D1 must not be accessed')}};
  const signed=await token(),selector={release_id:release.release_id,rows_sha256:release.rows_sha256};
  async function call(body,extraHeaders={}){return cataloguePublicationRoute(new Request('https://api.shiftsometimber.co.uk/v1/commissioning/catalogue-publication',{method:'POST',headers:{'content-type':'application/json','x-shift-catalogue-oidc':signed,...extraHeaders},body:typeof body==='string'?body:JSON.stringify(body)}),env)}
  for(const body of [{...selector,rows_sha256:'0'.repeat(64)},{...selector,release_id:'0'.repeat(64)},{...selector,rows:[]},{...selector,sql:'DELETE FROM structured_content'},{...selector,database:'DB'},[],{},null]){
    const response=await call(body);assert.equal(response.status,409);assert.equal((await response.json()).error,'catalogue_selector_mismatch');
  }
  for(const [body,headers] of [['{',{}],[' '.repeat(1025),{}],[selector,{'content-length':'1025'}]]){
    const response=await call(body,headers);assert.equal(response.status,400);assert.equal((await response.json()).error,'catalogue_selector_invalid');
  }
  assert.equal(accesses,0);
});
