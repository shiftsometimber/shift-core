const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname,bundle=JSON.parse(fs.readFileSync(path.join(ROOT,'approved-content.json'))),base=JSON.parse(fs.readFileSync(path.join(ROOT,'origin-provenance.json')));
const donor=fs.readFileSync(path.join(ROOT,'before/shift-health.html'),'utf8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const changes=[];
function write(p,bytes,type){const dest=path.join(ROOT,'after',p);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);changes.push({path:p,sha256:sha(bytes),bytes:Buffer.byteLength(bytes),contentType:type});}
for(const page of bundle.pages){
 const canonical='https://shiftsometimber.co.uk'+page.route;
 const schema={'@context':'https://schema.org','@type':'WebPage',name:page.title,url:canonical,description:page.description,isPartOf:{'@id':'https://shiftsometimber.co.uk/#website'}};
 let html=donor.replace(/<main\b[\s\S]*?<\/main>/i,()=>page.main)
 .replace(/<title>[\s\S]*?<\/title>/gi,'')
 .replace(/<link\b(?=[^>]*\brel\s*=\s*(?:"canonical"|'canonical'|canonical(?=[\s/>])))[^>]*>/gi,'')
 .replace(/<meta\b(?=[^>]*(?:name|property)\s*=\s*["'](?:description|robots|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'')
 .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'');
 const head=`<title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="${page.noindex?'noindex,follow':'index,follow'}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website"><meta property="og:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><link rel="stylesheet" href="${bundle.assetRoot}/bloods.css"><script src="${bundle.assetRoot}/bloods.js" defer></script>`;
 html=html.replace('</head>',head+'</head>');
 if((html.match(/<h1\b/g)||[]).length!==1||!html.includes(page.main)||/chatgpt\.site|SHIFT Bloods Preview|private preview/i.test(html))throw Error('Public page scope failed '+page.route);
 if(/<form\b|<input\b|<textarea\b/i.test(page.main))throw Error('Unexpected patient form '+page.route);
 if(page.route.endsWith('/complete')&&(!page.main.includes('professional venous')||page.main.includes('<h3>Upper-arm collection device')))throw Error('Unsupported Complete collection');
 if(!page.route.endsWith('/about')&&/vitall|healthy human labs/i.test(page.main))throw Error('Supplier identity leaked into promotional copy');
 write(page.path,Buffer.from(html),'text/html; charset=utf-8');
}
const types={'.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.mp4':'video/mp4','.vtt':'text/vtt; charset=utf-8'};
for(const a of bundle.assets)write(a.path,Buffer.from(a.content,'base64'),types[path.extname(a.path)]);
const sitemapPath=path.join(ROOT,'before/sitemap.xml');
if(fs.existsSync(sitemapPath)){
 let xml=fs.readFileSync(sitemapPath,'utf8');
 const additions=bundle.indexRoutes.filter(r=>!xml.includes('https://shiftsometimber.co.uk'+r+'<')).map(r=>`<url><loc>https://shiftsometimber.co.uk${r}</loc><lastmod>2026-10-18</lastmod></url>`).join('');
 if(additions){xml=xml.replace('</urlset>',additions+'</urlset>');write('/sitemap.xml',Buffer.from(xml),'application/xml; charset=utf-8');}
}
const prep={release:bundle.release,approval:'Matt: Publish all, 18 October 2026; public marketing pages only, ordering closed',approvedPreviewCommit:bundle.approvedPreviewCommit,baseDeployment:base.id,baseCommit:base.commit,baseFiles:base.files,changes,headersSHA256:sha(fs.readFileSync(path.join(ROOT,'_headers'))),indexRoutes:bundle.indexRoutes,ordersEnabled:false,homepageChanged:false,patientDataForms:false};
fs.writeFileSync(path.join(ROOT,'prepared-changes.json'),JSON.stringify(prep,null,2));
const review=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Bloods layout acceptance</title><style>body{margin:20px;background:#333;color:white;font:16px Arial}iframe{border:0;background:#050505}.desktop{width:1008px;height:1540px;overflow:hidden}.desktop iframe{width:1440px;height:2200px;transform:scale(.7);transform-origin:top left}.mobile{width:380px;height:2200px;display:block}h1{font-size:22px}</style><h1>380 px layout</h1><iframe class="mobile" title="Mobile-width Bloods" src="/shift-health/blood-tests"></iframe><h1>1440 px layout at 70% display scale</h1><div class="desktop"><iframe title="Desktop-width Bloods" src="/shift-health/blood-tests"></iframe></div></html>`;
fs.mkdirSync(path.join(ROOT,'review'),{recursive:true});fs.writeFileSync(path.join(ROOT,'review/bloods-layout-review.html'),review);
console.log(JSON.stringify({prepared:true,base:base.id,pages:bundle.pages.length,assets:bundle.assets.length,sitemapUpdated:changes.some(x=>x.path==='/sitemap.xml'),bytes:changes.reduce((n,x)=>n+x.bytes,0),ordersEnabled:false}));
