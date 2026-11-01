import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {renderPage,addDiscovery,PAGE_INFO} from './pages.mjs';
const output=process.argv[2],partner=process.argv[3],programme=process.argv[4];
if(!output||!partner||!programme)throw Error('Supply output directory and captured public partner/programme shells');
const shells={'/partner-with-us':readFileSync(partner,'utf8'),'/programme':readFileSync(programme,'utf8')};
function preview(html,client){
 html=html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi,(all,attrs)=>/type=["']application\/(?:ld\+)?json["']/i.test(attrs)?all:'');
 html=html.replace(/<link\b[^>]*href=["']\/assets\/referral-programme\/styles.css["'][^>]*>/gi,'<style>'+readFileSync(new URL('styles.css',import.meta.url),'utf8')+'</style>');
 html=html.replace(/(href|src)=["'](\/(?!\/)[^"']*)["']/g,(all,key,value)=>value.startsWith('/assets/')?key+'="https://shiftsometimber.co.uk'+value+'"':all);
 const stub='<script>window.SSTTurnstile={getToken:async()=>"fictional-preview-token"};window.fetch=async(path,init)=>{if(path!=="/v1/contact")throw Error("Preview request blocked");window.lastPreviewRequest=JSON.parse(init.body);return new Response(JSON.stringify({ok:true,status:"sent",message:"Preview accepted — no email has been sent."}),{headers:{"Content-Type":"application/json"}});};</script>';
 if(client)html=html.replace('</body>',stub+'<script type="module">'+readFileSync(new URL(client,import.meta.url),'utf8')+'</script></body>');
 return html;
}
mkdirSync(output,{recursive:true});
for(const path of ['/refer-to-shift','/programme/sample','/partner-with-us','/programme']){
 const info=PAGE_INFO[path],html=info?renderPage(shells[info.parent],path):addDiscovery(shells[path],path),rendered=preview(html,info?.script),dir=output+path;
 mkdirSync(dir,{recursive:true});writeFileSync(dir+'/index.html',rendered);
}
writeFileSync(output+'/index.html','<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SHIFT release review</title><style>body{margin:0;background:#050505;color:#E7E3DA;font:16px Arial}header{padding:14px 20px}a,button{color:inherit}button{background:#050505;border:1px solid #707762;padding:9px;margin:4px}iframe{border:1px solid #707762;display:block;margin:10px auto;background:#050505}p{margin:8px 0}</style><header><strong>SHIFT · FINAL IMPLEMENTATION REVIEW</strong><p>Local review only. All form delivery is simulated; no email or member writes.</p><button data-page="/refer-to-shift/">Referrers & affiliates</button><button data-page="/programme/sample/">Full six-week sample</button><button data-page="/programme/">Programme entrance</button><button data-page="/partner-with-us/">Partnership Centre entrance</button><button data-width="390">390px</button><button data-width="1440">1440px</button></header><iframe title="Release page preview" width="390" height="844" src="/refer-to-shift/"></iframe><script>const frame=document.querySelector("iframe");document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>frame.src=b.dataset.page);document.querySelectorAll("[data-width]").forEach(b=>b.onclick=()=>frame.width=b.dataset.width);</script></html>');
console.log('Review pages generated; no production data or email used.');
