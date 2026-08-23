import fs from 'node:fs';
const read=file=>fs.readFileSync(file,'utf8'),need=(ok,message)=>{if(!ok)throw new Error(message)};
const worker=read('worker-entry-v6.js'),config=read('wrangler.my-timber-preview.template.jsonc'),schema=read('preview/bootstrap.sql'),page=read('frontend/member/physical-iphone-signoff.html'),workflow=read('.github/workflows/my-timber-today-preview.yml');
for(const marker of ['physicalIphoneSignoffRoutes','/physical-iphone-signoff','PHYSICAL_IPHONE_SIGNOFF_ENABLED'])need(worker.includes(marker)||config.includes(marker),`missing runtime control: ${marker}`);
for(const marker of ['physical_iphone_signoffs','evidence_id TEXT NOT NULL UNIQUE','device_user_agent TEXT NOT NULL'])need(schema.includes(marker),`missing retained evidence field: ${marker}`);
for(const marker of ['physical iPhone','homepage','route','results','product','my_timber','no_overflow','no_dead_ends','Download sanitised proof JSON'])need(page.includes(marker),`missing sign-off UI contract: ${marker}`);
need(workflow.includes('physical-iphone-signoff-source-gate.mjs'),'preview workflow does not enforce physical sign-off gate');
need(workflow.includes('/physical-iphone-signoff'),'preview workflow does not publish one-link sign-off');
console.log('PASS physical iPhone sign-off source gate');
