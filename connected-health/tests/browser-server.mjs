import http from 'node:http';
import {database,NOW,A,B,consent,batch,weight} from './fixture.mjs';
import {grant,ingest} from '../store.mjs';
import {wrapConnectedHealth} from '../adapter.mjs';
const DB=database(),c=await grant(DB,A,consent(),NOW);
await ingest(DB,A,batch(c,[weight(),{...weight(174,'h-1'),metric:'height',unit:'cm'}]),NOW);
const core={fetch:async()=>new Response('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local fictional test</title><style>body{margin:0;background:#050505;color:#e7e3da;font:16px/1.5 Arial,sans-serif}header,footer,main>p{padding:16px 24px}header{border-bottom:1px solid #707762}main{max-width:1000px;margin:auto}</style></head><body><header>MY TIMBER · LOCAL FICTIONAL TEST</header><main><p>Existing settings are preserved. This isolated check uses fictional accounts only.</p></main><footer>Not the live website · no device health access</footer></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}})};
const app=wrapConnectedHealth(core,async request=>{
 const cookie=request.headers.get('cookie')||'';const id=cookie.includes('fixture=b')?B:cookie.includes('fixture=a')?A:null;
 return id?{userId:id.userId,user:{session_id:id.sessionId,email:`fictional-${id.userId}@example.invalid`}}:{response:new Response('',{status:401})};
});
const server=http.createServer(async(req,res)=>{
 try {
  let body='';for await(const chunk of req)body+=chunk;
  const request=new Request('http://127.0.0.1:8765'+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body})});
  const response=await app.fetch(request,{DB,CONNECTED_HEALTH_V1_ENABLED:'true'},{});
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
 }catch{res.writeHead(500);res.end('fixture failure');}
});
server.listen(8765,'127.0.0.1',()=>console.log('Local fictional account fixture only on 127.0.0.1:8765'));
