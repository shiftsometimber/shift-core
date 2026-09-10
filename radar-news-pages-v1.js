const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const parse=(value,fallback={})=>{try{return typeof value==="string"?JSON.parse(value):value??fallback}catch{return fallback}};
const cleanSlug=value=>String(value||"").replace(/^\/+|\/+$/g,"");
const articleSlug=row=>cleanSlug(parse(row.content_package_json,{}).seo?.slug||"");
const publishedAt=row=>row.reviewed_at||row.updated_at||row.created_at||"";
function markdown(source){
 const lines=String(source||"").replace(/\r/g,"").split("\n"),out=[];let list=false;
 const inline=value=>esc(value).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g,'<a href="$2" rel="noopener noreferrer">$1</a>').replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
 for(const raw of lines){const line=raw.trim();if(!line){if(list){out.push("</ul>");list=false}continue}
  if(/^###\s+/.test(line)){if(list){out.push("</ul>");list=false}out.push("<h3>"+inline(line.replace(/^###\s+/,""))+"</h3>")}
  else if(/^##\s+/.test(line)){if(list){out.push("</ul>");list=false}out.push("<h2>"+inline(line.replace(/^##\s+/,""))+"</h2>")}
  else if(/^#\s+/.test(line)){if(list){out.push("</ul>");list=false}out.push("<h2>"+inline(line.replace(/^#\s+/,""))+"</h2>")}
  else if(/^[-*]\s+/.test(line)){if(!list){out.push("<ul>");list=true}out.push("<li>"+inline(line.replace(/^[-*]\s+/,""))+"</li>")}
  else{if(list){out.push("</ul>");list=false}out.push("<p>"+inline(line)+"</p>")}
 }
 if(list)out.push("</ul>");return out.join("");
}
const newsroomStyle='<style data-radar-newsroom>.radar-news-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:18px;margin:28px 0 48px}.radar-news-card{border:1px solid #707762;border-radius:16px;padding:20px;background:#10110f}.radar-news-card h2{font-size:1.25rem;margin:.45rem 0}.radar-news-card p{margin:.55rem 0}.radar-news-meta{color:#adb09f;font-size:.88rem}.radar-news-card a,.radar-article a{color:#e7e3da}.radar-article{width:min(820px,calc(100% - 40px));margin:32px auto 64px}.radar-article .standfirst{font-size:1.2rem}.radar-source-list{padding-left:1.2rem}.radar-safety{border-left:4px solid #707762;padding:14px 18px;background:#10110f}.radar-news-count{color:#adb09f}</style>';
async function shell(request){
 const url=new URL(request.url);url.protocol="https:";url.hostname="projectshift.pages.dev";url.port="";url.pathname="/medicine-news";url.search="";
 const headers=new Headers(request.headers);headers.delete("Host");headers.delete("If-None-Match");headers.delete("If-Modified-Since");
 return fetch(new Request(url,{method:"GET",headers}));
}
function responseFrom(base,body,status=200){
 const headers=new Headers(base.headers);headers.delete("Content-Length");headers.delete("ETag");headers.delete("Last-Modified");headers.set("Content-Type","text/html; charset=utf-8");headers.set("Cache-Control","public, max-age=60, stale-while-revalidate=300");headers.set("X-Shift-Newsroom-Renderer","radar-ssr-v1");
 return new Response(body,{status,headers});
}
function replaceMain(html,main){return html.replace(/<main\b[\s\S]*?<\/main>/i,main)}
function withoutTicker(html){return html.replace(/<section\s+class=["']medicine-ticker-v138["'][\s\S]*?<\/section>/i,"")}
function newsUrl(row){const slug=articleSlug(row);return slug.startsWith("medicine-news/")?"/"+slug:slug?"/"+slug:"/medicine-news"}
function indexMain(rows){
 const cards=rows.map(row=>{const content=parse(row.content_package_json,{}),seo=content.seo||{},date=publishedAt(row).slice(0,10);return '<article class="radar-news-card"><p class="eyebrow">'+esc(row.regulator||row.event_type||"Medicines update")+'</p><h2><a href="'+esc(newsUrl(row))+'">'+esc(content.headline||row.headline)+'</a></h2><p>'+esc(content.standfirst||seo.description||content.what_changed||"")+'</p><p class="radar-news-meta">'+esc(date)+'</p><p><a href="'+esc(newsUrl(row))+'">Read the evidence-led update →</a></p></article>'}).join("");
 return '<main class="page-template template-top-level" id="main-content"><section class="pagehero v6-watermark-host"><div class="wrap"><p class="eyebrow">SHIFT AI Newsroom</p><h1>Medicine news, without the <span class="accent">noise.</span></h1><p>Approved UK weight-management medicine updates, explained in plain English. Evidence first; no fake urgency and no invented promises.</p><p class="radar-news-count">'+rows.length+' governed updates published.</p></div></section><section class="content"><div class="wrap"><div class="radar-news-grid">'+cards+'</div></div></section></main>';
}
function detailMain(row){
 const content=parse(row.content_package_json,{}),sources=parse(row.source_evidence_json,[]),facts=Array.isArray(content.known_facts)?content.known_facts:[],date=publishedAt(row).slice(0,10);
 const factsHtml=facts.length?'<section><h2>Known facts</h2><ul>'+facts.map(x=>'<li>'+esc(x.claim||x.fact||"")+'</li>').join("")+'</ul></section>':"";
 const sourcesHtml='<section><h2>Sources and evidence</h2><ul class="radar-source-list">'+sources.map(x=>'<li><a href="'+esc(x.url||x.source_url||"#")+'" rel="noopener noreferrer">'+esc(x.authority||x.title||"Primary source")+'</a></li>').join("")+'</ul></section>';
 return '<main id="main-content"><article class="radar-article"><p class="eyebrow">SHIFT AI Newsroom · '+esc(row.region||"Global")+'</p><h1>'+esc(content.headline||row.headline)+'</h1><p class="standfirst">'+esc(content.standfirst||content.what_changed||"")+'</p><p class="radar-news-meta">Published '+esc(date)+' · Evidence level '+esc(Math.min(...sources.map(x=>Number(x.source_tier)||4),4))+'</p>'+markdown(content.article_markdown)+'<section><h2>What this means in the UK</h2><p>'+esc(content.why_it_matters_to_uk||"Check the cited evidence and current UK guidance.")+'</p></section>'+factsHtml+(content.safety?'<aside class="radar-safety"><strong>Safety context</strong><p>'+esc(content.safety)+'</p></aside>':"")+sourcesHtml+'<p><a href="/medicine-news">← Back to SHIFT AI Newsroom</a></p></article></main>';
}
function detailHead(html,row,request){
 const content=parse(row.content_package_json,{}),seo=content.seo||{},title=String(seo.title||content.headline||row.headline).slice(0,70),description=String(seo.description||content.standfirst||content.what_changed||"").slice(0,160),canonical=new URL(request.url);canonical.search="";canonical.hash="";
 const image=String(seo.image||"/assets/og-default.jpg"),absoluteImage=image.startsWith("http")?image:"https://shiftsometimber.co.uk/"+image.replace(/^\//,""),schema={"@context":"https://schema.org","@type":"Article",headline:title,description,image:[absoluteImage],datePublished:seo.datePublished||publishedAt(row),dateModified:seo.dateModified||row.updated_at||publishedAt(row),author:{"@type":"Organization",name:seo.author||"SHIFT AI Newsroom"},publisher:{"@type":"Organization",name:"Shift Some Timber",logo:{"@type":"ImageObject",url:"https://shiftsometimber.co.uk/assets/shift-wordmark.png"}},mainEntityOfPage:canonical.href};
 html=html.replace(/<title>[\s\S]*?<\/title>/i,"").replace(/<meta\s+name=["']description["'][^>]*>/gi,"").replace(/<link\s+rel=["']canonical["'][^>]*>/gi,"").replace(/<meta\s+(?:property|name)=["'](?:og:|twitter:)[^>]*>/gi,"").replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,"");
 const tags='<title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+esc(canonical.href)+'"><meta property="og:type" content="article"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(canonical.href)+'"><meta property="og:image" content="'+esc(absoluteImage)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(absoluteImage)+'"><script type="application/ld+json">'+JSON.stringify(schema).replace(/<\//g,"<\\/")+'</script>';
 return html.replace(/<head>/i,"<head>"+tags);
}
export async function radarNewsPageRoutes(request,env){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,"")||"/";if(request.method!=="GET"&&request.method!=="HEAD")return null;if(!["shiftsometimber.co.uk","www.shiftsometimber.co.uk"].includes(url.hostname))return null;if(path!=="/medicine-news"&&!path.startsWith("/medicine-news/"))return null;
 const base=await shell(request);if(!base.ok)return base;let html=await base.text();
 const {results=[]}=await env.DB.prepare("SELECT id,headline,region,regulator,event_type,content_package_json,source_evidence_json,reviewed_at,updated_at,created_at FROM radar_events WHERE status='published' ORDER BY COALESCE(reviewed_at,updated_at) DESC,id DESC LIMIT 250").all(),rows=results.filter(row=>parse(row.content_package_json,{}).destinations?.includes("medicine_news")).filter((row,index,list)=>articleSlug(row)&&list.findIndex(item=>articleSlug(item)===articleSlug(row))===index);
 html=html.replace("</head>",newsroomStyle+"</head>");
 if(path==="/medicine-news")return responseFrom(base,request.method==="HEAD"?"":replaceMain(html,indexMain(rows)));
 const slug=cleanSlug(path),row=rows.find(item=>articleSlug(item)===slug);if(!row)return responseFrom(base,request.method==="HEAD"?"":replaceMain(html,'<main id="main-content"><section class="content"><div class="wrap prose"><h1>Update not found</h1><p><a href="/medicine-news">Back to SHIFT AI Newsroom</a></p></div></section></main>'),404);
 html=withoutTicker(html);html=detailHead(html,row,request);html=replaceMain(html,detailMain(row));return responseFrom(base,request.method==="HEAD"?"":html);
}
