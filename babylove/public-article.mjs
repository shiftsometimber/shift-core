import {ARTICLE,MAIN,STYLES,ASSETS,KNOWLEDGE_CARD} from './editorial/public-bundle.mjs';
import {publicHeader,publicDrawer,publicFooter} from '../public-shell-contract.mjs';
import {withArticleResponsePolicy} from './response-policy.mjs';
export {ARTICLE,KNOWLEDGE_CARD};
const HOSTS=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function publication(env){
 const row=await env.DB.prepare(`SELECT a.title,a.author,a.body,a.status,a.publish_at,r.decision FROM knowledge_articles a LEFT JOIN knowledge_article_reviews r ON r.article_id=a.id WHERE a.slug=?`).bind(ARTICLE.slug).first();
 return row&&row.status==='published'&&row.decision==='approved'&&row.author===ARTICLE.author&&row.title===ARTICLE.title&&row.body===ARTICLE.body&&row.publish_at?row:null;
}
export function articleHTML(publishedAt,bundle={ARTICLE,MAIN,STYLES}){
 const {ARTICLE,MAIN,STYLES}=bundle;
 const url=ARTICLE.proposed_url;
 const schema={'@context':'https://schema.org','@type':'BlogPosting',headline:ARTICLE.title,description:ARTICLE.summary,datePublished:publishedAt,dateModified:publishedAt,mainEntityOfPage:url,url,inLanguage:'en-GB',articleSection:ARTICLE.category,author:{'@type':'Person',name:ARTICLE.author,jobTitle:'Founder',url:url+'#about-the-author'},publisher:{'@type':'Organization',name:'SHIFT Some Timber',url:'https://shiftsometimber.co.uk/',logo:{'@type':'ImageObject',url:'https://shiftsometimber.co.uk/assets/shift-wordmark.png'}},image:ARTICLE.images[0].url};
 const css=['programme-treatment-handoff-v1.css?v=1','shift-recovery-v6.css?v=cos-live-recovery-20260909-r2','shift-compact-entry-v1.css?v=1','ask-timber-drawer-v2.css?v=8','v136-desolation-recovery.css?v=1','v137-estate-closeout.css?v=footer-wire-20260911b','header-navigation-v2.css'];
 const scripts=['/analytics-bootstrap-v1.js','/site-config-v3a.js','/analytics-v3a.js','/app.js?v=phase8v10','/assets/v42.js?v=cos-live-recovery-20260909-r2','/consent-v4a.js','/analytics-events-v31b.js'];
 const date=new Date(publishedAt).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'});
 const checked=ARTICLE.source_checked_at==='2026-09-20'?'20 September 2026':'19 September 2026';
 const main=MAIN.replace('Sources checked '+checked,'Published '+date+' · Sources checked '+checked);
 return '<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><title>'+escape(ARTICLE.seoTitle)+'</title><meta name="description" content="'+escape(ARTICLE.summary)+'"><meta name="author" content="Matt O’Brien"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="'+url+'"><meta property="og:type" content="article"><meta property="og:title" content="'+escape(ARTICLE.title)+'"><meta property="og:description" content="'+escape(ARTICLE.summary)+'"><meta property="og:url" content="'+url+'"><meta property="og:image" content="'+escape(ARTICLE.images[0].url)+'"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+escape(ARTICLE.title)+'"><meta name="twitter:description" content="'+escape(ARTICLE.summary)+'"><meta name="twitter:image" content="'+escape(ARTICLE.images[0].url)+'"><link rel="icon" href="/assets/favicon-32.png?v=104e">'+css.map(x=>'<link rel="stylesheet" href="/assets/'+x+'">').join('')+STYLES+'<script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script></head><body class="sst-fullsite-v35 sst-site-v31 contrast-v30o6f contrast-v30o6g one-shift sv-menu-page-v7 sst-reading-page sst-article-template-v31 visual-recovery vr-site v6"><a class="skip-link-v30f" href="#main-content">Skip to main content</a>'+publicHeader+publicDrawer+'<div class="drawer-backdrop" hidden></div>'+main+publicFooter+scripts.map(x=>'<script defer src="'+x+'"></script>').join('')+'</body></html>';
}
export async function babyLovePublicRoute(request,env){
 const u=new URL(request.url),path=u.pathname.replace(/\/$/,'');
 if(!HOSTS.has(u.hostname)||!['GET','HEAD'].includes(request.method))return null;
 if(ASSETS[path])return new Response(request.method==='HEAD'?null:ASSETS[path],{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
 if(![ARTICLE.path,ARTICLE.path+'.html'].includes(path))return null;
 const row=await publication(env);
 if(!row)return new Response('Article not published',{status:404,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 if(u.pathname!==ARTICLE.path||u.hostname!=='shiftsometimber.co.uk')return Response.redirect(ARTICLE.proposed_url,301);
 return withArticleResponsePolicy(new Response(request.method==='HEAD'?null:articleHTML(row.publish_at),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store, must-revalidate','X-Content-Type-Options':'nosniff','X-Shift-Article-Revision':'wegovy-cost-uk-20260919-matt-images-contrast'}}));
}
export async function withBabyLoveDiscovery(response,request,env){
 const u=new URL(request.url),path=u.pathname.replace(/\.html$/,'').replace(/\/$/,'');
 if(!HOSTS.has(u.hostname)||request.method!=='GET'||!response.ok||!['/explore-knowledge','/sitemap.xml'].includes(path))return response;
 const type=response.headers.get('Content-Type')||'';
 if(!/html|xml/i.test(type)||!(await publication(env)))return response;
 let text=await response.text();
 if(path==='/explore-knowledge'){
  if(!text.includes('data-babylove-article="wegovy-cost-uk"')){
   const marker=/<div\b(?=[^>]*\bid=["']knowledgeResults["'])[^>]*>/;
   if(!marker.test(text))throw Error('Knowledge results container changed; article listing not inserted');
   text=text.replace(marker,m=>m+KNOWLEDGE_CARD);
  }
 }else if(!text.includes('<loc>'+ARTICLE.proposed_url+'</loc>'))text=text.replace('</urlset>','<url><loc>'+ARTICLE.proposed_url+'</loc><lastmod>2026-09-19</lastmod></url></urlset>');
 const headers=new Headers(response.headers);for(const k of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(k);headers.set('Cache-Control','no-store, must-revalidate');
 return new Response(text,{status:response.status,headers});
}
export function preserveBabyLoveKnowledge(path,input,{required=false}={}){
 if(path!=='/explore-knowledge')return input;
 const text=input.toString('utf8'),count=text.split('data-babylove-article="wegovy-cost-uk"').length-1;
 if(!count){if(required)throw Error('Published Wegovy guide missing from Knowledge');return input;}
 if(count!==1||!text.includes(KNOWLEDGE_CARD))throw Error('Knowledge article card differs from approved release');
 return Buffer.from(text.replace(KNOWLEDGE_CARD,''));
}
