import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';

export const hash = value => createHash('sha256').update(value).digest('hex');
export const ENTRY = 'public-image-repair/entry.mjs';

// Add a delivery wrapper to the captured serving package. Never recompile or
// replace the existing Core, member, presentation or article modules.
export function repairPackage(before) {
  assert(before.main_module && before.modules.some(m => m.name === before.main_module));
  assert(!before.modules.some(m => m.name.startsWith('public-image-repair/')), 'Repair is already present; inspect rather than replay');
  assert.match(before.main_module, /^[a-zA-Z0-9_./-]+\.m?js$/);
  assert(!before.main_module.split('/').includes('..'));
  const entry = 'import original from ' + JSON.stringify('../' + before.main_module) + ';\n'
    + 'export * from ' + JSON.stringify('../' + before.main_module) + ';\n'
    + 'import {withApprovedToolsImage} from "./delivery.mjs";\n'
    + 'export default withApprovedToolsImage(original);\n';
  const additions = [
    {name: ENTRY, content_base64:Buffer.from(entry).toString('base64')},
    ...['delivery.mjs','tools-image.mjs'].map(name => ({name:'public-image-repair/' + name, content_base64:readFileSync(new URL('./' + name,import.meta.url)).toString('base64')}))
  ];
  return {main_module:ENTRY, modules:[...before.modules,...additions]};
}

export function verifyPackage(before, staged, planned) {
  assert.equal(staged.main_module, ENTRY);
  assert.deepEqual(staged.bindings,before.bindings,'Bindings must be inherited exactly');
  assert.equal(staged.compatibility_date,before.compatibility_date);
  assert.deepEqual(staged.modules.map(m => m.name).sort(), planned.modules.map(m => m.name).sort());
  for (const module of planned.modules) {
    const actual = staged.modules.find(m => m.name === module.name);
    assert.equal(hash(Buffer.from(actual.content_base64,'base64')),hash(Buffer.from(module.content_base64,'base64')),module.name);
  }
  return true;
}
