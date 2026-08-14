import fs from 'node:fs';
const source=fs.readFileSync('member-experience-v2.js','utf8');
const checks={
  bootstrapWrapped:/memberBootstrap[\s\S]*return memberCors\(json\(/.test(source),
  proactiveDisabledWrapped:/proactive_disabled[\s\S]{0,180}memberCors|memberCors\(json\(\{ok:true,insights:\[\],reason:'proactive_disabled'/.test(source),
  proactiveEmptyWrapped:/if\(!insight\)return memberCors\(json\(/.test(source),
  proactiveInsightWrapped:/markInsightDelivered[\s\S]*return memberCors\(json\(\{ok:true,insights:\[insight\]/.test(source),
  credentials:/Access-Control-Allow-Credentials','true'/.test(source),
  memberOrigin:/https:\/\/shiftsometimber\.co\.uk/.test(source),
  originEcho:/Access-Control-Allow-Origin/.test(source),
  varyOrigin:/headers\.set\('Vary','Origin'\)/.test(source),
};
const failed=Object.entries(checks).filter(([,ok])=>!ok).map(([k])=>k);
console.log(JSON.stringify({proof:'G4_008_PROACTIVE_BROWSER_CORS_SOURCE_V1',checks,failed},null,2));
if(failed.length)throw new Error(`G4-008 proactive browser CORS source gate failed: ${failed.join(', ')}`);
console.log('PASS G4-008 proactive browser CORS source gate: bootstrap/feed responses expose credentialed member-origin CORS across disabled, empty and delivered states.');
