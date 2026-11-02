export const ORIGIN='https://shiftsometimber.co.uk';
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const jsonLd=value=>'<script type="application/ld+json">'+JSON.stringify(value).replace(/</g,'\\u003c')+'</script>';
// These are the three profile URLs already identified by the live website.
// New profile claims and professional-register links require verified evidence.
export const ORGANIZATION={
 '@type':'Organization','@id':ORIGIN+'/#organization',name:'Shift Some Timber',legalName:'Shift Some Timber Ltd',url:ORIGIN+'/',
 description:'UK men’s health information and practical, non-judgemental support during and after weight-management treatment.',
 logo:{'@type':'ImageObject',url:ORIGIN+'/assets/shift-wordmark.png'},
 identifier:{'@type':'PropertyValue',propertyID:'UK Companies House company number',value:'17393135'},
 email:'hello@shiftsometimber.co.uk',telephone:'0330 311 0981',
 sameAs:['https://instagram.com/ShiftSomeTimber','https://facebook.com/ShiftSomeTimber','https://x.com/ShiftSomeTimber','https://www.youtube.com/@ShiftSomeTimber']
};
export const WEBSITE={'@type':'WebSite','@id':ORIGIN+'/#website',name:'Shift Some Timber',url:ORIGIN+'/',publisher:{'@id':ORIGIN+'/#organization'},inLanguage:'en-GB'};
export function breadcrumbs(items){return {'@type':'BreadcrumbList',itemListElement:items.map(([path,name],i)=>({'@type':'ListItem',position:i+1,name,item:ORIGIN+path}))};}
export function recipeSchema(r,date){
 const schema={'@type':'Recipe','@id':ORIGIN+r.path+'#recipe',url:ORIGIN+r.path,name:r.title,description:r.description,
  author:{'@id':ORIGIN+'/#organization'},publisher:{'@id':ORIGIN+'/#organization'},inLanguage:'en-GB',datePublished:date,dateModified:date,
  recipeYield:r.servings+' servings',recipeIngredient:r.ingredients,
  recipeInstructions:r.method.map((text,i)=>({'@type':'HowToStep',text,url:ORIGIN+r.path+'#step-'+(i+1)}))};
 if(r.image)schema.image=[r.image];
 if(r.minutes)schema.totalTime='PT'+r.minutes+'M';
 if(r.prepMinutes)schema.prepTime='PT'+r.prepMinutes+'M';
 if(r.cookMinutes)schema.cookTime='PT'+r.cookMinutes+'M';
 if(r.mealType)schema.recipeCategory=r.mealType;
 const fields={kcal:['calories',' calories'],protein_g:['proteinContent',' g'],carbohydrate_g:['carbohydrateContent',' g'],fat_g:['fatContent',' g'],fibre_g:['fiberContent',' g'],saturates_g:['saturatedFatContent',' g']};
 const n={'@type':'NutritionInformation'};for(const [k,[field,unit]] of Object.entries(fields))if(r.nutrition[k]!==null)n[field]=r.nutrition[k]+unit;
 if(Object.keys(n).length>1)schema.nutrition=n;
 return schema;
}
export function exerciseSchema(e,date){
 // A movement with multiple example doses is a HowTo, not an individual
 // prescribed ExercisePlan. There is no Google exercise rich-result promise.
 return {'@type':'HowTo','@id':ORIGIN+e.path+'#movement',url:ORIGIN+e.path,name:e.title,description:e.description,
  publisher:{'@id':ORIGIN+'/#organization'},datePublished:date,dateModified:date,inLanguage:'en-GB',
  ...(e.image?{image:e.image}:{}),step:e.steps.map((text,i)=>({'@type':'HowToStep',text,url:ORIGIN+e.path+'#step-'+(i+1)}))};
}
export function graph(nodes){return {'@context':'https://schema.org','@graph':[ORGANIZATION,WEBSITE,...nodes]};}
export const TRUST_LINKS='<nav class="aeo-trust" aria-label="Editorial information"><a href="/editorial-standards">Editorial standards</a><a href="/clinical-governance">Clinical governance</a><a href="/expert-contributors">Authors and review transparency</a><a href="/medical-disclaimer">Medical disclaimer</a></nav>';
const strip=s=>String(s||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
const decode=s=>s.replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>');
const privatePath=/^\/(?:member(?:[-/]|$)|v1(?:\/|$)|api(?:\/|$)|hq(?:\/|$)|admin(?:\/|$)|account(?:\/|$)|auth(?:\/|$)|checkout(?:\/|$)|treatment-order(?:\/|$)|treatment-assessment(?:\/|$)|clinical-review(?:\/|$)|reset-password(?:\/|$)|email-templates(?:\/|$))/;
export const isPrivatePath=path=>privatePath.test(path);
export function enhancePublicHtml(html,path,metadata={}){
 if(isPrivatePath(path)||/name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html))return html;
 let hasOrg=false,hasWebsite=false,hasBreadcrumb=false,hasFaq=false,article=null;
 if(metadata.description){
  html=html.replace(/<meta\b(?=[^>]*(?:name=["']description["']|property=["']og:description["']|name=["']twitter:description["']))[^>]*>/gi,tag=>tag.replace(/content=["'][\s\S]*?["'](?=\s|\/?>)/i,'content="'+esc(metadata.description)+'"'));
 }
 html=html.replace(/(<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script\s*>)/gi,(all,open,raw,close)=>{
  try{
   const visit=value=>{
    if(Array.isArray(value))return value.map(visit);
    if(!value||typeof value!=='object')return value;
    const n={...value},types=[n['@type']].flat();
    if(types.includes('Organization')&&(n['@id']===ORIGIN+'/#organization'||[ORIGIN,ORIGIN+'/'].includes(n.url)&&/^(?:Shift Some Timber|Shift Some Timber Ltd)$/i.test(n.name||''))){hasOrg=true;return {...n,...ORGANIZATION};}
    if(types.includes('WebSite'))hasWebsite=true;
    if(types.includes('BreadcrumbList'))hasBreadcrumb=true;
    if(types.includes('FAQPage'))hasFaq=true;
    if(types.some(t=>['Article','BlogPosting','NewsArticle','MedicalWebPage'].includes(t))&&!article)article=n;
    for(const k of Object.keys(n))if(n[k]&&typeof n[k]==='object')n[k]=visit(n[k]);
    return n;
   };
   return open+JSON.stringify(visit(JSON.parse(raw))).replace(/</g,'\\u003c')+close;
  }catch{return all;}
 });
 const additions=[];
 if(!hasOrg)additions.push(ORGANIZATION);if(!hasWebsite)additions.push(WEBSITE);
 if(!hasFaq){
  const block=html.match(/<h2\b[^>]*>\s*(?:FAQ|Frequently asked questions)\s*<\/h2>([\s\S]*?)(?=<h2\b|<\/main>)/i)?.[1];
  if(block){
   const questions=[...block.matchAll(/<h3\b[^>]*>([\s\S]*?)<\/h3>\s*<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m=>({name:decode(strip(m[1])),text:decode(strip(m[2]))})).filter(q=>q.name.endsWith('?')&&q.text.length>15).slice(0,12);
   if(questions.length)additions.push({'@type':'FAQPage',mainEntity:questions.map(q=>({'@type':'Question',name:q.name,acceptedAnswer:{'@type':'Answer',text:q.text}}))});
  }
 }
 if(!hasBreadcrumb&&path!=='/'){
  const h1=decode(strip(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]||'Page'));
  const items=[['/','Home']];if(/^\/(?:articles|guides)\//.test(path))items.push(['/explore-knowledge','Knowledge']);items.push([path,h1]);additions.push(breadcrumbs(items));
 }
 if(additions.length)html=html.replace(/<\/head>/i,jsonLd({'@context':'https://schema.org','@graph':additions})+'</head>');
 html=html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi,footer=>footer.includes('href="/recipes"')?footer:footer.replace(/(<h2>Explore<\/h2>)/i,'$1<a href="/recipes">Recipes</a><a href="/exercises">Exercises</a>'));
 if(/^\/(?:articles|guides|medicine-news)\//.test(path)){
  let info='';
  if(article?.dateModified && Number.isFinite(Date.parse(article.dateModified))&&!html.includes('data-aeo-updated')){
   const date=new Date(article.dateModified).toISOString(),label=new Date(date).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'});
   info+='<p data-aeo-updated>Last updated <time datetime="'+esc(date)+'">'+esc(label)+'</time>.</p>';
  }
  // Existing organisational authors remain organisational. Never relabel an
  // AI-assisted/team article as a named person's work or clinical review.
  if(!/data-aeo-trust-footer/.test(html))html=html.replace(/<\/main>/i,'<section data-aeo-trust-footer aria-label="About this information">'+info+TRUST_LINKS+'</section></main>');
 }
 return html;
}
