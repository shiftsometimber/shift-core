import {main as approvedMain} from '../../previews/treatments-v3/content.mjs';
const hashes=["fe2ff3512cc1688c25bc7b8058450467f3049e8b3cf0941a97e116bea5226efb","56321dd493410978e34f16ab00cbbcac3caee2ba8bed33e335e5c67f785ef9ca","cb825ce0efda57ce6a88e29ef265dc6ccea5e7c1bff06972e81ce4a3f9e93543","b02b36dc2dc10cf97eac7ba5856d267e08f07eaacc07abb0a306ab87adf8bd86","b4116c30eb1c59c86592c0631a0d6f5136ef4e393e0b98231bcd4cf16f668fab"];
const originals=[...approvedMain.matchAll(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/g)];
if(originals.length!==hashes.length)throw Error('Reviewed image count changed');
export const images=originals.map((m,i)=>({path:'/treatment-centre/images/'+hashes[i]+'.jpg',original:m[0],base64:m[1],hash:hashes[i]}));
export const deliveredMain=images.reduce((html,image)=>html.replaceAll(image.original,image.path),approvedMain);
export function imageResponse(request){
 const image=images.find(x=>x.path===new URL(request.url).pathname);if(!image)return null;
 if(!['GET','HEAD'].includes(request.method))return new Response('Read-only image',{status:405,headers:{Allow:'GET, HEAD'}});
 const headers={'Content-Type':'image/jpeg','Cache-Control':'public, max-age=31536000, immutable','ETag':'"'+image.hash+'"','X-Content-Type-Options':'nosniff','Content-Length':String(atob(image.base64).length)};
 if(request.headers.get('If-None-Match')===headers.ETag)return new Response(null,{status:304,headers});
 return new Response(request.method==='HEAD'?null:Uint8Array.from(atob(image.base64),c=>c.charCodeAt(0)),{headers});
}
