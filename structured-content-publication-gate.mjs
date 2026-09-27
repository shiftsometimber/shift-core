import assert from 'node:assert/strict';
import {assertPublishableStructuredContent} from './structured-content-v1.js';

const baseRecipe={id:'r1',contentType:'recipe',title:'Recipe',status:'published',data:{meal_type:'dinner',nutrition:{status:'validated',kcal:400,protein_g:30,carbohydrate_g:40,fat_g:12,fibre_g:8,methodology:'CoFID 2021 ingredient-level weighted calculation'}},review:{status:'approved'}};
const baseExercise={id:'x1',contentType:'exercise',title:'Exercise',status:'published',data:{visual:{status:'approved',asset_ref:'/assets/fit/x1.svg',alt_text:'Exercise guidance'}},review:{status:'approved'}};
assert.equal(assertPublishableStructuredContent(baseRecipe),true);
assert.equal(assertPublishableStructuredContent(baseExercise),true);
for(const [label,item,error] of [
  ['recipe without review',{...baseRecipe,review:{status:'draft'}},'structured_content_review_approval_required'],
  ['recipe without meal type',{...baseRecipe,data:{...baseRecipe.data,meal_type:null}},'structured_recipe_meal_type_required'],
  ['recipe without nutrition',{...baseRecipe,data:{...baseRecipe.data,nutrition:{status:'pending_validation'}}},'structured_recipe_nutrition_validation_required'],
  ['exercise without review',{...baseExercise,review:{status:'draft'}},'structured_content_review_approval_required'],
  ['exercise without member visual',{...baseExercise,data:{visual:{status:'pending',asset_ref:null,alt_text:null}}},'structured_exercise_member_visual_approval_required']
]){
  assert.throws(()=>assertPublishableStructuredContent(item),new RegExp(error),label);
}
assert.equal(assertPublishableStructuredContent({...baseRecipe,status:'draft',review:{status:'draft'},data:{nutrition:{status:'pending_validation'}}}),true);
console.log('PASS M07 structured publication barrier: draft content may stage, but no recipe publishes before meal-type addressability + nutrition + review and no exercise publishes before visual + review');
