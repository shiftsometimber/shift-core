// Diagnostic only: count original native calls, never alter output or admit a release.
const cp=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),{syncBuiltinESMExports}=require('node:module');
const original=cp.execFileSync,rows=new Map(),started=process.hrtime.bigint();
cp.execFileSync=function(bin,args,options){const at=process.hrtime.bigint();let failure=false;try{return original.call(this,bin,args,options);}catch(e){failure=true;throw e;}finally{const elapsed=Number(process.hrtime.bigint()-at)/1e6;const verb=path.basename(String(bin))+' '+(Array.isArray(args)?String(args[0]):'');const stack=new Error().stack.split('\n').filter(l=>!l.includes('profile-native-git-calls')&&!l.includes('node:internal')).slice(1,6).join('\n');const key=verb+'\n'+stack;const row=rows.get(key)||{verb,stack,count:0,milliseconds:0,failures:0};row.count++;row.milliseconds+=elapsed;row.failures+=failure?1:0;rows.set(key,row);}};
syncBuiltinESMExports();
const save=()=>fs.writeFileSync('/Users/shiftsometimberltd/SST/organic-deploy-20261017/v6-native-profile-'+process.pid+'.json',JSON.stringify({diagnosticOnly:true,releaseQualification:false,pid:process.pid,seconds:Number(process.hrtime.bigint()-started)/1e9,rows:[...rows.values()].sort((a,b)=>b.milliseconds-a.milliseconds)},null,2));
process.on('exit',save);
