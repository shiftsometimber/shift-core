import {SHARE_PREVIEW_PATH,SHARE_PREVIEW_SHA256,sharePreviewBytes} from './asset.mjs';
export const LEGACY_SHARE_URL='https://shiftsometimber.co.uk/assets/og-default.jpg';
export const APPROVED_SHARE_URL='https://shiftsometimber.co.uk'+SHARE_PREVIEW_PATH;

// Private prepared candidate: not admitted to main or authorised for publication.
// Only the two root-page sharing-image URLs change. Keep all visible page bytes,
// titles, descriptions, favicons, schemas, article images and routes intact.
export function replaceRootShareImage(html){
 const found={};
 const result=html.replace(/<meta\b[^>]*>/gi,tag=>{
  const key=tag.match(/\b(?:property|name)\s*=\s*["'](og:image|twitter:image)["']/i)?.[1]?.toLowerCase();
  if(!key)return tag;
  found[key]=(found[key]||0)+1;
  const match=tag.match(/\bcontent\s*=\s*(["'])([^"']*)\1/i);
  if(!match||![LEGACY_SHARE_URL,APPROVED_SHARE_URL].includes(match[2]))throw new Error('Unexpected root sharing-image source; preserve and review');
  return tag.replace(match[0],match[0].replace(match[2],APPROVED_SHARE_URL));
 });
 if(found['og:image']!==1||found['twitter:image']!==1)throw new Error('Root sharing metadata must have exactly one image per platform');
 return result;
}

export function servePreparedShareImage(request){
 if(new URL(request.url).pathname!==SHARE_PREVIEW_PATH)return null;
 if(!['GET','HEAD'].includes(request.method))return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
 const bytes=sharePreviewBytes();
 return new Response(request.method==='HEAD'?null:bytes,{headers:{'Content-Type':'image/jpeg','Content-Length':String(bytes.length),'Cache-Control':'public, max-age=31536000, immutable','ETag':'"'+SHARE_PREVIEW_SHA256+'"','X-Content-Type-Options':'nosniff'}});
}

export async function withRootSharePreview(response,request){
 if(new URL(request.url).pathname!=='/'||!['GET','HEAD'].includes(request.method)||!response?.ok||!response.headers.get('Content-Type')?.includes('text/html'))return response;
 const headers=new Headers(response.headers);
 for(const key of ['Content-Length','Content-Encoding','ETag','Last-Modified'])headers.delete(key);
 const body=request.method==='HEAD'?null:replaceRootShareImage(await response.text());
 return new Response(body,{status:response.status,statusText:response.statusText,headers});
}

export function withRootShareWorker(worker){
 return {...worker,async fetch(request,...args){
  const image=servePreparedShareImage(request);if(image)return image;
  return withRootSharePreview(await worker.fetch(request,...args),request);
 }};
}
