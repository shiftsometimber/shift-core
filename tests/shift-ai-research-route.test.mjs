import test from 'node:test';
import assert from 'node:assert/strict';
import {askTimberRoutes} from '../ask-timber-v1.js';
const request=(body,origin='https://shiftsometimber.co.uk')=>new Request('https://shiftsometimber.co.uk/v1/ai/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',Cookie:'sst_session=PRIVATE_SESSION'},body:JSON.stringify(body)});
test('research uses the existing Ask Timber route without private journey, model or conversation access',async()=>{
 const env={AI:{run(){throw Error('research must not generate')}},DB:{exec(){throw Error('index unavailable')},prepare(){throw Error('must not read member data')}}};
 const data=await(await askTimberRoutes(request({message:'Show research about testosterone; my result is 7.2',research:true,useJourney:true}),env)).json();
 assert.equal(data.mode,'research');assert.equal(data.journeyUsed,false);assert(data.sources.length);assert(!JSON.stringify(data).includes('7.2'));assert.match(data.limitations,/not clinically approved/);
});
test('urgent signposting and truthful human handoff still precede research',async()=>{
 for(const [message,mode]of [['I have severe chest pain. Find research about weight loss','safety'],['Can you contact Matt about testosterone research?','human_handoff']]){
  const data=await(await askTimberRoutes(request({message,research:true}),{})).json();assert.equal(data.mode,mode);assert.equal(data.research,undefined);
 }
});
test('research keeps the same origin boundary and explicit opt-in',async()=>{
 assert.equal((await askTimberRoutes(request({message:'protein research',research:true},'https://evil.invalid'),{})).status,403);
 assert.equal((await askTimberRoutes(request({message:'protein research'}),{})).status,503);
 const data=await(await askTimberRoutes(request({message:'protein research',research:true}),{})).json();assert.equal(data.mode,'research');assert.equal(data.sources[0].url.includes('nhs.uk'),true);
});
