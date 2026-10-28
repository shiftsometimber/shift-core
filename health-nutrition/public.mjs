import {hubTemplate,shopTemplate} from './templates.mjs';
import {styles} from './styles.mjs';
import {categories,esc,filteredProducts,productCard,productDetail,sortChoices,sortAvailable,selectedSort} from './catalogue.mjs';
import {testingContent,addTestingLink} from '../health-testing/public.mjs';
import {testingStyle} from '../health-testing/styles.mjs';
export function renderContent(path,query,products=[]){
 if(path==='/shift-health/testing'||path.startsWith('/shift-health/testing/'))return testingContent(path);
 if(path==='/shift-health')return {content:addTestingLink(hubTemplate),title:'Men’s Health: Energy, Sleep & Wellbeing | SHIFT Health',description:'Straight-talking health information and practical support for ordinary men. Explore bloods, home testing, energy, sleep, wellbeing and everyday nutrition.'};
 const selected=query.get('product');
 if(selected){const p=products.find(x=>x.id===selected);return p?{content:productDetail(p),title:p.name+' | Supplements & Nutrition | SHIFT',description:p.description}:null;}
 let html=shopTemplate;
 const rows=filteredProducts(products,query),category=query.get('category')||'all';
 html=html.replace('<nav class="shop-categories" aria-label="Product categories" id="shop-categories"></nav>','<nav class="shop-categories" aria-label="Product categories" id="shop-categories">'+categories.map(([id,label])=>'<a class="category-option" '+(id===category?'aria-current="page" ':'')+'href="?category='+id+'#shop-categories">'+esc(label)+'</a>').join('')+'</nav>');
 html=html.replace('<div class="shop-toolbar">','<form class="shop-toolbar" method="get" action="/shift-health/supplements-nutrition"><input type="hidden" name="category" value="'+esc(category)+'">');
 html=html.replace('id="shop-search"','id="shop-search" name="q" value="'+esc(query.get('q')||'')+'"');
 html=html.replace('id="shop-brand"','id="shop-brand" name="brand"').replace('id="shop-format"','id="shop-format" name="format"').replace('id="shop-sort"','id="shop-sort" name="sort"');
 for(const [name,options] of [['brand',['all','Applied Nutrition','Skill Nutrition','BioTechUSA']],['format',['all','powder','sachets','tablets','bars']]]){
  html=html.replace(new RegExp('(<select id="shop-'+name+'"[\\s\\S]*?<\\/select>)'),select=>select.replace(/<option(?: value="([^"]*)")?>([^<]*)<\/option>/g,(all,value,text)=>'<option value="'+esc(value??text)+'"'+((query.get(name)||options[0])===(value??text)?' selected':'')+'>'+text+'</option>'));
 }
 const sort=selectedSort(products,query.get('sort'));
 html=html.replace(/<select id="shop-sort"[\s\S]*?<\/select>/,'<select id="shop-sort" name="sort" aria-describedby="shop-sort-note">'+sortChoices.map(([id,label])=>'<option value="'+id+'"'+(sort===id?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select>');
 html=html.replace('</div>\n        <div class="shop-summary">','<button class="sst-action" type="submit">Apply filters <span aria-hidden="true">→</span></button></form>\n        <div class="shop-summary">');
 const sortMessage=sort.startsWith('price-')&&!sortAvailable(products,sort)?'Prices are being confirmed. Showing A–Z for now.':sort==='popular'&&!sortAvailable(products,sort)?'Sales figures are being added. Showing A–Z for now.':sort==='rating'&&!sortAvailable(products,sort)?'Ratings are being added. Showing A–Z for now.':'';
 html=html.replace('<div class="shop-summary">','<p id="shop-sort-note" class="shop-pack"'+(sortMessage?'':' hidden')+' style="margin-bottom:18px">'+sortMessage+'</p><div class="shop-summary">');
 html=html.replace('8 products</p>',rows.length+' of '+products.length+' proposed products</p>');
 html=html.replace('<button type="button" id="shop-reset" class="cursor-interaction">Clear filters</button>','<a href="/shift-health/supplements-nutrition#shop-categories">Clear filters</a>');
 html=html.replace('<div class="shop-grid" id="shop-grid"></div>','<div class="shop-grid" id="shop-grid">'+rows.map(productCard).join('')+'</div>');
 if(!rows.length)html=html.replace('id="shop-empty" hidden','id="shop-empty"');
 if(['sleep','vitamins'].includes(category))html=html.replace('No matching products.','More everyday support is on the way.').replace('Try another category or clear your filters.','We’re putting this part of the range together. Explore our other categories in the meantime.');
 html=html.replace('<button type="button" class="sst-action cursor-interaction" data-action="clear-filters">See the whole range →</button>','<a class="sst-action" href="/shift-health/supplements-nutrition">See the whole range →</a>');
 return {content:html,title:'Supplements & Nutrition | SHIFT Health',description:'Explore SHIFT’s proposed Supplements & Nutrition range. Food first, practical everyday extras and clear information about how each product fits your journey.'};
}
export function renderDocument(shell,path,query,products=[]){
  const view=renderContent(path,query,products);if(!view)return null;
 if(!/<main\b[\s\S]*?<\/main>/i.test(shell))throw Error('Existing public shell has no main element');
 const canonical='https://shiftsometimber.co.uk'+path+(query.get('product')?'?product='+encodeURIComponent(query.get('product')):'');
 let html=shell.replace(/<main\b[\s\S]*?<\/main>/i,()=>'<main id="main-content" data-shift-health-approved="20261027"><div id="shift-health-range" class="sst-window">'+view.content+'</div></main>');
 html=html.replace(/<title>[\s\S]*?<\/title>/gi,'').replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:[^"']+|twitter:[^"']+)["'][^>]*>/gi,'').replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,'');
 // Programme-specific structured data must not describe the new storefront.
 html=html.replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'');
 html=html.replace('</head>','<title>'+esc(view.title)+'</title><meta name="description" content="'+esc(view.description)+'"><link rel="canonical" href="'+esc(canonical)+'"><meta property="og:title" content="'+esc(view.title)+'"><meta property="og:description" content="'+esc(view.description)+'"><meta property="og:url" content="'+esc(canonical)+'"><meta property="og:type" content="website"><meta property="og:image" content="'+(path.startsWith('/shift-health/testing')?'https://shiftsometimber.co.uk/assets/og-default.jpg':'https://shiftsometimber.co.uk/shift-health/assets/'+(path==='/shift-health'?'family-park':'nutrition-kitchen')+'.webp')+'"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">'+JSON.stringify({'@context':'https://schema.org','@type':path.startsWith('/shift-health/testing/')?'WebPage':'CollectionPage',name:view.title,url:canonical}).replace(/</g,'\\u003c')+'</script><style data-health-nutrition="20261027">'+styles+testingStyle+'\n#shift-health-range .category-option{display:inline-block;border:1px solid #707762;border-radius:30px;padding:10px 15px;min-height:44px;font-size:13px}#shift-health-range .category-option[aria-current]{background:#e7e3da;color:#050505}#shift-health-range form.shop-toolbar{grid-template-columns:2fr 1fr 1fr 1fr}#shift-health-range .shop-toolbar>button{grid-column:1/-1;justify-self:start}@media(max-width:820px){#shift-health-range form.shop-toolbar{grid-template-columns:1fr 1fr}}\n</style></head>');
 // The accepted shell has strong presentation rules. Keep this approved
 // component scoped above those rules without changing the shared chrome.
 html=html.replace(/(<style data-health-nutrition="20261027">)([\s\S]*?)(<\/style>)/,(_,open,css,close)=>open+css.replace(/(?<!#main-content )#shift-health-range/g,'#main-content #shift-health-range').replace(/([\w-]+)\s*:\s*([^;{}]+)([;}])/g,(_,property,value,end)=>property+':'+value.trim()+(value.includes('!important')?'':'!important')+end)+'#main-content #shift-health-range #shop-categories{scroll-margin-top:180px!important}'+close);
 return html;
}
