// Navigation copy only; reviewed nutrition advice and recipe content stay intact.
export const NUTRITION_PATHS=new Set(['/articles/air-fryer-meals-men','/articles/calories-explained-men','/articles/eating-out-weight-management-men','/articles/healthy-bbq-men','/articles/healthy-takeaways-men','/articles/meal-prep-busy-men','/articles/protein-for-men-weight-management','/faq/bbq-and-weight-loss','/faq/how-much-protein-men','/faq/need-breakfast-weight-loss','/faq/takeaways-and-weight-loss','/guides/nutrition-guide','/guides/nutrition-protein-calories-meal-planning','/guides/sleep-stress-mindset-emotional-eating-maintenance','/tools/calories','/tools/protein','/articles/food-noise-after-stopping-glp1']);
export const NUTRITION_NOTE='<p data-nutrition-mytimber="v1">Food plans, recipes and shopping lists are available in <a href="/member/grub">Shift Grub, inside My Timber</a>. Sign in to save your choices.</p>';
export const NUTRITION_COPY={
 '/':[['Simple nutrition. Proper fuel.','Food plans and recipes in Shift Grub, inside My Timber.']],
 '/programme':[['Food support built around ordinary life—not punishment or perfect meal plans.','Food support built around ordinary life. Find food plans and recipes in Shift Grub, inside My Timber.']]
};
export function nutritionSignposting(html,path){
 if(NUTRITION_PATHS.has(path)&&!html.includes('data-nutrition-mytimber="v1"'))html=html.replace(/<\/h1\s*>/i,'$&'+NUTRITION_NOTE);
 for(const [before,after] of NUTRITION_COPY[path]||[])html=html.replace(before,after);
 return html;
}
export function preserveNutritionSignposting(path,body){
 let text=body.toString();
 if(NUTRITION_PATHS.has(path))text=text.replace(NUTRITION_NOTE,'');
 for(const [before,after] of NUTRITION_COPY[path]||[])text=text.replace(after,before);
 return Buffer.from(text);
}
export async function withNutritionSignposting(request,response){
 const path=new URL(request.url).pathname.replace(/\/$/,'')||'/';
 if(request.method!=='GET'||response.status!==200||!response.headers.get('content-type')?.includes('text/html')||!NUTRITION_PATHS.has(path)&&!NUTRITION_COPY[path])return response;
 const changed=nutritionSignposting(await response.text(),path),headers=new Headers(response.headers);
 headers.delete('content-length');headers.delete('etag');
 return new Response(changed,{status:response.status,headers});
}
