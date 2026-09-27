import test from 'node:test';
import assert from 'node:assert/strict';
import {buildIndustrialCatalogue} from '../industrial-catalogue-v14.js';
import {editorialSemanticIssues} from '../industrial-grub-semantic-quality-v1.mjs';
import {repairPanMethod} from '../grub-expansion-methods-pan-v1.mjs';

// The method author receives original identities; integration applies the
// reviewed turkey/noodle identity corrections after authoring. Build that input
// directly so these tests also run before any generated review pack exists.
const source = buildIndustrialCatalogue().recipes.filter(row =>
  /^industrial-v3-(curry|chilli|stir-fry)-|^industrial-dinner-.+-(curry|chilli|stir-fry)$/.test(row.id)
  && editorialSemanticIssues(row).length === 0);
test('all 264 pan candidates get cookable bounded methods without changing source ingredients or nutrition', () => {
  assert.equal(source.length, 264);
  const before = JSON.stringify(source);
  for (const row of source) {
    const result = repairPanMethod(row), text = result.method.join(' ');
    assert.ok(result.method.length >= 5 && result.method.length <= 11, row.id);
    assert.ok(result.equipment.includes('non-stick frying pan with lid'));
    assert.doesNotMatch(text, /where required|stated format|chosen protein|required equipment|finish the base of the meal/i, row.id);
    assert.match(text, /minutes/, row.id);
    for (const ingredient of row.ingredients) assert.ok(text.includes(ingredient.item.replace(', dry', '')) || (ingredient.item === 'raw king prawns' && text.includes('raw king prawns')), `${row.id}: missing ${ingredient.item}`);
    if (!row.ingredients.some(x => x.item === 'olive oil')) assert.doesNotMatch(text, /Add .*olive oil|Heat .*olive oil/, row.id);
    if (!row.ingredients.some(x => /soy sauce/.test(x.item))) assert.doesNotMatch(text, /soy sauce/, row.id);
    assert.equal(Object.hasOwn(result, 'nutrition'), false);
    assert.equal(Object.hasOwn(result, 'ingredients'), false);
  }
  assert.equal(JSON.stringify(source), before);
});
test('nine protein identities get their own handling and endpoints', () => {
  const endpoints = {'chicken breast': /70°C for 2 minutes/, 'turkey breast': /70°C for 2 minutes/, 'turkey mince': /break it into small pieces/, '5% beef mince': /break it into small pieces/, 'lean pork loin': /70°C for 2 minutes/, 'salmon fillet': /opaque, steaming hot and flakes easily/, 'raw king prawns': /no translucent flesh/, 'firm tofu': /turning carefully until lightly golden/, 'cooked green lentils': /Do not start this method with dry lentils/};
  for (const [protein, endpoint] of Object.entries(endpoints)) {
    const variants = source.filter(row => row.ingredients.some(x => x.item === protein));
    assert.ok(variants.length, protein);
    for (const row of variants) assert.match(repairPanMethod(row).method.join(' '), endpoint, row.id);
  }
});
test('mayonnaise is cold finishing and misleading curry/chilli titles are corrected explicitly', () => {
  const rows = source.filter(row => row.ingredients.some(x => x.item === 'light mayonnaise'));
  assert.equal(rows.length, 30);
  let renamed = 0;
  for (const row of rows) {
    const result = repairPanMethod(row), text = result.method.join(' ');
    assert.match(text, /must not be simmered/);
    assert.match(text, /cold dressing over each serving/);
    if (!row.id.startsWith('industrial-v3-stir-fry-')) {
      assert.ok(result.title.endsWith('Rice Bowl'));
      assert.doesNotMatch(result.title, /Curry|Chilli/);
      assert.ok(result.authoring_notes.length); renamed++;
    }
  }
  assert.equal(renamed, 18);
});
test('beans use canned/drained weights and seafood is kept out of long vegetable cooking', () => {
  for (const row of source.filter(row => row.ingredients.some(x => x.item === 'kidney beans'))) assert.match(repairPanMethod(row).method.join(' '), /raw or dried kidney beans cannot be used/);
  for (const row of source.filter(row => row.ingredients.some(x => x.item === 'raw king prawns'))) assert.match(repairPanMethod(row).method.join(' '), /do not simmer them through the longer vegetable cooking stage/);
  assert.equal(repairPanMethod({id:'industrial-v3-roast-chilli-chicken'}),null);
  assert.equal(repairPanMethod({id:'industrial-breakfast-banana-oats'}),null);
});
