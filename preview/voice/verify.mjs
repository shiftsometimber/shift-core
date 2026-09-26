import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
import edits from './edits.json' with {type:'json'};
const base=fs.readFileSync('preview/voice/deploy.txt','utf8').match(/https:\/\/shift-voice-editorial-preview\.[a-z0-9.-]+\.workers\.dev/)?.[0];assert.ok(base);
const rows=[];
for(const path of [...new Set(edits.filter(e=>e.kind==='public').map(e=>e.route))]){
 const r=await fetch(base+path),html=await r.text();assert.equal(r.status,200,path+' '+html.slice(0,150));
 for(const e of edits.filter(e=>e.kind==='public'&&e.route===path)){assert.ok(html.includes(e.new),path+': missing proposed copy');assert.ok(!html.includes(e.old),path+': old copy remained');}
 rows.push({path,status:r.status,changes:Number(r.headers.get('x-voice-changes')),sha256:createHash('sha256').update(html).digest('hex')});
}
for(const path of ['/__review','/__changes','/__member-copy','/__qa?width=390&path=/life-back'])assert.equal((await fetch(base+path)).status,200);
assert.equal((await fetch(base+'/v1/member/state',{method:'POST',body:'{}'})).status,405);
const liveFingerprint=await (await fetch('https://shiftsometimber.co.uk/DEPLOYMENT-FINGERPRINT.json')).json();
fs.writeFileSync('preview/voice/rendered-proof.json',JSON.stringify({base,rows,livePagesFingerprint:liveFingerprint.aggregate_sha256,productionChanged:false,memberExamples:'static; authenticated full-screen checks not yet performed'},null,2));console.log('PREVIEW_URL='+base+'/__review');console.log(JSON.stringify(rows));
