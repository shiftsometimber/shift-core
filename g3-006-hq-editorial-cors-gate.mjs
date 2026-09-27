import assert from 'node:assert/strict';
import fs from 'node:fs';
import {knowledgeEditorialRoutes} from './knowledge-editorial-v1.js';
const origin='https://hq.shiftsometimber.co.uk';
const env={ALLOWED_ORIGINS:''};
for(const path of ['/v1/hq/articles','/v1/hq/articles/42/review','/v1/hq/articles/42/publish']){
  const response=await knowledgeEditorialRoutes(new Request(`https://api.shiftsometimber.co.uk${path}`,{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}}),env,{});
  assert.equal(response.status,204,path);
  assert.equal(response.headers.get('access-control-allow-origin'),origin,path);
  assert.equal(response.headers.get('access-control-allow-credentials'),'true',path);
  assert.match(response.headers.get('access-control-allow-methods')||'',/GET/);
  assert.match(response.headers.get('access-control-allow-methods')||'',/POST/);
  assert.match(response.headers.get('access-control-allow-headers')||'',/Content-Type/i);
}
const hostile=await knowledgeEditorialRoutes(new Request('https://api.shiftsometimber.co.uk/v1/hq/articles',{method:'OPTIONS',headers:{Origin:'https://evil.example','Access-Control-Request-Method':'GET'}}),env,{});
assert.equal(hostile.status,204);
assert.equal(hostile.headers.get('access-control-allow-origin'),null,'hostile origin must not be reflected');
const source=fs.readFileSync('knowledge-editorial-v1.js','utf8');
for(const marker of ['withHqCors(base,request,env)','withHqCors(a.response,request,env)','withHqCors(json(out,out.status||200),request,env)','withHqCors(response,request,env)','withHqCors(await hq.fetch(request,env,ctx),request,env)'])assert.ok(source.includes(marker),`missing response CORS wrapper ${marker}`);
console.log(JSON.stringify({proof:'G3_006_HQ_EDITORIAL_CORS_V1',allowedOrigin:origin,preflights:3,hostileOriginDenied:true,responsePathsWrapped:true},null,2));
console.log('PASS G3-006 HQ editorial CORS gate: credentialed HQ preflight is allowed for list/review/publish, hostile origin is not reflected, and downstream editorial responses retain the same boundary.');
