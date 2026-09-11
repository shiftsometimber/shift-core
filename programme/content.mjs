// Fictional test content only. No item has production content approval.
export const CONTENT_VERSION = 'programme-fixtures-1';
const meal=(id,name,minutes,allergens,vegetarian,ingredients,steps,noCook=false)=>({id,version:1,name,minutes,serves:4,allergens,vegetarian,noCook,equipment:noCook?[]:['hob'],reviewStatus:'test-fixture',reviewDate:null,reviewerId:null,reviewedVersion:null,ingredients:ingredients.map(([id,name,quantity,unit])=>({id,name,quantity,unit})),steps,substitutions:'No substitutions are pre-approved. Check every product label.'});
export const RECIPES = {
 chilli:meal('chilli','Beef and bean chilli',40,[],false,[['mince','Beef mince',500,'g'],['beans','Drained kidney beans',240,'g'],['tomatoes','Chopped tomatoes',400,'g'],['onion','Onion',1,'whole'],['rice','Dry rice',300,'g'],['cumin','Ground cumin',2,'tsp'],['oil','Olive oil',1,'tbsp']],['Chop the onion. Soften it in the oil, then add the mince and cook thoroughly.','Add cumin, beans and tomatoes; simmer until fully cooked.','Cook the rice according to its packet. Serve the chosen portions.']),
 ragu:meal('ragu','Beef ragù',45,['wheat','celery'],false,[['mince','Beef mince',500,'g'],['passata','Passata',500,'g'],['carrot','Carrot',2,'whole'],['celery','Celery',2,'stalk'],['onion','Onion',1,'whole'],['pasta','Dry wheat pasta',400,'g'],['oil','Olive oil',1,'tbsp']],['Chop the vegetables and soften in the oil. Add the mince and cook thoroughly.','Add passata and simmer until the vegetables and meat are fully cooked.','Cook pasta according to the packet and combine.']),
 chickpea:meal('chickpea','Chickpea and tomato rice',25,[],true,[['chickpeas','Drained chickpeas',480,'g'],['tomatoes','Chopped tomatoes',400,'g'],['onion','Onion',1,'whole'],['rice','Dry rice',300,'g'],['cumin','Ground cumin',2,'tsp'],['oil','Olive oil',1,'tbsp']],['Chop the onion and soften it in oil.','Add cumin, chickpeas and tomatoes. Simmer until hot throughout.','Cook rice according to the packet; serve together.']),
 tuna:meal('tuna','Tuna and sweetcorn pasta',15,['fish','wheat'],false,[['tuna','Drained tuna',220,'g'],['sweetcorn','Drained sweetcorn',160,'g'],['tomatoes','Chopped tomatoes',400,'g'],['pasta','Dry wheat pasta',400,'g'],['oil','Olive oil',1,'tbsp']],['Cook the pasta according to its packet.','Heat tomatoes, tuna, sweetcorn and oil in a separate pan until hot throughout.','Drain the pasta and combine.']),
 wraps:meal('wraps','Chicken and salad wraps',10,['wheat','egg'],false,[['wraps','Wheat tortilla wraps',8,'whole'],['chicken','Ready-to-eat cooked chicken',300,'g'],['salad','Ready-to-eat washed salad',120,'g'],['mayo','Mayonnaise',3,'tbsp'],['cucumber','Cucumber',1,'whole']],['Use ready-to-eat cooked chicken and washed salad; check their storage and use-by instructions.','Slice cucumber. Divide all ingredients between the wraps and fold.'],true),
 beanSalad:meal('beanSalad','Bean and cucumber bowl',10,[],true,[['beans','Drained kidney beans',480,'g'],['sweetcorn','Drained sweetcorn',320,'g'],['cucumber','Cucumber',1,'whole'],['oil','Olive oil',2,'tbsp']],['Use ready-to-eat tinned beans and sweetcorn; drain them.','Wash and chop the cucumber. Combine with beans, sweetcorn and oil.'],true)
};
export function suitable(recipe,preferences,{fixtureMode=false}={}) {
 if(!recipe || !['test-fixture','approved'].includes(recipe.reviewStatus)) return false;
 if(recipe.reviewStatus!=='approved' && !fixtureMode) return false;
 if(recipe.reviewStatus==='approved'){
  const date=recipe.reviewDate,validDate=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date+'T12:00:00Z'))&&new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
  if(!validDate||typeof recipe.reviewerId!=='string'||!recipe.reviewerId.trim()||recipe.reviewedVersion!==recipe.version)return false;
 }
 if(!preferences || preferences.allergies==='unknown' || preferences.diet==='unknown') return false;
 if(preferences.allergies!=='none' && !Array.isArray(preferences.allergies)) return false;
 if(Array.isArray(preferences.allergies) && preferences.allergies.some(a=>recipe.allergens.includes(a))) return false;
 if(preferences.diet==='vegetarian' && !recipe.vegetarian) return false;
 if(!['any','vegetarian'].includes(preferences.diet)) return false;
 if(preferences.equipment && recipe.equipment.some(e=>!preferences.equipment.includes(e))) return false;
 return recipe.ingredients.length>0 && recipe.ingredients.every(i=>Number.isFinite(i.quantity)&&i.quantity>0&&i.unit);
}
