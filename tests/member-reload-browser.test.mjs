import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {chromium} from 'playwright';
import {commissioningLogin,memberReload} from '../rendered-member-acceptance-support.mjs';

const email='shiftsometimber+structured-reload-browser@gmail.com';
const ready='<section id="previewAuth" hidden></section><main id="previewMember" class="is-ready" style="height:200px">Synthetic browser fixture</main>';
async function fixture(run,{retryStatus=200,retryReady=true}={}){
 let documents=0,cancelled=false;
 const sockets=new Set();
 const server=createServer((request,response)=>{
  const path=new URL(request.url,'http://fixture').pathname;
  if(path==='/v1/auth/login'||path==='/v1/me'){response.writeHead(200,{'Content-Type':'application/json'});response.end(JSON.stringify({user:{id:1,email}}));return;}
  if(path==='/member/dashboard'){
   if(++documents===2){request.once('close',()=>{cancelled=true});return;}
   response.writeHead(documents>2?retryStatus:200,{'Content-Type':'text/html','Cache-Control':'no-store'});
   response.end(documents>2&&!retryReady?'<section id="previewAuth"></section><main id="previewMember" hidden></main>':ready);return;
  }
  response.writeHead(404);response.end();
 });
 server.on('connection',socket=>{sockets.add(socket);socket.once('close',()=>sockets.delete(socket))});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const site='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true}),context=await browser.newContext(),page=await context.newPage();
 try{
  await page.goto(site+'/member/dashboard');
  const reload=page.reload.bind(page);let reloads=0;
  page.reload=options=>reload({...options,timeout:++reloads===1?1000:5000});
  // Use the real local HTTP login and session response; no browser-state injection.
  await commissioningLogin(page,{site,api:site,oidc:'local-fixture-only',email,password:'fixture-only'});
  await run({page,site,cancelled:()=>cancelled,documents:()=>documents});
 }finally{
  await browser.close();
  for(const socket of sockets)socket.destroy();
  await new Promise(resolve=>server.close(resolve));
 }
}

test('the exact prior harness fails when retrying an unfinished real Chromium navigation',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'member-reload-before-'));
 try{
  const file=join(directory,'before.mjs');
  writeFileSync(file,execFileSync('git',['show','bf3af86de87f0a04568805a2372b4e5124a325c5:rendered-member-acceptance-support.mjs']));
  const before=await import(pathToFileURL(file).href);
  await fixture(async({page,site})=>{
   await before.commissioningLogin(page,{site,api:site,oidc:'local-fixture-only',email,password:'fixture-only'});
   await assert.rejects(before.memberReload(page,{site}),/ERR_ABORTED|Timeout .*exceeded/);
  });
 }finally{rmSync(directory,{recursive:true,force:true});}
});

test('stopping the unfinished document lets one real retry prove HTTP, identity and rendered readiness',async()=>{
 await fixture(async({page,site,cancelled,documents})=>{
  const receipt=await memberReload(page,{site});
  assert.deepEqual(receipt,{attempts:2,recoveredNavigation:true});
  assert.equal(cancelled(),true);assert.equal(documents(),3);
  assert.equal(new URL(page.url()).pathname,'/member/dashboard');
  assert.equal(await page.locator('#previewMember').isVisible(),true);
 });
});

test('a failed retry document cannot pass the recovered navigation',async()=>{
 await fixture(async({page,site})=>{
  await assert.rejects(memberReload(page,{site}),/document failed/);
 },{retryStatus:503});
});
