import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {NEWSROOM_PUBLICATION_RELEASE} from '../newsroom-publication-release-v1.mjs';
import {NEWSROOM_EVENT_IDS,validateNewsroomRelease} from '../newsroom-publication-core.mjs';
const API='https://api.shiftsometimber.co.uk/v1/commissioning/newsroom-publication';
const decode=value=>String(value).replace(/<[^>]*>/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
const plain=value=>decode(String(value).replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g,'$1'));
export async function assertNewsroomCurrentMain(env,fetcher){
 if(env.GITHUB_REPOSITORY!=='shiftsometimber/shift-core'||env.GITHUB_REF!=='refs/heads/main'||env.GITHUB_EVENT_NAME!=='push'||env.GITHUB_ACTOR_ID!=='315011648'||!/^[a-f0-9]{40}$/.test(env.GITHUB_SHA||''))throw Error('newsroom_workflow_context_invalid');
 const response=await fetcher('https://api.github.com/repos/shiftsometimber/shift-core/git/ref/heads/main',{headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${env.GITHUB_TOKEN}`}});
 if(!response.ok||(await response.json()).object?.sha!==env.GITHUB_SHA)throw Error('newsroom_current_main_mismatch');
}
export async function verifyPublicArticle(article,result,fetcher){
 const canonical='https://shiftsometimber.co.uk/medicine-news/'+article.contentPackage.seo.slug.replace(/^medicine-news\//,'');
 if(result.url!==canonical)throw Error('newsroom_result_url_mismatch');
 const response=await fetcher(canonical,{headers:{'Cache-Control':'no-cache'}});if(!response.ok||response.url&&response.url!==canonical)throw Error('newsroom_public_article_unavailable_'+article.event_id);
 const html=await response.text(),main=html.match(/<article\b[^>]*class="radar-article"[^>]*>([\s\S]*?)<\/article>/)?.[1];
 if(!main||!decode(main).includes(article.contentPackage.headline))throw Error('newsroom_public_headline_mismatch_'+article.event_id);
 for(const paragraph of article.contentPackage.article_markdown.split(/\n\s*\n/))if(!decode(main).includes(plain(paragraph)))throw Error('newsroom_public_body_mismatch_'+article.event_id);
 for(const link of [...article.contentPackage.article_markdown.matchAll(/\]\((https:\/\/[^)]+)\)/g)].map(m=>m[1]))if(!main.includes(link.replace(/&/g,'&amp;')))throw Error('newsroom_public_source_link_missing_'+article.event_id);
 const schemas=[...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m=>{try{return JSON.parse(m[1])}catch{return null}}),schema=schemas.find(s=>s?.['@type']==='Article');
 if(!schema||schema.mainEntityOfPage!==canonical||schema.author?.name!=='SHIFT AI Newsroom'||!schema.datePublished)throw Error('newsroom_public_metadata_mismatch_'+article.event_id);
 return{event_id:article.event_id,url:response.url||canonical,status:response.status,reviewed_body_paragraphs:article.contentPackage.article_markdown.split(/\n\s*\n/).length,article_schema:true,datePublished:schema.datePublished};
}
export async function runNewsroomPublicationClient({release=NEWSROOM_PUBLICATION_RELEASE,env=process.env,fetcher=fetch}={}){
 if(release.status==='pending_snapshot')return{ok:true,status:'pending_snapshot',mutation:'skipped',release_id:release.release_id};
 await validateNewsroomRelease(release);await assertNewsroomCurrentMain(env,fetcher);
 if(!env.ACTIONS_ID_TOKEN_REQUEST_URL||!env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)throw Error('newsroom_oidc_unavailable');
 const endpoint=new URL(env.ACTIONS_ID_TOKEN_REQUEST_URL);endpoint.searchParams.set('audience','shift-newsroom-publication');
 const oidc=await fetcher(endpoint,{headers:{Authorization:`Bearer ${env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`}});if(!oidc.ok)throw Error('newsroom_oidc_rejected');const token=(await oidc.json()).value;if(typeof token!=='string'||!token)throw Error('newsroom_oidc_empty');
 await assertNewsroomCurrentMain(env,fetcher);
 const response=await fetcher(API,{method:'POST',headers:{'content-type':'application/json','x-shift-newsroom-oidc':token},body:JSON.stringify({release_id:release.release_id,release_sha256:release.release_sha256})});
 const report=await response.json();
 if(!response.ok||report.ok!==true||report.release_id!==release.release_id||report.release_sha256!==release.release_sha256||report.workflow_sha!==env.GITHUB_SHA||report.clinical_review!==false||report.published+report.already_published!==9||JSON.stringify(report.results?.map(x=>x.event_id).sort((a,b)=>a-b))!==JSON.stringify(NEWSROOM_EVENT_IDS)){const error=Error('newsroom_publication_failed_'+(report.reason||report.error||response.status));error.report=report;throw error}
 report.public_verification=[];
 try{for(const article of release.articles)report.public_verification.push(await verifyPublicArticle(article,report.results.find(x=>x.event_id===article.event_id),fetcher))}catch(error){error.report={...report,public_verification_complete:false,verification_error:error.message};throw error}
 return{...report,public_verification_complete:true};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const target=process.env.NEWSROOM_PUBLICATION_REPORT||'newsroom-publication-proof.json';
 try{const report=await runNewsroomPublicationClient();fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))}catch(error){fs.writeFileSync(target,JSON.stringify(error.report||{ok:false,error:error.message,publication_status:'not_confirmed'},null,2)+'\n');console.error(error.message);process.exitCode=1}
}
