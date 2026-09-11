import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {programmeDashboardEntry,DASHBOARD_ANCHOR} from '../dashboard-entry.mjs';
import {sqliteAdapter} from '../test-support/db.mjs';
import {ProgrammeStore,SCHEMA} from '../store.mjs';
import {fixture} from '../test-support/fixtures.mjs';
const pinned=JSON.parse(readFileSync(new URL('../test-support/pinned-dashboard-return.json',import.meta.url)));
assert.equal(DASHBOARD_ANCHOR,pinned.entryAnchor);
const html='<html><head></head><body><header>Existing header</header><main>'+DASHBOARD_ANCHOR+'<nav>Existing free tools</nav><div id="todayActions">Existing today panel</div></section></main><footer>Existing footer</footer></body></html>';
const response=()=>new Response(html,{headers:{'Content-Type':'text/html','ETag':'old-etag'}});
const request=path=>new Request('https://test.invalid'+path);
async function setup(active=true){const db=sqliteAdapter();db.sqlite.exec(SCHEMA);const s=fixture();s.entitlement.active=active;await new ProgrammeStore(db).create(1,s);return{PROGRAMME_V1_ENABLED:'true',PROGRAMME_DB:db}}
test('One authenticated dashboard entry is inserted while every existing byte remains intact',async()=>{
 const env=await setup(),r=await programmeDashboardEntry(request('/member/dashboard'),env,response(),{authenticate:async()=>({userId:1})}),output=await r.text();
 assert.match(output,/href="\/member\/programme"/);assert.equal((output.match(/id="sstProgrammeEntry"/g)||[]).length,1);
 assert.equal(output.replace(/<section class="mt-card" id="sstProgrammeEntry"[\s\S]*?<\/section>/,''),html);
 assert.match(r.headers.get('Cache-Control'),/no-store/);assert.equal(r.headers.get('ETag'),null);
});
test('Feature off, other routes and signed-out requests preserve the dashboard response without an entry',async()=>{
 const env=await setup();
 for(const [path,on] of [['/member/dashboard',false],['/member/grub',true],['/',true]]){
  const source=response();const result=await programmeDashboardEntry(request(path),{...env,PROGRAMME_V1_ENABLED:String(on)},source,{authenticate:async()=>{throw Error('Must not authenticate this path')}});assert.equal(result,source);
 }
 const source=response();assert.equal(await programmeDashboardEntry(request('/member/dashboard'),env,source,{authenticate:async()=>({response:new Response(null,{status:401})})}),source);
});
test('Unprovisioned accounts receive no availability claim; expiry retains a saved-record entry',async()=>{
 const env=await setup(false),source=response();assert.equal(await programmeDashboardEntry(request('/member/dashboard'),env,source,{authenticate:async()=>({userId:999})}),source);
 const body=await(await programmeDashboardEntry(request('/member/dashboard.html'),env,response(),{authenticate:async()=>({userId:1})})).text();
 assert.match(body,/Open my saved Programme/);assert.doesNotMatch(body,/weekly review/);
});
test('A changed template or storage failure keeps the existing dashboard intact',async()=>{
 const env=await setup(),different=new Response('<main>Different template</main>',{headers:{'Content-Type':'text/html'}});
 assert.equal(await(await programmeDashboardEntry(request('/member/dashboard'),env,different,{authenticate:async()=>({userId:1})})).text(),'<main>Different template</main>');
 const source=response();assert.equal(await programmeDashboardEntry(request('/member/dashboard'),env,source,{authenticate:async()=>{throw Error('Storage unavailable')}}),source);
});
