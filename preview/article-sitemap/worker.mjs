import {articleSitemapResponse} from '../../babylove/article-sitemap.mjs';
export default {async fetch(request){
 if(new URL(request.url).pathname!=='/sitemap-articles.xml')return new Response('Not found',{status:404});
 return articleSitemapResponse(request,()=>fetch('https://shiftsometimber.co.uk/sitemap.xml'));
}};
