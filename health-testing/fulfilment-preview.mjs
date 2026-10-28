// Local UI acceptance server. Synthetic SQLite data only; never deploy this file.
import http from 'node:http';
import {readFileSync} from 'node:fs';
import {fulfilmentFixture} from './fulfilment-fixture.mjs';
import {fulfilmentRoute} from './fulfilment-api.mjs';
const fixture=fulfilmentFixture();
const html='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHIFT HQ · synthetic fulfilment review</title><style>body{margin:0;background:#050505;color:#E7E3DA;font:15px/1.5 system-ui}.preview-notice{padding:12px 24px;background:#707762;color:#050505;font-size:13px;font-weight:700}aside{width:225px;padding:24px;border-right:1px solid #707762;position:fixed;top:45px;bottom:0}aside nav button{display:block;width:100%;padding:12px;margin:10px 0;background:#050505;color:#E7E3DA;border:1px solid #707762;border-radius:5px;text-align:left}main{margin-left:225px;padding:20px}main>header{display:flex;justify-content:space-between;padding:8px 28px}.view{display:none}.view.active{display:block}button{cursor:pointer}@media(max-width:700px){aside{position:static;width:auto;border-right:0}main{margin:0;padding:0}}</style></head><body><div class="preview-notice">SYNTHETIC REVIEW · No real customers, payments, fulfilment or email sending</div><aside><strong>SHIFT HQ</strong><nav><details open><summary>Orders &amp; products</summary></details></nav></aside><main><header><h1 id="title">Testing orders</h1><button id="logoutBtn" type="button">Preview logout</button></header></main><script type="module">import {installTestingFulfilment} from "/hq-fulfilment.js";installTestingFulfilment({apiBase:"/v1/hq/testing/fulfilment"}).open();</script></body></html>';
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/hq-fulfilment.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(readFileSync(new URL('./hq-fulfilment.js',import.meta.url)));return;}
  if(url.pathname.startsWith('/v1/hq/testing/fulfilment')){
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const response=await fulfilmentRoute(new Request('https://api.shiftsometimber.co.uk'+req.url,{method:req.method,headers:{Origin:'https://hq.shiftsometimber.co.uk','Content-Type':'application/json'},body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks)}),fixture.env);
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(url.pathname==='/mobile.html'){res.writeHead(200,{'Content-Type':'text/html'});res.end('<!doctype html><html><body style="background:#707762;margin:0"><iframe title="Mobile HQ review" src="/" style="width:390px;height:900px;display:block;margin:12px auto;border:0"></iframe></body></html>');return;}
  res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);
 }catch(error){res.writeHead(500,{'Content-Type':'text/plain'});res.end(error.message);}
});
server.listen(Number(process.env.PORT)||4173,'0.0.0.0',()=>process.stdout.write('Synthetic fulfilment review ready\n'));
const stop=()=>server.close(()=>{fixture.db.close();process.exit(0);});process.on('SIGTERM',stop);process.on('SIGINT',stop);
