import {readFile,writeFile} from 'node:fs/promises';
import {partnerShell} from './shell.mjs';
import {commissioningShell} from './commissioning-shell.mjs';
const assets={};for(const [file,type]of [['commissioning-client.mjs','text/javascript'],['client.mjs','text/javascript'],['domain.mjs','text/javascript'],['demo.mjs','text/javascript'],['style.css','text/css']])assets['/clinical-assets/partners/'+file]={type:type+'; charset=utf-8',body:await readFile(new URL(file,import.meta.url),'utf8')};
assets['/clinical-assets/partners/demo-client.mjs']={type:'text/javascript; charset=utf-8',body:"import {demoFetch as fetch} from '/clinical-assets/partners/demo.mjs';\n"+assets['/clinical-assets/partners/client.mjs'].body};
export const pages=Object.fromEntries([['/clinical-portal/partners','hq'],['/clinical-portal/partners/application','application'],['/clinical-portal/partners/activation','activation'],['/clinical-portal/partners/sign-in','login'],['/clinical-portal/dispensing','dispensing'],['/clinical-portal/my-profile','profile']].flatMap(([path,mode])=>[[path,{type:'text/html; charset=utf-8',body:partnerShell(mode),demo:false}],...['hq','dispensing'].includes(mode)?[[path+'/demo',{type:'text/html; charset=utf-8',body:partnerShell(mode,true),demo:true}]]:[]]));
pages['/clinical-portal/commissioning']={type:'text/html; charset=utf-8',body:commissioningShell,demo:false};
await writeFile(new URL('assets.mjs',import.meta.url),'// Generated from reviewed partner-operations source.\nexport const pages='+JSON.stringify(pages)+';\nexport const assets='+JSON.stringify(assets)+';\n');
