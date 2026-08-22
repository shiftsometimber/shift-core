import test from 'node:test';
import assert from 'node:assert/strict';
import {auditUkRecipe,ukWords} from '../grub-uk-localisation-v1.js';

test('UK localisation catches US recipes before member publication',()=>{
  const result=auditUkRecipe({ingredients:[{text:'1 cup chopped zucchini'},{text:'8 oz ground beef'}],method:['Bake at 350 degrees F.'],source:{market:'US'}});
  assert.equal(result.eligible,false);
  assert.deepEqual(result.blockers,['non_metric_measurements','fahrenheit_temperature','non_uk_ingredient_language','non_uk_source_requires_reauthoring']);
  assert.equal(ukWords('zucchini with ground beef and cilantro'),'courgette with beef mince and coriander');
});

test('metric UK recipe passes the market gate',()=>{
  const result=auditUkRecipe({ingredients:[{amount:'200g',item:'courgette'},{amount:'150g',item:'beef mince'}],method:['Bake at 180°C until thoroughly cooked.'],source:{market:'UK'}});
  assert.equal(result.eligible,true);
  assert.deepEqual(result.blockers,[]);
});
