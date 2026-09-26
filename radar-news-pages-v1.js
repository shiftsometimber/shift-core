import {originalNoticeHtml,publisherAttributionHtml} from './radar-permitted-content-v1.js';
import {NEWSROOM_SORTS,newsSortKey,compareNews,newsPublicationDate} from './radar-newsroom-sort-v1.js';
import {articleTrust,sourceDateLabel} from './radar-editorial-trust-v1.js';
import {NEWSROOM_LAYOUT_STYLE} from './radar-newsroom-layout-v1.js';
import {classifyNewsFilters, MEDICINE_FILTERS, TOPIC_FILTERS, NEWSROOM_FILTER_STYLE, NEWSROOM_FILTER_SCRIPT} from './radar-newsroom-filters-v1.js';
import { partitionNewsRows, newsRegion } from './radar-uk-editorial-v1.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
const parse=(value,fallback={})=>{try{return typeof value==="string"?JSON.parse(value):value??fallback}catch{return fallback}};
const cleanSlug=value=>String(value||"").replace(/^\/+|\/+$/g,"");
const articleSlug=row=>cleanSlug(parse(row.content_package_json,{}).seo?.slug||"");
const publishedAt=newsPublicationDate;
export const NEWSROOM_ROWS_SQL="SELECT e.id,e.headline,e.region,e.regulator,e.event_type,e.content_package_json,e.source_evidence_json,e.reviewed_at,e.updated_at,e.created_at,p.first_published_at FROM radar_events e LEFT JOIN (SELECT event_id,MIN(created_at) first_published_at FROM radar_audit WHERE action='published' GROUP BY event_id) p ON p.event_id=e.id WHERE e.status='published' ORDER BY COALESCE(p.first_published_at,e.reviewed_at,e.updated_at) DESC,e.id DESC LIMIT 250";
function markdown(source){
 const lines=String(source||"").replace(/\r/g,"").split("\n"),out=[];let list=false;
 const inline=value=>esc(value).replace(/\[([^\]]+)\]\((https:\/\/[^\s)]+|\/(?!\/)[^\s)]*)\)/g,(_,label,href)=>'<a href="'+href+'"'+(href.startsWith('https:')?' rel="noopener noreferrer"':'')+'>'+label+'</a>').replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
 for(const raw of lines){const line=raw.trim();if(!line){if(list){out.push("</ul>");list=false}continue}
  if(/^###\s+/.test(line)){if(list){out.push("</ul>");list=false}out.push("<h3>"+inline(line.replace(/^###\s+/,""))+"</h3>")}
  else if(/^##\s+/.test(line)){if(list){out.push("</ul>");list=false}out.push("<h2>"+inline(line.replace(/^##\s+/,""))+"</h2>")}
  else if(/^#\s+/.test(line)){if(list){out.push("</ul>");list=false}out.push("<h2>"+inline(line.replace(/^#\s+/,""))+"</h2>")}
  else if(/^[-*]\s+/.test(line)){if(!list){out.push("<ul>");list=true}out.push("<li>"+inline(line.replace(/^[-*]\s+/,""))+"</li>")}
  else{if(list){out.push("</ul>");list=false}out.push("<p>"+inline(line)+"</p>")}
 }
 if(list)out.push("</ul>");return out.join("");
}
const newsroomStyle='<style data-radar-newsroom>.radar-news-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,290px),1fr));gap:18px;margin:28px 0 48px}.radar-news-card{color:#e7e3da;font:16px/1.55 Arial,Helvetica,sans-serif;border:1px solid #707762;border-radius:16px;padding:20px;background:#10110f}.radar-news-card h2{font-family:Arial,Helvetica,sans-serif;font-size:1.4rem!important;line-height:1.25!important;margin:.45rem 0;color:#e7e3da!important}.radar-news-card h2 a{color:inherit!important;text-decoration:none}.radar-news-card h2 a:hover{text-decoration:underline}.radar-news-card p{margin:.55rem 0;color:#e7e3da;font-size:1rem!important;line-height:1.55!important}.radar-news-card .eyebrow{color:#adb09f;font-size:.75rem!important;line-height:1.45!important;letter-spacing:.08em}.radar-news-card .radar-news-meta{color:#adb09f;font-size:.85rem!important}.radar-news-meta{color:#adb09f;font-size:.88rem}.radar-news-card a,.radar-article a{color:#e7e3da}.radar-article{width:min(820px,calc(100% - 40px));margin:32px auto 64px}.radar-article .standfirst{font-size:1.2rem}.radar-source-list{padding-left:1.2rem}.radar-safety{border-left:4px solid #707762;padding:14px 18px;background:#10110f}.radar-news-count{color:#adb09f}</style>';
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
 const tagged=rows.map(row=>({...row,filters:classifyNewsFilters(row),sort:newsSortKey(row)})).sort((a,b)=>compareNews(a.sort,b.sort));
 const field=(name,label,choices,allLabel)=>'<label for="news-'+name+'">'+label+'<select id="news-'+name+'" name="'+name+'"><option value="">'+allLabel+'</option>'+choices.map(([key,title])=>'<option value="'+esc(key)+'">'+esc(title)+'</option>').join('')+'</select></label>';
 const medicines=MEDICINE_FILTERS.filter(([key])=>tagged.some(row=>row.filters.medicines.includes(key)));
 const topics=TOPIC_FILTERS.filter(([key])=>tagged.some(row=>row.filters.topics.includes(key)));
 const filters='<form class="newsroom-filters" data-news-filters aria-label="Filter and sort newsroom stories">'+field('medicine','Medicine',medicines,'All medicines')+field('topic','Topic',topics,'All topics')+field('region','Region',[['uk','UK'],['us','US'],['world','World / other']],'All regions')+'<label for="news-sort">Sort by<select id="news-sort" name="sort">'+NEWSROOM_SORTS.map(([key,title])=>'<option value="'+key+'">'+title+'</option>').join('')+'</select></label><button type="button">Clear filters</button></form><p class="newsroom-filter-results" data-news-results role="status" aria-live="polite">Showing '+rows.length+' stories</p><div class="newsroom-filter-empty" data-news-empty hidden><p>No stories match these filters. Try another combination or clear your selection.</p><button type="button" data-news-clear-empty>Clear filters</button></div>';
 const cards=items=>items.map(row=>{const content=parse(row.content_package_json,{}),seo=content.seo||{},date=row.sort.date.slice(0,10),tags=row.filters;return '<article class="radar-news-card" data-news-card data-date="'+esc(row.sort.date)+'" data-title="'+esc(row.sort.title)+'" data-id="'+esc(row.sort.id)+'" data-medicine="'+tags.medicines.join(' ')+'" data-topic="'+tags.topics.join(' ')+'" data-region="'+tags.region+'"><p class="eyebrow">'+esc(row.regulator||row.event_type||"Medicines update")+'</p><h2><a href="'+esc(newsUrl(row))+'">'+esc(content.headline||row.headline)+'</a></h2><p>'+esc(content.standfirst||seo.description||content.what_changed||"")+'</p><p class="radar-news-meta">'+esc(row.region||'GLOBAL')+' · '+(date?'Published <time datetime="'+esc(row.sort.date)+'">'+esc(date)+'</time>':'Publication date unavailable')+'</p><p><a href="'+esc(newsUrl(row))+'">Read the evidence-led update →</a></p></article>'}).join("");
 const {uk,international}=partitionNewsRows(tagged);
 return '<main class="page-template template-top-level" id="main-content"><section class="pagehero v6-watermark-host"><div class="wrap"><p class="eyebrow">SHIFT Newsroom</p><h1>SHIFT <span class="accent">Newsroom</span></h1><p>UK health, NHS access and medicine updates and international research worth understanding. Clear sources, evidence limits and what each story means here.</p><p class="radar-news-meta"><a href="/editorial-standards#newsroom">Our editorial process</a> · <a href="/editorial-standards#corrections">Corrections</a></p><p class="radar-news-count">'+uk.length+' UK updates · '+international.length+' international updates.</p></div></section><section class="content"><div class="wrap">'+filters+'<p class="radar-news-meta">Sorted by first publication in SHIFT. Original source dates are recorded in each article.</p><section data-news-group aria-label="Newsroom articles"><div class="radar-news-grid" data-news-list>'+cards(tagged)+'</div></section></div></section></main><script>'+NEWSROOM_FILTER_SCRIPT+'</script>';
}

function detailMain(row){
 const original=originalNoticeHtml(row);if(original)return original;
 const content=parse(row.content_package_json,{}),sources=parse(row.source_evidence_json,[]),facts=Array.isArray(content.known_facts)?content.known_facts:[];
 const meaning=String(content.shift_take||content.why_it_matters_to_uk||'').trim();
 const paragraphs=String(content.article_markdown||'').split(/\n\s*\n/);
 const duplicate=meaning?paragraphs.findIndex(p=>p.trim()===meaning):-1;
 if(duplicate>=0){
  paragraphs.splice(duplicate,1);
  if(duplicate>0&&/^#{1,6}\s+[^\n]+$/.test(paragraphs[duplicate-1].trim())&&(duplicate===paragraphs.length||/^#{1,6}\s/.test(paragraphs[duplicate].trim())))paragraphs.splice(duplicate-1,1);
 }
 const articleBody=paragraphs.join('\n\n');
 const meaningHtml='<section data-shift-take><h2>SHIFT’s take</h2><p class="radar-news-meta">What we think this could mean for you, and what remains uncertain.</p>'+markdown(meaning||'A separate SHIFT interpretation has not been added to this report.')+'</section>';
 const factsHtml=facts.length?'<section><h2>Known facts</h2><ul>'+facts.map(x=>'<li>'+esc(x.claim||x.fact||"")+'</li>').join("")+'</ul></section>':"";
 const sourcesHtml='<section><h2>Sources and evidence</h2><ul class="radar-source-list">'+sources.map(x=>'<li><a href="'+esc(x.url||x.source_url||"#")+'" rel="noopener noreferrer">'+esc(x.authority||x.title||"Primary source")+'</a>'+sourceDateLabel(x)+'</li>').join("")+'</ul></section>';
 return '<main id="main-content"><article class="radar-article"><p class="eyebrow">SHIFT Newsroom · '+esc(newsRegion({region:row.region},{title:row.headline}))+'</p><h1>'+esc(content.headline||row.headline)+'</h1><p class="standfirst">'+esc(content.standfirst||content.what_changed||"")+'</p>'+articleTrust({...content,seo:{...content.seo,datePublished:publishedAt(row)}},row)+markdown(articleBody)+meaningHtml+factsHtml+(content.safety?'<aside class="radar-safety"><strong>Safety context</strong><p>'+esc(content.safety)+'</p></aside>':"")+sourcesHtml+publisherAttributionHtml(row)+'<p><a href="/shift-newsroom">← Back to SHIFT Newsroom</a></p></article></main>';
}
function detailHead(html,row,request){
 const content=parse(row.content_package_json,{}),seo=content.seo||{},title=String(seo.title||content.headline||row.headline).slice(0,70),description=String(seo.description||content.standfirst||content.what_changed||"").slice(0,160),canonical=new URL(request.url);canonical.search="";canonical.hash="";
 const organization={"@type":"Organization","@id":"https://shiftsometimber.co.uk/#organization",name:"Shift Some Timber",url:"https://shiftsometimber.co.uk/",logo:{"@type":"ImageObject",url:"https://shiftsometimber.co.uk/assets/shift-wordmark.png"}};
 const image=String(seo.image||"/assets/og-default.jpg"),absoluteImage=image.startsWith("http")?image:"https://shiftsometimber.co.uk/"+image.replace(/^\//,""),schema={"@context":"https://schema.org","@type":"Article",headline:title,description,image:[absoluteImage],datePublished:publishedAt(row),dateModified:seo.dateModified||row.updated_at||publishedAt(row),author:{...organization,name:seo.author||"SHIFT Newsroom"},publisher:organization,mainEntityOfPage:canonical.href};
 html=html.replace(/<title>[\s\S]*?<\/title>/i,"").replace(/<meta\s+name=["']description["'][^>]*>/gi,"").replace(/<link\s+rel=["']canonical["'][^>]*>/gi,"").replace(/<meta\s+(?:property|name)=["'](?:og:|twitter:)[^>]*>/gi,"").replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,"");
 const tags='<title>'+esc(title)+'</title><meta name="description" content="'+esc(description)+'"><link rel="canonical" href="'+esc(canonical.href)+'"><meta property="og:type" content="article"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(description)+'"><meta property="og:url" content="'+esc(canonical.href)+'"><meta property="og:image" content="'+esc(absoluteImage)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="'+esc(absoluteImage)+'"><script type="application/ld+json">'+JSON.stringify(schema).replace(/<\//g,"<\\/")+'</script>';
 return html.replace(/<head>/i,"<head>"+tags);
}
export function newsroomHead(html){
 const title='SHIFT Newsroom | UK Health, NHS & Medicine News', description='UK health news, NHS access and medicine updates from SHIFT, with clear sources and practical context. Plus international research explained for UK readers.', canonical='https://shiftsometimber.co.uk/shift-newsroom';
 html=html.replace(/<title>[\s\S]*?<\/title>/i,'').replace(/<meta\s+name=["']description["'][^>]*>/gi,'').replace(/<link\s+rel=["']canonical["'][^>]*>/gi,'').replace(/<meta\s+(?:property|name)=["'](?:og:|twitter:)[^>]*>/gi,'').replace(/<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'');
 const schema={'@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:canonical,publisher:{'@type':'Organization','@id':'https://shiftsometimber.co.uk/#organization',name:'Shift Some Timber',url:'https://shiftsometimber.co.uk/',logo:{'@type':'ImageObject',url:'https://shiftsometimber.co.uk/assets/shift-wordmark.png'}}};
 return html.replace('</head>','<title>'+title+'</title><meta name="description" content="'+description+'"><link rel="canonical" href="'+canonical+'"><meta property="og:title" content="'+title+'"><meta property="og:description" content="'+description+'"><meta property="og:url" content="'+canonical+'"><meta property="og:type" content="website"><meta property="og:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(title)+'"><meta name="twitter:description" content="'+esc(description)+'"><meta name="twitter:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><script type="application/ld+json">'+JSON.stringify(schema)+'</script></head>');
}
export async function radarNewsPageRoutes(request,env){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,"")||"/";if(request.method!=="GET"&&request.method!=="HEAD")return null;if(!["shiftsometimber.co.uk","www.shiftsometimber.co.uk"].includes(url.hostname))return null;if(path!=="/shift-newsroom"&&path!=="/medicine-news"&&!path.startsWith("/medicine-news/"))return null;if(path==="/medicine-news")return Response.redirect(new URL("/shift-newsroom",url).href,301);
 // These independent reads previously ran serially on every newsroom request.
 // Keep publication decisions fresh: no shared HTML or database-result cache.
 const started=performance.now();let shellMs=0,dbMs=0;
 const [[received,source],{results=[]}]=await Promise.all([
  shell(request).then(async response=>{const text=response.ok?await response.text():null;shellMs=performance.now()-started;return [response,text]}),
  env.DB.prepare(NEWSROOM_ROWS_SQL).all().then(result=>{dbMs=performance.now()-started;return result}),
 ]);
 if(!received.ok)return received;
 const base=new Response(null,{status:received.status,headers:received.headers});
 base.headers.set('Server-Timing','news_shell;dur='+shellMs.toFixed(1)+', news_db;dur='+dbMs.toFixed(1));
 let html=source;
 const rows=results.filter(row=>parse(row.content_package_json,{}).destinations?.includes("medicine_news")).filter((row,index,list)=>articleSlug(row)&&list.findIndex(item=>articleSlug(item)===articleSlug(row))===index);
 html=html.replace("</head>",newsroomStyle+NEWSROOM_FILTER_STYLE+"</head>");
 if(path==="/shift-newsroom"){
  html=html.replace(/<body\b([^>]*)>/i,(_,attrs)=>'<body'+attrs.replace(/\sclass=["'][^"']*["']/i,'')+' class="newsroom-page">');
  html=html.replace('</head>',NEWSROOM_LAYOUT_STYLE+'</head>');
  return responseFrom(base,request.method==="HEAD"?"":replaceMain(newsroomHead(html),indexMain(rows)));
 }
 const slug=cleanSlug(path),row=rows.find(item=>articleSlug(item)===slug);if(!row)return responseFrom(base,request.method==="HEAD"?"":replaceMain(html,'<main id="main-content"><section class="content"><div class="wrap prose"><h1>Update not found</h1><p><a href="/shift-newsroom">Back to SHIFT Newsroom</a></p></div></section></main>'),404);
 html=withoutTicker(html);html=detailHead(html,row,request);html=replaceMain(html,detailMain(row));return responseFrom(base,request.method==="HEAD"?"":html);
}
