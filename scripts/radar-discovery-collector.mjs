import {execFileSync} from 'node:child_process';
import {writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseAuthoritativeFeed} from '../radar-authoritative-scan-v1.js';
import {snapshotSource,snapshotSha,validateSourceSnapshot,SNAPSHOT_SCHEMA} from '../radar-source-snapshots-v1.js';
const write=process.argv.includes('--store');
if(write&&(process.env.GITHUB_REPOSITORY!=='shiftsometimber/shift-core'||process.env.GITHUB_REF!=='refs/heads/main'||!['push','schedule','workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME)))throw Error('Collector writes require the trusted main workflow');
const sha=process.env.GITHUB_SHA;if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Missing workflow commit');
const d1=args=>JSON.parse(execFileSync('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json',...args],{encoding:'utf8',maxBuffer:8*1024*1024}));
const sources=d1(['--command','SELECT id,authority,region,url,adapter,event_type eventType,tier,confidence,active FROM radar_sources WHERE active=1']).flatMap(x=>x.results||[]).filter(snapshotSource);
const rows=[],report=[];
for(const source of sources){
 try{
  const r=await fetch(source.url,{headers:{accept:'application/rss+xml,application/xml,text/xml','user-agent':'Shift-Radar/1.0'},signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw Error(`http_${r.status}`);
  const xml=await r.text();if(xml.length>2000000||!/<(?:rss|feed|rdf:RDF)\b/i.test(xml)||/<html\b/i.test(xml))throw Error('invalid_feed_document');
  const items_json=JSON.stringify(parseAuthoritativeFeed(xml,source));
  const row={source_id:source.id,source_url:source.url,fetched_at:new Date().toISOString(),items_json,items_sha256:await snapshotSha(items_json),document_sha256:await snapshotSha(xml),workflow_sha:sha};
  const valid=await validateSourceSnapshot(source,row);if(!valid)throw Error('invalid_snapshot');
  rows.push(row);report.push({source:source.id,ok:true,items:valid.items.length,fetched_at:row.fetched_at,document_sha256:row.document_sha256});
 }catch(error){report.push({source:source.id,ok:false,error:error.message})}
 // Low-rate requests to the public syndication endpoint; never retry access refusals.
 await new Promise(resolve=>setTimeout(resolve,1000));
}
if(write&&rows.length){
 const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
 const columns=['source_id','source_url','fetched_at','items_json','items_sha256','document_sha256','workflow_sha'];
 const sql=SNAPSHOT_SCHEMA+';\n'+rows.map(row=>`INSERT INTO radar_source_snapshots(${columns.join(',')}) VALUES(${columns.map(k=>quote(row[k])).join(',')}) ON CONFLICT(source_id) DO UPDATE SET ${columns.slice(1).map(k=>`${k}=excluded.${k}`).join(',')} WHERE excluded.fetched_at>radar_source_snapshots.fetched_at;`).join('\n');
 const dir=mkdtempSync(join(tmpdir(),'radar-collector-'));try{const path=join(dir,'snapshots.sql');writeFileSync(path,sql);d1(['--file',path])}finally{rmSync(dir,{recursive:true,force:true})}
}
console.log('DISCOVERY_COLLECTOR '+JSON.stringify({stored:write?rows.length:0,probed:report.length,results:report}));
// A partial failure remains visible in Actions and expires naturally in the scanner.
if(report.some(x=>!x.ok)||!report.length)process.exitCode=1;
