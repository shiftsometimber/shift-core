import fs from 'node:fs';
import path from 'node:path';
const source='/workspace/sites/shift-bloods-preview/dist';
const root='/shift-health/blood-tests';
const sourceRoutes=[root,...['baseline','advanced','complete'].flatMap(id=>[`${root}/${id}`,`${root}/${id}/your-test`]),'/member/blood-tests','/preview-terms'];
const assetRoot='/assets/shift-bloods/20261018';
const scope='[data-shift-bloods]';
function scopedCss(input){
 const css=input.replace(/\/\*[\s\S]*?\*\//g,'');let out='',i=0;
 while(i<css.length){
  while(/\s/.test(css[i]??'')&&i<css.length)i++;
  if(i>=css.length)break;
  let j=i;while(j<css.length&&css[j]!=='{'&&css[j]!==';')j++;
  const pre=css.slice(i,j).trim();
  if(css[j]===';'){if(!pre.startsWith('@layer'))out+=pre+';';i=j+1;continue;}
  if(j===css.length)break;
  let depth=1,k=j+1,quote='';
  for(;k<css.length&&depth;k++){const c=css[k];if(quote){if(c===quote&&css[k-1]!=='\\')quote='';}else if(c==='"'||c==="'")quote=c;else if(c==='{')depth++;else if(c==='}')depth--;}
  const body=css.slice(j+1,k-1);
  if(pre.startsWith('@layer'))out+=scopedCss(body);
  else if(pre.startsWith('@media')||pre.startsWith('@supports'))out+=pre+'{'+scopedCss(body)+'}';
  else {const selectors=pre.split(',').map(s=>{s=s.trim();return [':root','html','body'].includes(s)?scope:scope+' '+s;});out+=selectors.join(',')+'{'+body+'}';}
  i=k;
 }
 return out;
}
const pages=sourceRoutes.map(route=>{
 const html=fs.readFileSync(path.join(source,route,'index.html'),'utf8');
 const target=route==='/member/blood-tests'?root+'/my-timber-example':route==='/preview-terms'?root+'/about':route;
 let main=html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];if(!main)throw Error('Missing main '+route);
 const replacements=[
  ['/member/blood-tests',root+'/my-timber-example'],['/preview-terms',root+'/about'],['/assets/upper-arm-',assetRoot+'/upper-arm-'],
  ['Private preview · not available to order','SHIFT Bloods · Coming soon · Ordering is not open'],
  ['YOUR NEXT STEP · PREVIEW','YOUR NEXT STEP · COMING SOON'],
  ['Preview only. Choosing does not place an order.','Coming soon. Choosing does not place an order.'],
  ['Preview only · Ordering is closed.','Coming soon · Ordering is closed.'],
  ['Ordering is closed in this private preview.','Ordering is not open yet.'],
  ['The upper-arm option is shown as a trial in this preview, rather than a confirmed collection service.','The upper-arm option is in trial. Availability and supported tests will be confirmed before ordering opens.'],
  ['This preview does not collect personal details, take payment or place an order.','Ordering is not open. This page does not collect personal details, take payment or place an order.'],
  ['This is the end of the selection preview. No order has been placed.','No order has been placed. We’ll explain the confirmed service and full price before ordering opens.'],
  ['This preview does not promise a free repeat or a particular response time.','Repeat-kit costs and response times will be explained before ordering opens.'],
  ['About this preview.','About SHIFT Bloods.'],['A working design for SHIFT Bloods. Testing and ordering are not open.','The planned SHIFT Bloods service. Testing and ordering are not open.'],
  ['What is available here?','What can I explore?'],['Personal information in this preview','Personal information on these pages'],
  ['This preview has no questionnaire, payment form, live order registration or blood-results import.','These pages have no questionnaire, payment form, live order registration or blood-results import.'],
  ['The code does not send these choices to a testing partner or marketing analytics service.','The collection controls do not send these choices to a testing partner or create a test order.'],
  ['The private hosting service controls access to this preview. There are no additional marketing trackers in the preview application.','The website’s existing privacy and cookie information also applies. The Bloods selection controls add no marketing trackers.'],
  ['This preview text does not replace the final service terms or privacy information.','This information does not replace the final test-specific terms or privacy information.'],
  ['this preview does not assert that a future testing journey is already covered by them.','the test-specific service and data-sharing information will be confirmed before ordering opens.'],
  ['<span class="eyebrow">PRIVATE REVIEW</span>','<span class="eyebrow">SHIFT BLOODS · COMING SOON</span>']
 ];
 for(const [a,b]of replacements)main=main.split(a).join(b);
 main=main.replace(/this preview/gi,'these information pages');
 const title=target.endsWith('/about')?'About SHIFT Bloods | SHIFT Bloods':html.match(/<title>(.*?)<\/title>/i)[1].replace(/ \| SHIFT Bloods Preview$/,' | SHIFT Bloods');
 const noindex=/\/your-test$|my-timber-example$|\/about$/.test(target);
 const description=target===root?'Explore SHIFT Bloods: proposed Baseline, Advanced and Complete panels, with finger-prick and upper-arm collection options in trial. Ordering is not open.':target.endsWith('/about')?'Understand the planned SHIFT Bloods service, proposed testing partner and how these information pages use your choices.':target.endsWith('/my-timber-example')?'An illustrated example of how blood-test progress and results access could fit My Timber. No live orders or results are shown.':title.replace(/ \| SHIFT Bloods$/,'')+'. Explore the proposed panel and collection options. Ordering is not open.';
 return {route:target,path:target+'.html',title,description,noindex,main:'<main id="main-content" data-shift-bloods><div class="bloods-availability">SHIFT Bloods · Coming soon · Ordering is not open</div>'+main+'</main>'};
});
const assets=[];
let js=fs.readFileSync(path.join(source,'assets/bloods.js'),'utf8');
js=js.replace("const storageKey='shift-bloods-preview-choice-v1';","const storageKey='shift-bloods-choice-v1';\n const scope=document.querySelector('[data-shift-bloods]');if(!scope)return;");
const start=js.indexOf(" const menuButton="),end=js.indexOf(" const stage=",start);if(start<0||end<0)throw Error('Expected isolated menu block');
js=js.slice(0,start)+js.slice(end);js=js.replaceAll('document.querySelectorAll','scope.querySelectorAll').replaceAll('document.querySelector(', 'scope.querySelector(').replace("const scope=scope.querySelector('[data-shift-bloods]')","const scope=document.querySelector('[data-shift-bloods]')");
const css=scopedCss(fs.readFileSync(path.join(source,'assets/bloods.css'),'utf8'))+'\n[data-shift-bloods] .bloods-availability{padding:12px 18px;background:#283024;color:#e7e3da;text-align:center;font:700 11px/1.6 Arial,sans-serif;letter-spacing:.07em;text-transform:uppercase}';
for(const [name,content]of [['bloods.css',css],['bloods.js',js]])assets.push({path:assetRoot+'/'+name,content:Buffer.from(content).toString('base64')});
for(const name of ['upper-arm-collection.svg','upper-arm-overview-poster.png','upper-arm-overview.mp4','upper-arm-overview.vtt'])assets.push({path:assetRoot+'/'+name,content:fs.readFileSync(path.join(source,'assets',name)).toString('base64')});
const bundle={release:'shift-bloods-public-20261018',approvedPreviewCommit:'605f5ce41a82895eeb4634cbdd4d4580922a6a72',assetRoot,pages,assets,indexRoutes:pages.filter(p=>!p.noindex).map(p=>p.route),orderingEnabled:false};
fs.writeFileSync(new URL('./approved-content.json',import.meta.url),JSON.stringify(bundle));
console.log(JSON.stringify({pages:pages.map(p=>p.route),assets:assets.length,publicIndexRoutes:bundle.indexRoutes,orderingEnabled:false}));
