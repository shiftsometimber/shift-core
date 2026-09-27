import {articleHTML} from '../../babylove/public-article.mjs';
import {isArticle,rewriteArticle} from '../../editorial/five-articles/render.mjs';
import {newsroomHead} from '../../radar-news-pages-v1.js';
import {reconcilePublicDocument} from '../../public-shell-contract.mjs';
import {withPublicTicker} from '../../public-navigation-policy.mjs';

export async function candidateDocument(html,path){
 if(path==='/articles/wegovy-cost-uk'){
  const schemas=[...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>JSON.parse(m[1]));
  const article=schemas.find(s=>s['@type']==='BlogPosting');
  if(!article?.datePublished)throw Error('Preview requires the actual recorded article publication date');
  html=articleHTML(article.datePublished);
  html=await(await withPublicTicker(new Request('https://shiftsometimber.co.uk'+path),new Response(html,{headers:{'Content-Type':'text/html'}}))).text();
 }else if(isArticle(path))html=rewriteArticle(html,path);
 else if(path==='/shift-newsroom')html=newsroomHead(html);
 return reconcilePublicDocument(html,path);
}
