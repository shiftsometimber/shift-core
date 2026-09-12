import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const pins=JSON.parse(readFileSync('member-experience/staging/pins.json'));
// Same immutable Pages source as the approved workplace stage; fail on drift.
for(const p of pins){
  const data=p.source==='worker'?readFileSync(resolve('frontend/member',p.path)):process.env.SHIFT_WORK_PAGES_ROOT?readFileSync(resolve(process.env.SHIFT_WORK_PAGES_ROOT,p.path)):Buffer.from(await(await fetch('https://95e283ac.projectshift.pages.dev/'+p.path)).arrayBuffer());
  if(createHash('sha256').update(data).digest('hex')!==p.sha256)throw Error('Member preview source mismatch: '+p.path);
  const out='work/staging/generated/assets/staging/member-source/'+p.path;
  mkdirSync(dirname(out),{recursive:true});writeFileSync(out,data);
}
console.log('Verified immutable member preview sources. No live member data is used.');
