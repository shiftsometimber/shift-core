import {ARTICLE,MAIN,KNOWLEDGE_CARD} from './editorial/oral-bundle.mjs';
import {STYLES} from './editorial/public-bundle.mjs';
import {articleHTML} from './public-article.mjs';
export {ARTICLE,KNOWLEDGE_CARD};
export async function oralPublication(env){
 const row=await env.DB.prepare('SELECT a.title,a.author,a.body,a.status,a.publish_at,r.decision FROM knowledge_articles a LEFT JOIN knowledge_article_reviews r ON r.article_id=a.id WHERE a.slug=?').bind(ARTICLE.slug).first();
 return row&&row.status==='published'&&row.decision==='approved'&&row.title===ARTICLE.title&&row.author===ARTICLE.author&&row.body===ARTICLE.body&&row.publish_at?row:null;
}
export const oralHTML=date=>articleHTML(date,{ARTICLE,MAIN,STYLES});
const hosts=new Set(['shiftsometimber.co.uk','www.shiftsometimber.co.uk']);
export async function oralPublicRoute(request,env){
 const u=new URL(request.url),path=u.pathname.replace(/\/$/,'');
 if(!hosts.has(u.hostname)||!['GET','HEAD'].includes(request.method)||![ARTICLE.path,ARTICLE.path+'.html'].includes(path))return null;
 const row=await oralPublication(env);
 if(!row)return new Response('Article not published',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex'}});
 if(u.pathname!==ARTICLE.path||u.hostname!=='shiftsometimber.co.uk')return Response.redirect(ARTICLE.proposed_url,301);
 return new Response(request.method==='HEAD'?null:oralHTML(row.publish_at),{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Shift-Article-Revision':'oral-semaglutide-20260920'}});
}
export async function withOralDiscovery(response,request,env){
 const u=new URL(request.url),path=u.pathname.replace(/\.html$/,'').replace(/\/$/,'');
 if(!hosts.has(u.hostname)||request.method!=='GET'||!response.ok||!['/explore-knowledge','/sitemap.xml'].includes(path)||!await oralPublication(env))return response;
 let text=await response.text();
 if(path==='/explore-knowledge'&&!text.includes('data-babylove-article="'+ARTICLE.slug+'"')){
  const marker=/<div\b(?=[^>]*\bid=["']knowledgeResults["'])[^>]*>/;
  if(!marker.test(text))throw Error('Knowledge container changed');
  text=text.replace(marker,m=>m+KNOWLEDGE_CARD);
 }else if(path==='/sitemap.xml'&&!text.includes('<loc>'+ARTICLE.proposed_url+'</loc>'))text=text.replace('</urlset>','<url><loc>'+ARTICLE.proposed_url+'</loc><lastmod>2026-09-20</lastmod></url></urlset>');
 const headers=new Headers(response.headers);for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);headers.set('Cache-Control','no-store');return new Response(text,{status:response.status,headers});
}
export function preserveOralKnowledge(path,input){
 if(path!=='/explore-knowledge')return input;
 const text=input.toString('utf8'),count=text.split('data-babylove-article="'+ARTICLE.slug+'"').length-1;
 if(!count)return input;
 if(count!==1||!text.includes(KNOWLEDGE_CARD))throw Error('Oral article card differs from reviewed release');
 return Buffer.from(text.replace(KNOWLEDGE_CARD,''));
}
