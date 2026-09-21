import {publicHeader,publicDrawer,publicFooter} from '../public-shell-contract.mjs';

const HOSTS=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const slugify=s=>String(s).toLowerCase().replace(/&amp;/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,100);
function safeUrl(raw){try{const u=new URL(String(raw),'https://shiftsometimber.co.uk');return ['http:','https:'].includes(u.protocol)?u.href:'#'}catch{return'#'}}
function inline(raw){
 let s=esc(raw);
 s=s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g,(_,alt,url)=>'<img loading="lazy" src="'+esc(safeUrl(url))+'" alt="'+alt+'" referrerpolicy="no-referrer">');
 s=s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g,(_,label,url)=>'<a href="'+esc(safeUrl(url))+'"'+(String(url).startsWith('http')?' rel="noopener noreferrer"':'')+'>'+label+'</a>');
 s=s.replace(/`([^`]+)`/g,'<code>$1</code>');
 s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 s=s.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g,'<em>$1</em>');
 return s;
}
function isTableSep(line){return /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(line)}
function cells(line){return line.trim().replace(/^\||\|$/g,'').split('|').map(x=>x.trim())}
export function renderMarkdown(markdown,title=''){
 const lines=String(markdown||'').replace(/\r/g,'').split('\n');let out='',i=0,firstH1=true;
 const blockStart=l=>/^#{1,6}\s|^\s*(?:[-*+] |\d+\. |>\s?|\*\*\*\s*$|---\s*$)/.test(l)||/^\s*\|/.test(l);
 while(i<lines.length){let line=lines[i];
  if(!line.trim()){i++;continue}
  const h=/^(#{1,6})\s+(.+)$/.exec(line);
  if(h){const level=h[1].length,text=h[2].trim();if(level===1&&firstH1&&text===title){firstH1=false;i++;continue}firstH1=false;out+='<h'+level+' id="'+slugify(text)+'">'+inline(text)+'</h'+level+'>';i++;continue}
  if(/^\s*(?:\*\*\*|---)\s*$/.test(line)){out+='<hr>';i++;continue}
  if(/^\s*>/.test(line)){const q=[];while(i<lines.length&&/^\s*>/.test(lines[i]))q.push(lines[i++].replace(/^\s*>\s?/,''));out+='<blockquote>'+q.map(inline).join('<br>')+'</blockquote>';continue}
  if(i+1<lines.length&&line.includes('|')&&isTableSep(lines[i+1])){const head=cells(line);i+=2;const rows=[];while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){rows.push(cells(lines[i++]));}out+='<div class="sst-table-wrap"><table><thead><tr>'+head.map(x=>'<th>'+inline(x)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+inline(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue}
  const ul=/^\s*[-*+]\s+(.+)$/.exec(line),ol=/^\s*\d+\.\s+(.+)$/.exec(line);
  if(ul||ol){const tag=ol?'ol':'ul',items=[];while(i<lines.length){const m=(tag==='ol'?/^\s*\d+\.\s+(.+)$/:/^\s*[-*+]\s+(.+)$/).exec(lines[i]);if(!m)break;items.push(m[1]);i++;}out+='<'+tag+'>'+items.map(x=>'<li>'+inline(x)+'</li>').join('')+'</'+tag+'>';continue}
  const p=[line.trim()];i++;while(i<lines.length&&lines[i].trim()&&!blockStart(lines[i]))p.push(lines[i++].trim());out+='<p>'+inline(p.join(' '))+'</p>';
 }
 return out;
}
export async function dynamicBabyLovePublication(env,slug){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!env.DB)return null;
 try{return await env.DB.prepare(`SELECT a.id,a.title,a.slug,a.category,a.author,a.status,a.summary,a.body,a.seo_title,a.publish_at,b.source_id FROM knowledge_articles a JOIN babylove_receipts b ON b.slug=a.slug WHERE a.slug=? AND a.status='published' AND a.publish_at IS NOT NULL`).bind(slug).first()}catch{return null}
}
export function articleHTML(row){
 const canonical='https://shiftsometimber.co.uk/articles/'+row.slug;
 const title=row.title,summary=row.summary||'SHIFT Some Timber knowledge article.',author=row.author||'SHIFT Team';
 const published=new Date(row.publish_at).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'});
 const schema={'@context':'https://schema.org','@type':'Article',headline:title,description:summary,datePublished:row.publish_at,dateModified:row.publish_at,mainEntityOfPage:canonical,url:canonical,inLanguage:'en-GB',articleSection:row.category||'Knowledge',author:{'@type':'Organization',name:author},publisher:{'@type':'Organization',name:'SHIFT Some Timber',url:'https://shiftsometimber.co.uk/'}};
 const shellCss=['programme-treatment-handoff-v1.css?v=1','shift-recovery-v6.css?v=cos-live-recovery-20260909-r2','shift-compact-entry-v1.css?v=1','ask-timber-drawer-v2.css?v=8','v136-desolation-recovery.css?v=1','v137-estate-closeout.css?v=footer-wire-20260911b','header-navigation-v2.css'].map(x=>'<link rel="stylesheet" href="/assets/'+x+'">').join('');
 const scripts=['/analytics-bootstrap-v1.js','/site-config-v3a.js','/analytics-v3a.js','/app.js?v=phase8v10','/assets/v42.js?v=cos-live-recovery-20260909-r2','/consent-v4a.js','/analytics-events-v31b.js'].map(x=>'<script defer src="'+x+'"></script>').join('');
 const css='<style>.sst-dynamic-article{max-width:860px;margin:0 auto;padding:48px 22px 80px}.sst-dynamic-article h1{font-size:clamp(2.1rem,6vw,4.6rem);line-height:.98;margin:0 0 18px}.sst-dynamic-article h2{margin-top:46px}.sst-dynamic-article h3{margin-top:30px}.sst-dynamic-article p,.sst-dynamic-article li{font-size:1.05rem;line-height:1.72}.sst-dynamic-article img{display:block;max-width:100%;height:auto;margin:28px auto;border-radius:18px}.sst-dynamic-article blockquote{margin:26px 0;padding:18px 22px;border-left:4px solid #707762;background:#e7e3da;color:#050505}.sst-table-wrap{overflow-x:auto}.sst-dynamic-article table{width:100%;border-collapse:collapse;margin:24px 0}.sst-dynamic-article th,.sst-dynamic-article td{padding:12px;border-bottom:1px solid #707762;text-align:left;vertical-align:top}.sst-dynamic-article a{text-decoration:underline}.sst-article-meta{color:#707762;margin-bottom:30px}</style>';
 const body=renderMarkdown(row.body,title);
 return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><title>'+esc(row.seo_title||title)+'</title><meta name="description" content="'+esc(summary)+'"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="'+canonical+'"><meta property="og:type" content="article"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(summary)+'"><meta property="og:url" content="'+canonical+'"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>'+shellCss+css+'</head><body class="sst-fullsite-v35 sst-site-v31 contrast-v30o6f contrast-v30o6g one-shift sst-reading-page"><a class="skip-link-v30f" href="#main-content">Skip to main content</a>'+publicHeader+publicDrawer+'<div class="drawer-backdrop" hidden></div><main id="main-content" class="sst-dynamic-article"><h1>'+esc(title)+'</h1><p class="sst-article-meta">Published '+esc(published)+' · '+esc(author)+'</p>'+body+'</main>'+publicFooter+scripts+'</body></html>';
}
export async function dynamicBabyLovePublicRoute(request,env){
 const u=new URL(request.url);if(!HOSTS.has(u.hostname)||!['GET','HEAD'].includes(request.method))return null;
 const m=u.pathname.replace(/\/$/,'').match(/^\/articles\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);if(!m)return null;
 const row=await dynamicBabyLovePublication(env,m[1]);if(!row)return null;
 if(u.hostname!=='shiftsometimber.co.uk'||u.pathname.endsWith('/'))return Response.redirect('https://shiftsometimber.co.uk/articles/'+row.slug,301);
 return new Response(request.method==='HEAD'?null:articleHTML(row),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, must-revalidate','X-Content-Type-Options':'nosniff','X-Shift-Article-Source':'babylovegrowth'}});
}
export async function withDynamicBabyLoveDiscovery(response,request,env){
 const u=new URL(request.url),path=u.pathname.replace(/\.html$/,'').replace(/\/$/,'');if(!HOSTS.has(u.hostname)||request.method!=='GET'||!response.ok||!['/explore-knowledge','/sitemap.xml'].includes(path)||!env.DB)return response;
 let rows=[];try{({results:rows=[]}=await env.DB.prepare(`SELECT a.title,a.slug,a.summary,a.publish_at FROM knowledge_articles a JOIN babylove_receipts b ON b.slug=a.slug WHERE a.status='published' AND a.publish_at IS NOT NULL ORDER BY a.publish_at DESC LIMIT 100`).all())}catch{return response}
 if(!rows.length)return response;let text=await response.text();
 if(path==='/sitemap.xml'){for(const row of rows){const loc='https://shiftsometimber.co.uk/articles/'+row.slug;if(!text.includes('<loc>'+loc+'</loc>'))text=text.replace('</urlset>','<url><loc>'+loc+'</loc><lastmod>'+String(row.publish_at).slice(0,10)+'</lastmod></url></urlset>')}}
 else{const marker=/<div\b(?=[^>]*\bid=["']knowledgeResults["'])[^>]*>/;if(marker.test(text)){const cards=rows.filter(r=>!text.includes('data-babylove-dynamic="'+r.slug+'"')).map(r=>'<article class="knowledge-card" data-babylove-dynamic="'+esc(r.slug)+'"><h3><a href="/articles/'+esc(r.slug)+'">'+esc(r.title)+'</a></h3><p>'+esc(r.summary||'SHIFT knowledge article.')+'</p></article>').join('');text=text.replace(marker,m=>m+cards)}}
 const headers=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);headers.set('Cache-Control','no-store, must-revalidate');return new Response(text,{status:response.status,headers});
}
