import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {ARTICLE} from './oral-public.mjs';
export const imageSHA256='f48671ad740d4b888b8980fc5505ff170e969086a33e4bb362fc4b81145a2833';
export async function verifyOralImage(origin){
 const url=new URL(new URL(ARTICLE.images[0].url).pathname,origin).href;
 const response=await fetch(url,{redirect:'manual'});
 assert.equal(response.status,200,'Article artwork must be directly available');
 assert.match(response.headers.get('content-type'),/^image\/jpeg(?:;|$)/);
 const bytes=Buffer.from(await response.arrayBuffer());
 assert.equal(createHash('sha256').update(bytes).digest('hex'),imageSHA256,'Article artwork bytes differ from the decoded, reviewed JPEG');
 return {image:true,url,status:200,bytes:bytes.length,sha256:imageSHA256};
}
