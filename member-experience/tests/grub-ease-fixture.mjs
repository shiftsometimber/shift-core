// Runs the actual member Worker and account APIs against an isolated SQLite fixture.
// No production mutations, registrations, messages or device-health-store writes.
// The composed Worker may fetch its unchanged public static assets; API writes stay in this fixture.
import {createServer} from 'node:http';
import {gunzipSync,brotliDecompressSync} from 'node:zlib';
import {readFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import worker from '../../shift-coach/worker.mjs';
import {fixture} from '../../shift-coach/test-fixture.mjs';
import {execFileSync} from 'node:child_process';
import {CATALOGUE_PUBLICATION_RELEASE} from '../../catalogue-publication-release-v1.mjs';
import {publishFixedCatalogue} from '../../catalogue-publication-core.mjs';
const root=process.cwd(),out=(process.env.GRUB_EASE_OUT||'/tmp/grub-ease-proof')+'/fixture';mkdirSync(out,{recursive:true});
const externalFetch=globalThis.fetch,blockedOutbound=[];
globalThis.fetch=(input,init)=>{
 const method=String(init?.method||input?.method||'GET').toUpperCase(),url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url);
 if(!['GET','HEAD'].includes(method)||url.hostname==='api.shiftsometimber.co.uk'||url.pathname.startsWith('/v1/')){
  blockedOutbound.push({method,path:url.origin+url.pathname});throw new Error('Synthetic member fixture blocks external APIs and mutations');
 }
 return externalFetch(input,init);
};
const DB=fixture();DB.exec=async sql=>{DB.sqlite.exec(sql);return {success:true}};
// Match the current check-in read contract; the general coaching fixture has only its legacy three columns.
DB.sqlite.exec('ALTER TABLE check_ins ADD COLUMN wellbeing_score INTEGER;ALTER TABLE check_ins ADD COLUMN notes TEXT;ALTER TABLE check_ins ADD COLUMN submitted_at TEXT;');
DB.sqlite.exec('DROP TABLE progress_entries;DROP TABLE audit_log;CREATE TABLE cases(id INTEGER PRIMARY KEY,user_id INTEGER);CREATE TABLE pharmacy_orders(id INTEGER PRIMARY KEY,user_id INTEGER);');
for(const c of ['email','first_name','last_name','phone','postcode','created_at','updated_at'])DB.sqlite.exec('ALTER TABLE users ADD COLUMN '+c+' TEXT');
for(const c of ['lifecycle_stage','membership_status','source'])DB.sqlite.exec('ALTER TABLE member_status ADD COLUMN '+c+' TEXT');
DB.sqlite.exec("CREATE TABLE user_auth(user_id INTEGER PRIMARY KEY,email_verified INTEGER,last_login_at TEXT,password_hash TEXT);INSERT INTO user_auth(user_id,email_verified) VALUES(1,1),(2,1);UPDATE users SET email='synthetic-'||id||'@example.invalid',first_name='Synthetic',last_name='Member',created_at='2026-10-02',updated_at='2026-10-02';");
DB.sqlite.exec(readFileSync(root+'/member-experience/member-details.sql','utf8'));
DB.sqlite.exec(readFileSync(root+'/member-experience/checkin-followup.sql','utf8'));DB.sqlite.exec(readFileSync(root+'/migrations/002_personal_knowledge_radar.sql','utf8'));
DB.sqlite.exec(readFileSync(root+'/member-experience/staging/catalogue-schema.sql','utf8'));
// Seed the retained, hash-governed catalogue using its original publication tools.
// This fixture never relaxes catalogue authority or substitutes invented recipes.
const catalogueDir=out+'/catalogue';mkdirSync(catalogueDir,{recursive:true});
if(!existsSync(catalogueDir+'/final-v1-production-publication.sql')){
 execFileSync(process.execPath,['grub-v1-publication-pack.mjs'],{stdio:'pipe',env:{...process.env,COFID_INDEX:root+'/tests/fixtures/grub-cofid-2021-governed-subset.json',GRUB_PUBLICATION_DIR:catalogueDir,GRUB_DECISIONS_FILE:root+'/evidence/grub-v1-final-decisions-2026-08-14.json'}});
 execFileSync(process.execPath,['final-v1-production-publication.mjs'],{stdio:'pipe',env:{...process.env,GRUB_PUBLISHABLE_FILE:catalogueDir+'/grub-v1-publishable.json',FINAL_V1_PUBLICATION_DIR:catalogueDir}});
}
DB.sqlite.exec(readFileSync(catalogueDir+'/final-v1-production-publication.sql','utf8'));
const catalogueDB={prepare(sql){let args=[];return{bind(...v){args=v;return this},async all(){return{success:true,results:DB.sqlite.prepare(sql).all(...args)}},async run(){if(sql.startsWith('SELECT'))return{success:true,results:DB.sqlite.prepare(sql).all(...args),meta:{changes:0}};const r=DB.sqlite.prepare(sql).run(...args);return{success:true,meta:{changes:Number(r.changes)}}}}},async batch(statements){DB.sqlite.exec('BEGIN');try{const rows=[];for(const s of statements)rows.push(await s.run());DB.sqlite.exec('COMMIT');return rows}catch(e){DB.sqlite.exec('ROLLBACK');throw e}}};
await publishFixedCatalogue(catalogueDB,CATALOGUE_PUBLICATION_RELEASE);
const env={DB,MEMBER_EXPERIENCE_V1_ENABLED:'true',MY_TIMBER_PWA_ENABLED:'true',MEMBER_ASSETS:{fetch:async req=>{let f=root+'/frontend/member'+new URL(req.url).pathname;if(!existsSync(f))f+='.html';return existsSync(f)?new Response(readFileSync(f),{headers:{'Content-Type':f.endsWith('.html')?'text/html':f.endsWith('.css')?'text/css':f.endsWith('.js')||f.endsWith('.mjs')?'text/javascript':'application/octet-stream'}}):new Response('Not found',{status:404})}}};
const server=createServer(async(req,res)=>{try{if(process.env.EXPERIENCE_PREVIEW==='1'&&req.url==='/__synthetic-preview'){res.writeHead(303,{'Set-Cookie':'sst_session=fixture-token-1; Path=/; HttpOnly; SameSite=Lax','Location':'/member/dashboard#today','Cache-Control':'no-store'});res.end();return}const url=new URL(req.url,'https://shiftsometimber.co.uk'),chunks=[];for await(const c of req)chunks.push(c);const headers=new Headers(req.headers);if(headers.get('Origin')==='http://'+req.headers.host)headers.set('Origin',url.origin);const r=await worker.fetch(new Request(url,{method:req.method,headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),env,{waitUntil(){}});let bytes=Buffer.from(await r.arrayBuffer());const outHeaders=new Headers(r.headers),encoding=outHeaders.get('Content-Encoding');if(encoding==='gzip'&&bytes[0]===31&&bytes[1]===139)bytes=gunzipSync(bytes);else if(encoding==='br'){try{bytes=brotliDecompressSync(bytes)}catch{/* Node fetch already decoded a public static response. */}}if(process.env.EXPERIENCE_PREVIEW==='1'&&outHeaders.get('Content-Type')?.includes('text/html'))bytes=Buffer.from(bytes.toString().replace(/<head([^>]*)>/,'<head$1><script>window.SST_API_BASE=location.origin;</script>').replace('</header>','</header><aside style="padding:10px 20px;background:#707762;color:#050505;font:700 14px/1.5 Arial">Synthetic member preview · changes affect test accounts only.</aside>'));outHeaders.delete('Content-Length');outHeaders.delete('Content-Encoding');res.writeHead(r.status,Object.fromEntries(outHeaders));res.end(bytes)}catch(e){console.error(req.url,e);res.writeHead(500);res.end('Isolated fixture failure')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port,report={source:process.env.GITHUB_SHA||'working tree',physicalDevice:false,productionWrites:0,cases:[]};
export {origin,server,DB};
