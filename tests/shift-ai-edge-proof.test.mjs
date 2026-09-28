import test from 'node:test';import assert from 'node:assert/strict';
import {readSiteAnswer,observeEdgeAnswer} from '../release/ai-response-proof.mjs';
const source={url:'https://shiftsometimber.co.uk/life-back',reviewState:'published_site'};
const value=(delivery='cached_public',answer='Life Back helps you record your own goals and progress [1].')=>({ok:true,mode:'grounded',journeyUsed:false,sources:[source],answer,delivery});
const json=v=>Response.json(v,{headers:{'cf-ray':'123-IAD'}});
const stream=v=>new Response('event: delta\ndata: '+JSON.stringify({text:v.answer})+'\n\nevent: done\ndata: '+JSON.stringify(v)+'\n\n',{headers:{'content-type':'text/event-stream','cf-ray':'123-IAD'}});
test('valid public stream and cached JSON both retain source/privacy evidence',async()=>{
 for(const response of [stream(value('streamed')),json(value())]){const r=await readSiteAnswer(response,{sources:[source]});assert.equal(r.edge,'IAD');assert.equal(r.journeyUsed,false);}
});
test('fresh proof cannot silently accept a cache hit',async()=>{await assert.rejects(()=>readSiteAnswer(json(value()),{requireStream:true}),/Fresh answer must stream/)});
test('private, ungrounded, unrelated or malformed cached responses fail closed',async()=>{
 for(const patch of [{journeyUsed:true},{ok:false},{mode:'fallback'},{sources:[{...source,url:'https://example.invalid'}]},{sources:[{...source,reviewState:'withdrawn'}]},{answer:'short'}])await assert.rejects(()=>readSiteAnswer(json({...value(),...patch})));
});
test('interrupted and incomplete streams cannot pass as fresh answers',async()=>{
 for(const text of ['event: error\ndata: {"error":"interrupted"}\n\n','event: delta\ndata: {"text":"partial"}\n\n'])await assert.rejects(()=>readSiteAnswer(new Response(text,{headers:{'content-type':'text/event-stream','cf-ray':'abc-IAD'}})));
});
test('evidence or missing data-centre receipt cannot be ignored',async()=>{
 await assert.rejects(()=>readSiteAnswer(Response.json(value())));
 await assert.rejects(()=>readSiteAnswer(json(value()),{sources:[{...source,title:'different evidence'}]}));
});
test('cache equality is enforced within a centre, while a second centre has an independent cache',()=>{
 const seen=new Map(),a={...value('streamed'),edge:'IAD'};assert.equal(observeEdgeAnswer(seen,a),false);
 assert.equal(observeEdgeAnswer(seen,{...a,delivery:'cached_public'}),true);
 assert.throws(()=>observeEdgeAnswer(seen,{...a,delivery:'cached_public',answer:'different'}),/Cached answer changed/);
 assert.equal(observeEdgeAnswer(seen,{...a,edge:'LHR',delivery:'cached_public',answer:'Independent published answer [1].'}),false);
 assert.equal(observeEdgeAnswer(seen,{...a,edge:'LHR',delivery:'cached_public',answer:'Independent published answer [1].'}),true);
});
