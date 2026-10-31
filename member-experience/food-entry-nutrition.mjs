export const foodNutritionLimits={proteinG:500,waterMl:10000,kcal:6000,carbsG:1000,fatG:500,fibreG:200};
export const foodNutritionSources=['member_entered','member_confirmed_estimate','packet_database'];
export function foodNutrition(input){
 const out={};for(const[key,max]of Object.entries(foodNutritionLimits))if(key in input){if(typeof input[key]!=='number'||!Number.isFinite(input[key])||input[key]<0||input[key]>max)throw Error('Check the optional amounts.');out[key]=Math.round(input[key]*10)/10;}
 if('nutritionSource'in input){if(!foodNutritionSources.includes(input.nutritionSource))throw Error('Check the nutrition source.');out.nutritionSource=input.nutritionSource;}
 return out;
}
