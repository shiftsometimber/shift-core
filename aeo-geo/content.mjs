import {ORIGIN,esc,graph,jsonLd,breadcrumbs,recipeSchema,exerciseSchema,TRUST_LINKS} from './schema.mjs';

export const styles=`:root{color-scheme:dark;--ink:#050505;--cream:#E7E3DA;--green:#707762}*{box-sizing:border-box}body{margin:0;background:var(--ink);color:var(--cream);font:17px/1.65 Arial,sans-serif}a{color:inherit}a:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid var(--cream);outline-offset:4px}.aeo-main{max-width:1120px;margin:auto;padding:28px 22px 48px}.aeo-main h1{font-size:clamp(2rem,5vw,4rem);line-height:1.07;max-width:1000px;margin:16px 0 20px}.aeo-main h2{font-size:1.65rem;line-height:1.2;margin:32px 0 12px}.aeo-main p{max-width:78ch}.aeo-kicker{font-size:13px;text-transform:uppercase;letter-spacing:.12em}.aeo-breadcrumb{font-size:14px;display:flex;gap:9px;flex-wrap:wrap}.aeo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:16px;margin-top:22px}.aeo-card{border:1px solid var(--green);border-radius:14px;padding:20px;display:flex;flex-direction:column;gap:12px;min-width:0}.aeo-card h2{font-size:1.2rem;margin:0}.aeo-card a{display:block;text-underline-offset:4px}.aeo-card p{font-size:.95rem;margin:0}.aeo-steps li{padding:8px 0}.aeo-columns{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);gap:32px}.aeo-photo{width:100%;max-height:460px;object-fit:contain;aspect-ratio:16/9;border-radius:14px;background:#171914}.aeo-meta,.aeo-note{font-size:.9rem}.aeo-note{border-left:3px solid var(--green);padding:12px 18px}.aeo-table-wrap{max-width:100%;overflow:auto}table{border-collapse:collapse;width:100%}th,td{padding:10px 12px;border-bottom:1px solid var(--green);text-align:left}caption{text-align:left;font-weight:bold}.aeo-cta{border:1px solid var(--green);background:var(--cream);color:var(--ink);padding:22px;border-radius:14px;margin-top:28px}.aeo-cta a{display:inline-block;background:var(--ink);color:var(--cream);padding:10px 20px;border-radius:24px;font-weight:bold}.aeo-trust{display:flex;gap:14px;flex-wrap:wrap;font-size:14px;margin:22px 0}.aeo-search{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}.aeo-search label{display:flex;gap:8px;align-items:center}.aeo-search input,.aeo-search select{background:var(--cream);color:var(--ink);border:1px solid var(--green);padding:12px;border-radius:7px;max-width:100%;font:inherit}.aeo-search button{font:inherit;background:var(--cream);color:var(--ink);border:0;border-radius:7px;padding:12px 20px}.aeo-pagination{display:flex;gap:18px;flex-wrap:wrap;margin:26px 0}.skip-link-v30f{position:absolute;left:10px;top:-100px;background:var(--cream);color:var(--ink);padding:10px;z-index:100}.skip-link-v30f:focus{top:10px}@media(max-width:700px){.aeo-columns{grid-template-columns:1fr;gap:8px}.aeo-main{padding:20px 18px 36px}.aeo-main h1{overflow-wrap:break-word}.aeo-search label{width:100%;flex-wrap:wrap}.aeo-search input{width:100%}}`;
const dateText=date=>new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'});
const list=(items,ordered=false)=>'<'+(ordered?'ol':'ul')+'>'+items.map((s,i)=>'<li'+(ordered?' id="step-'+(i+1)+'"':'')+'>'+esc(s)+'</li>').join('')+'</'+(ordered?'ol':'ul')+'>';
const cta='<aside class="aeo-cta"><h2>Useful on its own. Easier to keep going with My Timber.</h2><p>Keep your plans, tracking and check-ins together. Your account stays private.</p><a href="/member-register">Start My Timber</a></aside>';
// Short search snippets do not replace the complete, visible recipe identity.
const shortAtWord=(value,limit)=>{
 const text=String(value||'').replace(/\s+/g,' ').trim();
 if(text.length<=limit)return text;
 const slice=text.slice(0,limit-1),end=slice.lastIndexOf(' ');
 return (end>limit*0.6?slice.slice(0,end):slice).replace(/[\s,:;—-]+$/,'')+'…';
};
export function recipeSearchMetadata(item){
 const full=String(item.title||'').replace(/\s+/g,' ').trim();
 let candidate=full;
 if(full.length>70&&full.includes(' — ')){
  const split=full.indexOf(' — '),base=full.slice(0,split).replace(/\s+to share$/i,''),parts=full.slice(split+3).split(',').map(v=>v.trim()).filter(Boolean);
  // Keep a distinguishing ingredient at the end, even when the original
  // dish name itself needs shortening. Otherwise hundreds of long variants
  // risk receiving the same truncated metadata.
  const last=parts.at(-1)||'',pair=parts.slice(-2).join(', '),variant=pair.length<=37?pair:last;
  const maxBase=70-3-variant.length;
  if(variant&&maxBase>=20){
   const shorter=base.length>maxBase?base.slice(0,maxBase).replace(/\s+\S*$/,''):base;
   const head=shorter.replace(/[\s,:;—-]+$/,'');
   if(head)candidate=head+' — '+variant;
  }
 }
 const metaTitle=shortAtWord(candidate,70);
 const name=metaTitle.replace(/…$/,'');
 const metaDescription=shortAtWord('Ingredients, step-by-step method and estimated nutrition per serving for '+name+'.',155);
 return {metaTitle,metaDescription};
}
export function page({title,description,path,body,nodes=[],date,shell,status=200,noindex=false,metaTitle=title,metaDescription=description}){
 const metadata=jsonLd(graph([{'@type':'WebPage','@id':ORIGIN+path+'#webpage',url:ORIGIN+path,name:title,description,datePublished:date,dateModified:date,isPartOf:{'@id':ORIGIN+'/#website'},inLanguage:'en-GB'},...nodes]));
 const css=['programme-treatment-handoff-v1.css?v=1','header-navigation-v2.css','shift-compact-entry-v1.css?v=1'].map(x=>'<link rel="stylesheet" href="/assets/'+x+'">').join('');
 const scripts=['/analytics-bootstrap-v1.js','/assets/v42.js','/consent-v4a.js','/analytics-events-v31b.js','/assets/shift-purchase-basket-v1.js'].map(x=>'<script defer src="'+x+'"></script>').join('');
 return {status,html:'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#050505"><title>'+esc(metaTitle)+' | SHIFT</title><meta name="description" content="'+esc(metaDescription)+'"><meta name="robots" content="'+(noindex?'noindex,follow':'index,follow,max-image-preview:large')+'"><link rel="canonical" href="'+ORIGIN+esc(path)+'"><meta property="og:title" content="'+esc(metaTitle)+'"><meta property="og:description" content="'+esc(metaDescription)+'"><meta property="og:url" content="'+ORIGIN+esc(path)+'"><meta property="og:type" content="website">'+metadata+css+'<style>'+styles+'</style></head><body class="sst-fullsite-v35 sst-site-v31 one-shift"><a class="skip-link-v30f" href="#main-content">Skip to main content</a>'+shell.header+'<main id="main-content" class="aeo-main">'+body+'</main>'+shell.footer+scripts+'</body></html>'};
}
const crumb=(kind,title)=>'<nav class="aeo-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/'+kind+'">'+(kind==='recipes'?'Recipes':'Exercises')+'</a>'+(title?'<span>/</span><span aria-current="page">'+esc(title)+'</span>':'')+'</nav>';
const byline=date=>'<p class="aeo-meta">By <a href="/authors/shift-some-timber-editorial-team">Shift Some Timber editorial team</a> · Published <time datetime="'+esc(date)+'">'+dateText(date)+'</time> · Updated '+dateText(date)+'</p>';
export function detail(item,kind,data,shell){
 const recipe=kind==='recipes',nodes=[recipe?recipeSchema(item,data.publishedAt):exerciseSchema(item,data.publishedAt),breadcrumbs([['/','Home'],['/'+kind,recipe?'Recipes':'Exercises'],[item.path,item.title]])];
 let body=crumb(kind,item.title)+'<p class="aeo-kicker">'+(recipe?'SHIFT Grub':'SHIFT Fit')+'</p><h1>'+esc(item.title)+'</h1><p>'+esc(item.description)+'</p>'+byline(data.publishedAt);
 if(item.image)body+='<img class="aeo-photo" src="'+esc(item.image)+'" alt="'+esc(item.imageAlt||item.title)+'" width="960" height="540" fetchpriority="high" decoding="async">';
 if(recipe){
  body+='<p class="aeo-meta">Makes '+esc(item.servings)+' servings'+(item.minutes?' · About '+esc(item.minutes)+' minutes':'')+'</p><div class="aeo-columns"><section><h2>Ingredients</h2>'+list(item.ingredients)+(item.equipment.length?'<h2>Equipment</h2>'+list(item.equipment):'')+'</section><section class="aeo-steps"><h2>Method</h2>'+list(item.method,true)+'</section></div>';
  const fields={kcal:['Energy','kcal'],protein_g:['Protein','g'],carbohydrate_g:['Carbohydrate','g'],fat_g:['Fat','g'],fibre_g:['Fibre','g'],saturates_g:['Saturates','g']};
  body+='<section><h2>Estimated nutrition</h2><div class="aeo-table-wrap"><table><caption>Per serving</caption><tbody>'+Object.entries(fields).map(([k,[label,unit]])=>'<tr><th scope="row">'+label+'</th><td>'+(item.nutrition[k]===null?'Not available':esc(item.nutrition[k])+' '+unit)+'</td></tr>').join('')+'</tbody></table></div><p class="aeo-note">'+esc(item.methodology)+'</p></section>';
  if(item.allergens.length)body+='<section><h2>Allergens and product labels</h2>'+list(item.allergens)+'</section>';
  if(item.safety.length||item.storage.length)body+='<section><h2>Food safety and storage</h2>'+list([...item.safety,...item.storage])+'</section>';
  if(item.timingNote)body+='<p class="aeo-note">'+esc(item.timingNote)+'</p>';
 }else{
  body+='<section class="aeo-steps"><h2>How to do it</h2>'+list(item.steps,true)+'</section>';
  if(item.equipment.length)body+='<section><h2>Equipment</h2>'+list(item.equipment)+'</section>';
  if(item.doses.length)body+='<section><h2>Example variations</h2><p>The written steps above use one library example. These other doses are separate options, not instructions to complete every variation or progress automatically.</p><div class="aeo-table-wrap"><table><thead><tr><th scope="col">Level</th><th scope="col">Example dose</th><th scope="col">Equipment</th></tr></thead><tbody>'+item.doses.map(d=>'<tr><td>'+esc(d.level||'See dose')+'</td><td>'+esc(d.dose)+'</td><td>'+esc(d.equipment.join(', ')||'See instructions')+'</td></tr>').join('')+'</tbody></table></div></section>';
  if(item.safety.length)body+='<section><h2>Safety and comfort</h2>'+list(item.safety)+'</section>';
  body+='<p class="aeo-note">General movement information, not an individual exercise prescription. Independent trainer or clinical review is not claimed. Use appropriate support and seek individual advice for an injury or restriction.</p>';
 }
 body+='<nav class="aeo-trust" aria-label="Related tools"><a href="/recipes">Browse recipes</a><a href="/exercises">Browse exercises</a><a href="/tools">Everyday tools</a><a href="/explore-knowledge">Health guides</a></nav>'+cta+TRUST_LINKS;
 return page({title:item.title,description:item.description,path:item.path,body,nodes,date:data.publishedAt,shell,...(recipe?recipeSearchMetadata(item):{})});
}
export function indexPage(kind,data,shell,url){
 const recipe=kind==='recipes',title=recipe?'Recipes for ordinary life':'Movement, at your pace',all=recipe?data.recipes:data.exercises;
 const query=(url.searchParams.get('q')||'').trim().slice(0,100),meal=recipe?url.searchParams.get('meal')||'':'';
 const found=all.filter(r=>(!query||(r.title+' '+(r.ingredients||[]).join(' ')).toLowerCase().includes(query.toLowerCase()))&&(!meal||r.mealType===meal));
 const size=48,total=Math.max(1,Math.ceil(found.length/size)),requested=Number(url.searchParams.get('page')||1),number=Number.isSafeInteger(requested)?Math.max(1,Math.min(total,requested)):1;
 const rows=found.slice((number-1)*size,number*size),path='/'+kind+(number>1?'?page='+number:'');
 const href=n=>'/'+kind+'?'+new URLSearchParams({...query?{q:query}:{},...meal?{meal}:{},page:String(n)});
 let body=crumb(kind)+'<p class="aeo-kicker">'+(recipe?'SHIFT Grub':'SHIFT Fit')+'</p><h1>'+title+'</h1><p>'+(recipe?'Real ingredients, a method you can follow, and estimated nutrition. Browse the public library, then keep your plans together in My Timber.':'Written guides to '+all.length+' movements, with their equipment and example variations in one place. Start where you are comfortable.')+'</p>';
 body+='<form class="aeo-search" method="get" action="/'+kind+'"><label>Find '+kind+'<input type="search" name="q" value="'+esc(query)+'" maxlength="100"></label>'+(recipe?'<label>Meal<select name="meal"><option value="">All meals</option>'+['breakfast','lunch','dinner','snack'].map(m=>'<option'+(meal===m?' selected':'')+' value="'+m+'">'+m[0].toUpperCase()+m.slice(1)+'</option>').join('')+'</select></label>':'')+'<button type="submit">Search</button></form><p>'+found.length+' '+kind+' · Page '+number+' of '+total+'</p><div class="aeo-grid">'+rows.map(r=>'<article class="aeo-card"><h2><a href="'+esc(r.path)+'">'+esc(r.title)+'</a></h2><p>'+esc(recipe?[(r.minutes?'About '+r.minutes+' minutes':null),r.servings+' servings'].filter(Boolean).join(' · '):r.sourceVariants+' library variations')+'</p></article>').join('')+'</div><nav class="aeo-pagination" aria-label="Library pages">'+(number>1?'<a rel="prev" href="'+esc(href(number-1))+'">← Previous</a>':'')+(number<total?'<a rel="next" href="'+esc(href(number+1))+'">Next →</a>':'')+'</nav>'+cta+TRUST_LINKS;
 return page({title:title+(number>1?' — page '+number:''),description:recipe?'Browse public SHIFT recipes with ingredients, methods and estimated nutrition.':'Browse public SHIFT exercise guides with written steps, equipment and example doses.',path,body,date:data.publishedAt,shell,noindex:!!(query||meal),nodes:[breadcrumbs([['/','Home'],['/'+kind,recipe?'Recipes':'Exercises']]),{'@type':'ItemList',itemListElement:rows.map((r,i)=>({'@type':'ListItem',position:(number-1)*size+i+1,url:ORIGIN+r.path}))}]});
}
