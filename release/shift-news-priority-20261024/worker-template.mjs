export default {async fetch(request,env){
const url=new URL(request.url);
if(url.hostname.endsWith('.workers.dev')&&url.pathname==='/__ticker_preview'&&request.method==='GET'){
const upstream=await fetch('https://shiftsometimber.co.uk/treatment-centre');let html=await upstream.text();
html=html.replace('<head>','<head><base href="https://shiftsometimber.co.uk/"><meta name="robots" content="noindex,nofollow">');
html=html.replaceAll('/assets/public-news-ticker-v1.js',url.origin+'/assets/public-news-ticker-v1.js');
return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex,nofollow'}});
}
if(url.pathname!=='/assets/public-news-ticker-v1.js'||!['GET','HEAD'].includes(request.method))return env.CORE.fetch(request);
return new Response(request.method==='HEAD'?null:body,{headers:{'Content-Type':'application/javascript; charset=utf-8','Cache-Control':'public, max-age=60, must-revalidate','X-Content-Type-Options':'nosniff','X-Shift-Ticker-Release':'shift-news-shared-v3','X-Robots-Tag':'noindex'}});
}};
