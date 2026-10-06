import {APPROVED_PAGES} from './public-seo-approved-data.mjs';
export const APPROVED_PATHS=Object.freeze(Object.keys(APPROVED_PAGES));
export function approvedHtml(input,path,{reverse=false}={}){
 const page=APPROVED_PAGES[path];if(!page)return input;
 let html=input.toString();
 const pairs=reverse?[...page.replacements].reverse():page.replacements;
 if(reverse&&page.panel){const count=html.split(page.panel).length-1;if(count>1)throw new Error('Duplicate approved answer panel: '+path);if(count===1)html=html.replace(page.panel,'');}
 for(const pair of pairs){
  const from=reverse?pair.after:pair.before,to=reverse?pair.before:pair.after;
  const count=html.split(from).length-1;
  if(count===1)html=html.replace(from,to);
  else if(count>1||html.split(to).length-1!==1)throw new Error('Unexpected approved SEO source: '+path);
 }
 if(!reverse&&page.panel){
  const count=html.split(page.panel).length-1;if(count>1)throw new Error('Duplicate approved answer panel: '+path);
  if(count===0){if((html.match(/<h1\b/gi)||[]).length!==1)throw new Error('Expected one page heading: '+path);html=html.replace(/(<h1\b[^>]*>[\s\S]*?<\/h1>)/i,'$1'+page.panel);}
 }
 return html;
}
export function preserveApprovedSeo(path,input){
 if(!APPROVED_PAGES[path]||!input.toString().includes(APPROVED_PAGES[path].replacements[0].after))return input;
 return Buffer.from(approvedHtml(input,path,{reverse:true}));
}
export async function withApprovedSeo(response,request){
 const u=new URL(request.url);
 if(request.method!=='GET'||u.origin!=='https://shiftsometimber.co.uk'||!APPROVED_PAGES[u.pathname]||response.status!==200||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const before=await response.text(),after=approvedHtml(before,u.pathname),headers=new Headers(response.headers);
 for(const key of ['Content-Length','ETag','Content-MD5','Digest'])headers.delete(key);
 headers.set('X-Shift-Approved-SEO','2026-10-06');
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}
