import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const script=fileURLToPath(new URL('../gate1-whole-estate-production-sweep.mjs',import.meta.url));
async function runFixture(mode){
 const requested=[];
 const server=createServer((req,res)=>{
  requested.push(req.url);
  if(req.url==='/'||req.url==='/member-login.html'){
   res.setHeader('Content-Type','text/html');
   res.end('<!doctype html><html><body><h1>A public fixture page with enough visible content for the blank-page assertion.</h1>'+
    (req.url==='/'?'<script src="/runtime.js?v=3&amp;mtv=good"></script><link rel="stylesheet" href="/style.css?v=2&#38;mtv=good"><img src="/photo.webp?width=300&#x26;format=auto" alt="Fixture">':'')+'</body></html>');
   return;
  }
  const asset=({
   '/runtime.js?v=3&mtv=good':['application/javascript','window.fixture=true;'],
   '/style.css?v=2&mtv=good':['text/css','body{color:black}'],
   '/photo.webp?width=300&format=auto':['image/webp','fixture-image']
  })[req.url];
  if(asset){
   if(mode==='broken'&&req.url.startsWith('/runtime.js')){res.writeHead(404);res.end('missing actual resource');return;}
   if(mode==='loop'&&req.url.startsWith('/runtime.js')){res.writeHead(302,{Location:req.url});res.end();return;}
   res.setHeader('Content-Type',asset[0]);res.end(asset[1]);return;
  }
  res.writeHead(404);res.end('Bare or altered URL is deliberately absent.');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  const result=await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,[script],{env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'20'},stdio:['ignore','pipe','pipe']});
   let stdout='',stderr='';
   child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
   const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('Fixture sweep exceeded 10 seconds'));},10000);
   child.on('error',error=>{clearTimeout(timer);reject(error);});
   child.on('close',code=>{clearTimeout(timer);resolve({code,stdout,stderr});});
  });
  return {...result,requested};
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
}
test('the sweep retains the exact declared script, stylesheet and image query, decoding HTML ampersands',async()=>{
 const r=await runFixture('healthy');
 assert.equal(r.code,0,r.stderr);
 for(const url of ['/runtime.js?v=3&mtv=good','/style.css?v=2&mtv=good','/photo.webp?width=300&format=auto'])assert(r.requested.includes(url),url);
 assert(!r.requested.includes('/runtime.js'));assert(!r.requested.some(x=>x.includes('amp;')));
 assert.match(r.stdout,/"failures": \[\]/);
 assert.match(r.stdout,/discovery exhausted/);
});
test('an actual declared resource 404 remains a failing safety assertion',async()=>{
 const r=await runFixture('broken');assert.equal(r.code,1);assert.match(r.stderr,/HTTP 404/);assert.match(r.stdout,/runtime\.js\?v=3&mtv=good/);
});
test('a redirect loop on the exact declared asset remains a failing safety assertion',async()=>{
 const r=await runFixture('loop');assert.equal(r.code,1);assert.match(r.stderr,/redirect_loop/);
});

