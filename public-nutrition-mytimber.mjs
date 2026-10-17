// Navigation copy only; reviewed nutrition advice and recipe content stay intact.
export const NUTRITION_PATHS=new Set(['/articles/air-fryer-meals-men','/articles/calories-explained-men','/articles/eating-out-weight-management-men','/articles/healthy-bbq-men','/articles/healthy-takeaways-men','/articles/meal-prep-busy-men','/articles/protein-for-men-weight-management','/faq/bbq-and-weight-loss','/faq/how-much-protein-men','/faq/need-breakfast-weight-loss','/faq/takeaways-and-weight-loss','/guides/nutrition-guide','/guides/nutrition-protein-calories-meal-planning','/guides/sleep-stress-mindset-emotional-eating-maintenance','/tools/calories','/tools/protein','/articles/food-noise-after-stopping-glp1']);
export const NUTRITION_NOTE='<p data-nutrition-mytimber="v1">Food plans, recipes and shopping lists are available in <a href="/member/grub">Shift Grub, inside My Timber</a>. Sign in to save your choices.</p>';
export const FOOD_NOISE_PATH='/articles/food-noise-after-stopping-glp1';
export const FOOD_NOISE_OPENING='<p data-food-noise-answer="2026-10-12">Start with the part of the day that has become harder: a missed meal, a difficult evening, or food thoughts that feel upsetting or out of control. The examples below help you organise one practical next step and decide when to ask for professional support. They do not diagnose the cause or tell you how to change treatment.</p>';
export const FOOD_NOISE_PRACTICAL='<section><h2>Keep the practical bits manageable</h2><p>Choose the part of the day that causes the most friction and make one plan for it: decide what is for dinner before the working day runs away with you, keep a shopping list, or ask someone you trust to help you prepare for an appointment. These are planning suggestions, not a proven treatment for food noise.</p>';
function foodNoiseSignposting(html){
 if(html.includes('data-food-noise-answer="2026-10-12"'))return html;
 if((html.match(/<\/h1\s*>/gi)||[]).length!==1||html.split(FOOD_NOISE_PRACTICAL).length!==2)throw Error('food_noise_signposting_source_drift');
 html=html.replace(NUTRITION_NOTE,'');
 return html.replace(/<\/h1\s*>/i,'$&'+FOOD_NOISE_OPENING).replace(FOOD_NOISE_PRACTICAL,FOOD_NOISE_PRACTICAL+NUTRITION_NOTE);
}
export const NUTRITION_COPY={
 '/':[['Simple nutrition. Proper fuel.','Food plans and recipes in Shift Grub, inside My Timber.']],
 '/programme':[['Food support built around ordinary life—not punishment or perfect meal plans.','Food support built around ordinary life. Find food plans and recipes in Shift Grub, inside My Timber.']]
};
export function nutritionSignposting(html,path){
 if(path===FOOD_NOISE_PATH)return foodNoiseSignposting(html);
 if(NUTRITION_PATHS.has(path)&&!html.includes('data-nutrition-mytimber="v1"'))html=html.replace(/<\/h1\s*>/i,'$&'+NUTRITION_NOTE);
 for(const [before,after] of NUTRITION_COPY[path]||[])html=html.replace(before,after);
 return html;
}
export function preserveNutritionSignposting(path,body){
 let text=body.toString();
 if(path===FOOD_NOISE_PATH)text=text.replace(FOOD_NOISE_OPENING,'');
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
