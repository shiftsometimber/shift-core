import {consentClient} from './consent.mjs';
// Fresh public HTML only. No form submissions, credentials or customer access.
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='acquisition-proof/baseline';mkdirSync(dir,{recursive:true});const proof=[];
for(const [path,name]of [['/member-login','member-login.html'],['/programme','programme.html'],['/start-here','start-here.html'],['/consent-v4a.js','consent-v4a.js']]){
 const r=await fetch('https://shiftsometimber.co.uk'+path,{signal:AbortSignal.timeout(20000)});if(r.status!==200)throw Error(path+' unavailable');const body=Buffer.from(await r.arrayBuffer());writeFileSync(dir+'/'+name,body);proof.push({path,status:r.status,sha256:createHash('sha256').update(body).digest('hex')});
}
// The source used to replace the consent runtime must match this deployment.
if(!readFileSync(dir+'/consent-v4a.js').equals(readFileSync('acquisition-activation/consent-baseline.js'))&&readFileSync(dir+'/consent-v4a.js','utf8')!==consentClient)throw Error('Consent baseline moved; reconcile the current script rather than overwrite');
const login=readFileSync(dir+'/member-login.html','utf8');if(!login.includes('SST_API[mode](data)'))throw Error('Public registration adapter contract changed');
writeFileSync('acquisition-proof/baseline.json',JSON.stringify(proof,null,2));
