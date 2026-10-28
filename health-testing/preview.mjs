import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {renderDocument} from '../health-nutrition/public.mjs';
import {rangeProducts} from './catalogue.mjs';
import {testingContent} from './public.mjs';
const root=new URL('../preview-testing/',import.meta.url);
mkdirSync(new URL('./dist/',root),{recursive:true});mkdirSync(new URL('./.openai/',root),{recursive:true});
const shell='<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#050505;color:#E7E3DA;font:16px/1.5 Arial,sans-serif}a{color:inherit}.preview-header,.preview-footer{padding:25px max(22px,calc((100% - 1180px)/2));border-bottom:1px solid #707762}.preview-header{display:flex;align-items:center;justify-content:space-between;gap:30px}.preview-header strong{font-size:22px;letter-spacing:-1px}.preview-header nav{display:flex;gap:22px;font-size:13px}.preview-header a{text-decoration:none}.preview-footer{border-top:1px solid #707762;border-bottom:0;padding-top:30px;padding-bottom:30px;font-size:13px}#main-content{padding:0 max(22px,calc((100% - 1180px)/2))}@media(max-width:700px){.preview-header nav{display:none}.preview-header{padding:22px}}</style></head><body><header class="preview-header"><a href="/shift-health"><strong>SHIFT SOME TIMBER</strong></a><nav aria-label="Primary"><a href="/start-here">Start Here</a><a href="/programme">The Programme</a><a href="/shift-health">SHIFT Health</a><a href="/treatments">Treatments</a><a href="/my-timber">My Timber</a></nav></header><main></main><footer class="preview-footer">Built by blokes. For blokes.<p>General information, not individual medical advice.</p></footer></body></html>';
for(const id of ['',...rangeProducts.map(p=>p.id)]){const path='/shift-health/testing'+(id?'/'+id:'');const dir=new URL('./dist'+path+'/',root);mkdirSync(dir,{recursive:true});const html=renderDocument(shell,path,new URLSearchParams());writeFileSync(new URL('./index.html',dir),html);if(!id)writeFileSync(new URL('./dist/index.html',root),html);}
writeFileSync(new URL('./.openai/hosting.json',root),JSON.stringify({static:{directory:'dist'}}));
console.log(root.pathname);

import {productImageData} from './media-data.mjs';
for(const [key,uri] of Object.entries(productImageData)){const dir=new URL('./dist/shift-health/assets/',root);mkdirSync(dir,{recursive:true});writeFileSync(new URL('testing-'+key+'.webp',dir),Buffer.from(uri.split(',')[1],'base64'));}

// One portable review with all pages and the original product photographs.
const views=Object.fromEntries(['',...rangeProducts.map(p=>p.id)].map(id=>[id,testingContent('/shift-health/testing'+(id?'/'+id:''))]));
const json=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const script=`<script>
const reviewViews=${json(views)},reviewImages=${json(productImageData)};
function showReview(){
 const id=location.hash.startsWith('#test=')?decodeURIComponent(location.hash.slice(6)):'';
 const view=reviewViews[id]||reviewViews[''];
 document.getElementById('shift-health-range').innerHTML=view.content;
 document.title=view.title;
 document.querySelectorAll('img[src^="/shift-health/assets/testing-"]').forEach(img=>{const key=img.getAttribute('src').split('testing-')[1].replace('.webp','');img.src=reviewImages[key]||'';});
 document.querySelectorAll('a[href^="/shift-health/testing"]').forEach(a=>{const id=a.getAttribute('href').replace('/shift-health/testing','').replaceAll('/','');a.href='#test='+id;});
 document.querySelectorAll('a[href^="/"]').forEach(a=>a.href='https://shiftsometimber.co.uk'+a.getAttribute('href'));
 window.scrollTo(0,0);
}
document.addEventListener('click',event=>{const a=event.target.closest('a');if(!a)return;const href=a.getAttribute('href');if(href&&href.startsWith('#')&&!href.startsWith('#test=')){const target=document.getElementById(href.slice(1));if(target){event.preventDefault();target.scrollIntoView({behavior:'smooth'});}}});
window.addEventListener('hashchange',showReview);showReview();
</script>`;
const review=readFileSync(new URL('./dist/index.html',root),'utf8').replace('</body>',script+'</body>');
writeFileSync(new URL('./review.html',import.meta.url),review);
writeFileSync(new URL('./dist/review.html',root),review);
writeFileSync(new URL('../../SHIFT-Home-Testing-Review.html',import.meta.url),review);
writeFileSync(new URL('./dist/mobile.html',root),'<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#707762"><iframe title="Mobile testing review" src="/shift-health/testing/prostate-health/" style="display:block;width:390px;height:900px;border:0;margin:10px auto"></iframe></body></html>');
