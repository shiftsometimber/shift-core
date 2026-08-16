import fs from 'node:fs';

const source=fs.readFileSync('member-state-fast-v1.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
const fail=[];
const need=(ok,message)=>{if(!ok)fail.push(message)};

need(/path!=='\/v1\/member-state'\|\|!\['GET','PATCH'\]\.includes\(request\.method\)/.test(source),'route is not restricted to exact member-state GET/PATCH requests');
need(/sst_session=/.test(source)&&/SHA-256/.test(source),'session cookie is not hashed before lookup');
need(/revoked_at/.test(source)&&/expires_at/.test(source),'revoked and expired sessions are not rejected');
need(/WHERE s\.token_hash=\?/.test(source)&&/WHERE user_id=\?/.test(source),'D1 lookups are not parameterised');
need(/body\.myWhy\?\?safe\(current\?\.my_why\)/.test(source)&&/body\.preferences\?\?safe\(current\?\.preferences\)/.test(source),'partial writes do not preserve existing member state');
need(!/console\.(?:log|warn|error)/.test(source),'fast member-state route writes runtime data to logs');
need(/await env\.DB\.prepare\('UPDATE user_sessions/.test(source)&&/await env\.DB\.prepare\('UPDATE member_status/.test(source),'D1 side effects are not awaited');
need(/fastMemberStateRoute\(request,env\)/.test(entry),'worker entry does not invoke the fast member-state route');
for(const file of ['member-product-v4.js','member-product-v5.js','member-product-v6.js','member-product-v7.js','member-product-v8.js'])need(fs.readFileSync(file,'utf8').includes('authenticateMember(request,env)'),`${file} still uses legacy schema-bootstrap authentication for Grub/Fit`);
need(!fs.readFileSync('member-product-v4.js','utf8').includes('await ensurePlanSchema(env.DB)'),'Grub/Fit customer requests still run plan-table DDL');
need(!fs.readFileSync('member-product-v5.js','utf8').includes('await ensureFeedbackSchema(env.DB)'),'Grub/Fit customer requests still run feedback-table DDL');
need(!fs.readFileSync('member-product-v7.js','utf8').includes('await ensureStructuredLaunchSeed(env.DB)'),'Grub/Fit customer requests still run launch seeding');

if(fail.length){console.error(JSON.stringify({proof:'FAST_MEMBER_STATE_SOURCE',status:'FAIL',fail},null,2));process.exit(1)}
console.log(JSON.stringify({proof:'FAST_MEMBER_STATE_SOURCE',status:'PASS',checks:8},null,2));
