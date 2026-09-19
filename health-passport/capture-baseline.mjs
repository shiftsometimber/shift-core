import {mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const origin='https://shiftsometimber.co.uk',dir='passport-proof/baseline';mkdirSync(dir,{recursive:true});
const paths=['/start-here','/member/dashboard','/member-login','/member/settings'],queue=new Set(paths),manifest=[];
for(const path of queue){
 if(queue.size>150)throw Error('Baseline asset capture exceeded its bound');
 const response=await fetch(origin+path,{credentials:'omit',signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('Baseline unavailable: '+path+' '+response.status);
 const body=Buffer.from(await response.arrayBuffer()),type=response.headers.get('content-type')||'',name=encodeURIComponent(path);writeFileSync(dir+'/'+name,body);manifest.push({path,name,status:response.status,type,sha256:createHash('sha256').update(body).digest('hex')});
 if(paths.includes(path))for(const match of body.toString().matchAll(/(?:<script\b[^>]*\bsrc|<link\b[^>]*\bhref|<img\b[^>]*\bsrc)=["']([^"']+)["']/gi)){const url=new URL(match[1],origin+path);if(url.origin===origin&&/\.(?:js|mjs|css|png|jpg|jpeg|webp|svg)(?:$|\?)/.test(url.pathname+url.search))queue.add(url.pathname+url.search);}
}
writeFileSync(dir+'/manifest.json',JSON.stringify(manifest,null,2));
