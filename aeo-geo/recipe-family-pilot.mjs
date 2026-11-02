// Review-only preparation from the retained public catalogue.
// This module is not imported by the serving worker and changes no URL or index directive.
const copy=value=>JSON.parse(JSON.stringify(value));
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const PILOT_OWNER='/recipes/berries-yoghurt-pot-greek-yoghurt-396e5b52';
export function prepareRecipeFamilyPilot(catalogue){
 const recipes=catalogue.recipes.filter(r=>r.title.split(' — ')[0]==='Berries yoghurt pot');
 const primary=recipes.find(r=>r.path===PILOT_OWNER);
 if(!primary)throw Error('Retained canonical owner is missing; do not invent a replacement.');
 if(recipes.length<2)throw Error('No family to review.');
 if(recipes.some(r=>r.servings!==1||r.mealType!==primary.mealType||JSON.stringify(r.method)!==JSON.stringify(primary.method)))
  throw Error('Family needs separate method/portion review.');
 return {status:'prepared_for_editorial_review_only',canonicalOwner:PILOT_OWNER,
  queryFamily:'berries yoghurt pot; quick yoghurt breakfast or snack',
  clusterOwner:'/recipes',supportingOwners:['/programme','/male-obesity'],
  title:'Berries yoghurt pot',intro:'Choose one of the versions below, then use that version’s ingredient quantities and estimated nutrition. Each version makes one serving.',
  primaryRecipe:copy(primary),variants:copy(recipes),
  publicationPlan:'Keep the existing Greek-yoghurt URL as the owner. Consider redirects only after this complete family and its variants are approved; no canonical, redirect, sitemap or indexing change is applied by this preparation.',
  factsPreserved:['ingredient quantities','method','estimated nutrition including unavailable values','allergens','food-safety and storage notes','equipment','source record identity'],
  restrictions:['No new nutrition or health claim','No invented cooking trial or reviewer','Existing image QA hold retained','No new publication or modification date','No member-catalogue change']};
}
export function renderRecipeFamilyPreview(pilot){
 const nutrition={kcal:['Energy','kcal'],protein_g:['Protein','g'],carbohydrate_g:['Carbohydrate','g'],fat_g:['Fat','g'],fibre_g:['Fibre','g'],saturates_g:['Saturates','g']};
 const list=items=>'<ul>'+items.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>';
 return '<section data-recipe-family-preview="prepared-only"><h1>'+esc(pilot.title)+'</h1><p>'+esc(pilot.intro)+'</p>'+
 pilot.variants.map(r=>'<article id="variant-'+esc(r.id)+'"><h2>'+esc(r.title)+'</h2><p>One serving. About '+esc(r.minutes)+' minutes.</p><h3>Ingredients</h3>'+list(r.ingredients)+
 '<table><caption>Estimated nutrition for this version, per serving</caption><tbody>'+Object.entries(nutrition).map(([key,[label,unit]])=>'<tr><th scope="row">'+label+'</th><td>'+(r.nutrition[key]===null?'Not available':esc(r.nutrition[key])+' '+unit)+'</td></tr>').join('')+'</tbody></table>'+
 '<h3>Allergens and product labels</h3>'+list(r.allergens)+
 '<details><summary>Equipment, food safety and storage</summary>'+list([...(r.equipment||[]),...(r.safety||[]),...(r.storage||[])])+'</details></article>').join('')+
 '<h2>Method for your chosen version</h2><ol>'+pilot.primaryRecipe.method.map(s=>'<li>'+esc(s)+'</li>').join('')+'</ol><p>'+esc(pilot.primaryRecipe.methodology)+'</p></section>';
}
