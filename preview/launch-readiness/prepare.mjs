import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash,randomBytes} from 'node:crypto';
import {repairTreatmentCentre,repairTreatmentOrderController} from '../../public-promise-accuracy-v1.mjs';
const dir='work/staging/generated',config=JSON.parse(readFileSync(dir+'/config.json'));
if(process.env.GITHUB_ACTIONS!=='true'||config.name!=='shift-stabilisation-preview'||config.routes||config.d1_databases.some(d=>readFileSync('wrangler.jsonc','utf8').includes(d.database_id)))throw Error('Isolated preview required');
delete config.send_email;config.vars.PREVIEW_B1_MAILBOX='';config.vars.LAUNCH_REPAIR_PREVIEW='true';config.vars.LAUNCH_PROOF_KEY=randomBytes(32).toString('hex');console.log('::add-mask::'+config.vars.LAUNCH_PROOF_KEY);writeFileSync(dir+'/config.json',JSON.stringify(config,null,2));
const evidence=dir+'/five-points-evidence/launch';mkdirSync(evidence,{recursive:true});
const source='https://0da69833.projectshift.pages.dev',hash=s=>createHash('sha256').update(s).digest('hex'),proof=[];
for(const path of ['/treatment-centre','/treatment-order','/treatment-order-prototype-v1.js']){
 const r=await fetch(source+path);if(!r.ok)throw Error(path+' unavailable: '+r.status);const original=await r.text();
 if(path==='/treatment-centre'&&(!original.includes('Use the free Health MOT')||!original.includes('Retatrutide, CagriSema, Orforglipron,')))throw Error('Centre source drift');
 if(path.endsWith('.js')&&!original.includes('    const {label,price}=selection();'))throw Error('Order controller source drift');
 const currentFile=dir+'/assets/public-documents/'+path.slice(1)+'.html';
 let current=original;if(!path.endsWith('.js')){if(existsSync(currentFile))current=readFileSync(currentFile,'utf8');else{const live=await fetch('https://shiftsometimber.co.uk'+path);if(!live.ok)throw Error('Current public document unavailable');current=await live.text()}}
 const body=path==='/treatment-centre'?repairTreatmentCentre(current):path.endsWith('.js')?repairTreatmentOrderController(original):current;
 const file=path.endsWith('.js')?dir+'/assets/launch/'+path.slice(1):dir+'/assets/public-documents/'+path.slice(1)+'.html';mkdirSync(file.slice(0,file.lastIndexOf('/')),{recursive:true});writeFileSync(file,body);
 writeFileSync(evidence+'/'+path.slice(1)+'.source.txt',original);
 proof.push({path,source:source+path,pinnedSourceSha256:hash(original),beforeSha256:hash(current),afterSha256:hash(body),changed:body!==current});
}
writeFileSync(evidence+'/source.json',JSON.stringify({at:new Date().toISOString(),commit:process.env.GITHUB_SHA,pagesDeployment:'0da69833-83f7-4c70-9c7a-bceab7de1660',proof,productionWrites:0,emailDeliveryDisabled:true,providerSandboxConfigured:false},null,2));

const catalogue=await fetch('https://shiftsometimber.co.uk/v1/catalogue/medicines');if(!catalogue.ok)throw Error('Read-only catalogue unavailable');const catalogueText=await catalogue.text();writeFileSync(dir+'/assets/launch/catalogue.json',catalogueText);writeFileSync(evidence+'/catalogue.json',catalogueText);

const b1File=evidence+'/../b1/config-differences.json',b1=JSON.parse(readFileSync(b1File));b1.mailAllowlist=[];b1.mailLimit='disabled for launch candidate; prior B1 Inbox proof retained';b1.emailDeliveryDisabled=true;writeFileSync(b1File,JSON.stringify(b1,null,2));
