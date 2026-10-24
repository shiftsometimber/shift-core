import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

// Diagnostics only: never authorises source, retries, cancellation or release.
// Do not read command lines, environment, process memory or log content.
export function parseProcessStat(text){
 const end=text.lastIndexOf(')');if(end<0)return null;
 const fields=text.slice(end+2).trim().split(/\s+/);
 const values=[fields[1],fields[11],fields[12],fields[19]].map(Number);
 if(values.some(n=>!Number.isSafeInteger(n)||n<0))return null;
 return {parent:values[0],cpuTicks:values[1]+values[2],startToken:String(fields[19])};
}
function processStat(pid,root){try{return parseProcessStat(readFileSync(join(root,String(pid),'stat'),'utf8'));}catch{return null;}}
export function processStartToken(pid,root='/proc'){return processStat(pid,root)?.startToken??null;}
export function readOwnedChildProgress(pid,startToken,root='/proc'){
 const unavailable=reason=>({available:false,reason});
 if(!Number.isSafeInteger(pid)||pid<=0||!startToken)return unavailable('process_identity_unavailable');
 try{
  const names=readdirSync(root).filter(n=>/^[0-9]+$/.test(n));
  if(names.length>4096)return unavailable('process_snapshot_limit');
  const rows=new Map();
  for(const name of names){const row=processStat(Number(name),root);if(row)rows.set(Number(name),row);}
  if(rows.get(pid)?.startToken!==startToken)return unavailable('process_identity_changed');
  const owned=new Set([pid]);let added=true;
  while(added){added=false;for(const [id,row]of rows)if(!owned.has(id)&&owned.has(row.parent)){owned.add(id);added=true;}}
  if(processStartToken(pid,root)!==startToken)return unavailable('process_identity_changed');
  let cpuTicks=0;for(const id of owned)cpuTicks+=rows.get(id).cpuTicks;
  if(!Number.isSafeInteger(cpuTicks))return unavailable('counter_unavailable');
  return {available:true,scope:'observed_live_process_tree',processes:owned.size,cpuTicks};
 }catch{return unavailable('process_snapshot_unavailable');}
}
