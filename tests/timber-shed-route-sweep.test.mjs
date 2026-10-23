import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const run=promisify(execFile);
const page=links=>'<html><body><p>A complete fictional page with meaningful visible content for a local route sweep.</p>'+links+'</body></html>';
async function fixture(mode,fn){
 let active=0,maximum=0;
 const server=createServer((req,res)=>{
  active++;maximum=Math.max(maximum,active);res.on('close',()=>active--);
  if(mode==='timeout'&&req.url==='/a'){res.writeHead(200,{'Content-Type':'text/html'});res.write('<html>');return;}
  setTimeout(()=>{
   if(mode==='broken'&&req.url==='/a'){res.writeHead(503,{'Content-Type':'text/html'});return res.end(page('Unavailable'));}
   if(mode==='blank'&&req.url==='/a'){res.writeHead(200,{'Content-Type':'text/html'});return res.end('<html></html>');}
   if(mode==='loop'&&req.url==='/a'){res.writeHead(302,{Location:'/a'});return res.end();}
   res.writeHead(200,{'Content-Type':'text/html'});
   res.end(page(req.url==='/'?'<a href="/a">A</a><a href="/b">B</a><a href="/c">C</a>':'<a href="/">Home</a>'));
  },30);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{return await fn('http://127.0.0.1:'+server.address().port,()=>maximum)}
 finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve))}
}
async function sweep(base,extra={}){
 try{const r=await run(process.execPath,['gate1-whole-estate-production-sweep.mjs'],{env:{...process.env,SHIFT_SITE_BASE:base,SHIFT_SWEEP_MAX:'20',...extra},timeout:10000});return{code:0,...r}}
 catch(e){if(e.killed)throw e;return{code:e.code,stdout:e.stdout,stderr:e.stderr}}
}
test('route sweep exhausts local discovery with bounded parallel requests',()=>fixture('ok',async(base,max)=>{
 const r=await sweep(base);assert.equal(r.code,0);assert.match(r.stdout,/"checked": 5/);assert.match(r.stdout,/"truncated": false/);
 assert(max()>=2&&max()<=4,'parallelism stays bounded');
}));
test('larger/parallel crawl retains truncation failure',()=>fixture('ok',async base=>{
 const r=await sweep(base,{SHIFT_SWEEP_MAX:'2'});assert.equal(r.code,1);assert.match(r.stdout,/"truncated": true/);assert.match(r.stderr,/increase SHIFT_SWEEP_MAX/);
}));
test('HTTP failure, blank HTML and redirect loop remain release failures',async()=>{
 for(const mode of ['broken','blank','loop'])await fixture(mode,async base=>{
  const r=await sweep(base);assert.equal(r.code,1,mode);assert.match(r.stderr,/M10 route sweep/);
 });
});
test('a response body that never completes has a bounded deadline and fails the crawl',()=>fixture('timeout',async base=>{
 const r=await sweep(base,{SHIFT_SWEEP_TIMEOUT_MS:'150'});assert.equal(r.code,1);assert.match(r.stderr,/M10 route sweep/);
}));
