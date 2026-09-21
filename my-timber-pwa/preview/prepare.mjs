import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const name='shift-my-timber-pwa-preview',dbName='shift-my-timber-pwa-preview-20260921';
const dir='my-timber-pwa/preview/generated',configFile=dir+'/wrangler.json';mkdirSync(dir,{recursive:true});
mkdirSync(dir+'/assets/assets',{recursive:true});
const icons=[];for(const path of ['/assets/favicon.svg','/assets/apple-touch-icon.png']){
 const response=await fetch('https://0da69833.projectshift.pages.dev'+path);
 assert(response.ok,'Approved icon fetch: '+path+' '+response.status);
 assert(['0da69833.projectshift.pages.dev','shiftsometimber.co.uk','www.shiftsometimber.co.uk'].includes(new URL(response.url).hostname));
 assert(response.headers.get('Content-Type')?.startsWith(path.endsWith('.svg')?'image/svg+xml':'image/png'));
 const data=Buffer.from(await response.arrayBuffer());assert(data.length>100);writeFileSync(dir+'/assets'+path,data);icons.push({path,sha256:createHash('sha256').update(data).digest('hex')});
}
writeFileSync(dir+'/icons.json',JSON.stringify(icons,null,2));
const run=args=>execFileSync(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{encoding:'utf8',maxBuffer:8e6});
let databases=JSON.parse(run(['d1','list','--json']));
if(!databases.some(d=>d.name===dbName)){run(['d1','create',dbName,'--location','weur']);databases=JSON.parse(run(['d1','list','--json']))}
const matches=databases.filter(d=>d.name===dbName);assert.equal(matches.length,1);
const id=matches[0].uuid??matches[0].database_id??matches[0].id;assert.match(id,/^[a-f0-9-]{36}$/);assert(!readFileSync('wrangler.jsonc','utf8').includes(id));
const config={name,main:'../worker.mjs',compatibility_date:'2026-09-21',compatibility_flags:['nodejs_compat'],workers_dev:true,preview_urls:false,assets:{directory:'./assets',binding:'PREVIEW_ASSETS',run_worker_first:true},vars:{PREVIEW_SOURCE_SHA:process.env.GITHUB_SHA,PREVIEW_EXPIRES_AT:new Date(Date.now()+3*86400000).toISOString()},d1_databases:[{binding:'DB',database_name:dbName,database_id:id}]};
// No routes, schedules, email, AI, production data or existing preview bindings.
assert(!config.routes&&!config.triggers&&!config.send_email);writeFileSync(configFile,JSON.stringify(config,null,2));
const schema='CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,email TEXT);CREATE TABLE IF NOT EXISTS user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER);CREATE TABLE IF NOT EXISTS user_sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER,token_hash TEXT UNIQUE,expires_at TEXT,revoked_at TEXT,last_used_at TEXT);';
run(['d1','execute','DB','--remote','--command',schema,'--config',configFile]);
console.log('Prepared separately named PWA device preview. No existing rows deleted, no production binding, no cron.');
