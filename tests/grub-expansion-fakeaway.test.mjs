import test from 'node:test';
import assert from 'node:assert/strict';
import {buildIndustrialCatalogue} from '../industrial-catalogue-v14.js';
import {repairFakeawayMethod} from '../grub-expansion-methods-fakeaway-v1.mjs';

const all = buildIndustrialCatalogue().recipes;
const recipes = all.filter((row) => /^industrial-v3-(burger|kebab|loaded-fries|pizza)-/.test(row.id));
const before = JSON.stringify(recipes);
const repaired = recipes.map((row) => ({...row, ...repairFakeawayMethod(row)}));
const get = (id) => repaired.find((row) => row.id === id);

test('all408 fakeaway methods use every exact listed ingredient without mutating source or nutrition', () => {
  assert.equal(recipes.length, 408);
  assert.equal(JSON.stringify(recipes), before);
  for (let index = 0; index < recipes.length; index++) {
    const original = recipes[index], result = repaired[index];
    assert.notDeepEqual(result.method, original.method);
    assert.deepEqual(result.ingredients, original.ingredients);
    assert.deepEqual(result.nutrition, original.nutrition);
    assert.equal(result.title, original.title);
    assert.ok(result.method.length >= 5);
    const text = result.method.join(' ').toLowerCase();
    for (const ingredient of result.ingredients) assert.ok(text.includes(ingredient.item.toLowerCase()), `${result.id}: unaddressed ingredient ${ingredient.item}`);
    assert.doesNotMatch(text, /required equipment|where required|chosen protein|normal cooking method|stated format/);
    assert.doesNotMatch(text, /cheese|breadcrumbs|\begg\b|butter|flour/);
  }
});

test('sixprotein identities select real preparation and doneness checks in allfour formats', () => {
  const formats = ['burger', 'kebab', 'loaded-fries', 'pizza'];
  for (const format of formats) {
    const group = repaired.filter((row) => row.id.startsWith(`industrial-v3-${format}-`));
    assert.equal(group.length, 102);
    for (const recipe of group) {
      const text = recipe.method.join(' ');
      const protein = recipe.ingredients[0].item;
      if (['chicken breast', 'lean pork loin'].includes(protein)) {
        assert.match(text, /cutlets|strips/);
        assert.match(text, /75°C.*30 seconds/);
        assert.doesNotMatch(text, /into a patty|into three short koftas/);
      } else if (/mince/.test(protein)) {
        assert.match(text, /75°C.*30 seconds/);
        assert.match(text, /no pink/);
        assert.match(text, format === 'burger' ? /into a patty/ : format === 'kebab' ? /into three short koftas/ : /breaking up clumps/);
      } else if (protein === 'salmon fillet') {
        assert.match(text, /pin bones/);
        assert.match(text, /opaque.*centre.*flakes/);
        assert.doesNotMatch(text, /into a patty|into three short koftas|no pink meat/);
      } else {
        assert.match(text, /Drain the firm tofu/);
        assert.match(text, /golden/);
        assert.doesNotMatch(text, /salmon|beef|chicken|turkey|pork|no pink meat/);
      }
    }
  }
});

test('salad and chilled sauces stay out of hot cooking; heated sauces have a concrete cooking step', () => {
  for (const recipe of repaired) {
    const names = recipe.ingredients.map((row) => row.item);
    const text = recipe.method.join(' ');
    if (names.includes('lettuce')) assert.match(recipe.method[0], /clean plate, separate/);
    if (names.some((name) => /mayonnaise|yoghurt/.test(name))) {
      assert.match(text, /refrigerated until assembly/);
      if (/loaded-fries|pizza/.test(recipe.id)) assert.match(text, /after cooking|after the pizza comes out/);
    }
    if (names.some((name) => /tikka sauce|katsu-style sauce|BBQ sauce|peri-peri sauce/.test(name))) {
      assert.match(text, /small saucepan.*2–3 minutes.*bubbling/);
      assert.ok(recipe.equipment.includes('saucepan'));
    }
  }
});

test('loadedfries and pizza split only the listed oil and include actual oven/pan equipment', () => {
  for (const recipe of repaired.filter((row) => /industrial-v3-(loaded-fries|pizza)-/.test(row.id))) {
    const text = recipe.method.join(' ');
    assert.match(text, /half of the measured olive oil/);
    assert.match(text, /remaining half of the measured olive oil/);
    for (const item of ['oven', 'tray', 'hob', 'frying-pan']) assert.ok(recipe.equipment.includes(item));
    assert.match(text, /packet/);
  }
  assert.match(get('industrial-v3-pizza-classic-chicken').method.join(' '), /passata.*3–4 minutes.*thickened/);
  assert.match(get('industrial-v3-loaded-fries-classic-chicken').method.join(' '), /chips.*20–30 minutes.*golden/);
});

test('unrelated, unsupported or incomplete ingredient identities do not receive a guessed method', () => {
  assert.equal(repairFakeawayMethod(all.find((row) => row.id.startsWith('industrial-v3-curry-'))), null);
  const changed = structuredClone(recipes[0]);
  changed.ingredients.push({amount: '15g', item: 'unreviewed topping'});
  assert.equal(repairFakeawayMethod(changed), null);
  changed.ingredients = changed.ingredients.filter((row) => row.item !== 'unreviewed topping' && row.item !== 'olive oil');
  assert.equal(repairFakeawayMethod(changed), null);
});
