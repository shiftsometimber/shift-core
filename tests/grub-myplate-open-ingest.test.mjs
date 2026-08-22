import test from 'node:test';
import assert from 'node:assert/strict';
import {normaliseMyPlateRecipe} from '../grub-myplate-open-ingest.mjs';

test('MyPlate recipes retain public-domain provenance and fail closed before review',()=>{
  const recipe=normaliseMyPlateRecipe({slug:'quick-chicken-pizza',name:'Quick Chicken Pizza',yield:'4 servings',serving_size:'1 slice',ingredients:[{text:'1 wholemeal base'},{text:'200 g chicken'},{text:'100 g tomatoes'}],directions:'Heat the oven. Cook the chicken thoroughly. Add the toppings. Bake until piping hot.',nutrition:[{key:'total_calories',amount:410},{key:'protein',amount:31},{key:'dietary_fiber',amount:7},{key:'carbohydrates',amount:44},{key:'total_fat',amount:11},{key:'sodium',amount:620}],source_url:'https://www.myplate.gov/recipes/quick-chicken-pizza',canonical_url:'https://myplate.food/recipes/quick-chicken-pizza',contributor:'USDA'}, {category:'Main dish',food_groups:['protein-foods','grains']});
  assert.equal(recipe.id,'usda-myplate-quick-chicken-pizza');
  assert.equal(recipe.source.public_domain,true);
  assert.equal(recipe.nutrition.status,'source_validated');
  assert.equal(recipe.nutrition.kcal,410);
  assert.ok(recipe.tags.includes('fakeaway'));
  assert.equal(recipe.publication_ready,false);
  assert.ok(recipe.review.blockers.includes('independent_human_review'));
});
