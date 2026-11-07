import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const discoveryName = 'withDynamicBabyLoveDiscovery';
const linkedNames = [discoveryName, 'HOSTS', 'editorialDiscovery', 'articleModifiedDate', 'esc'];
const linkedNamePattern = new RegExp('\\b(' + linkedNames.join('|') + ')([0-9]*)\\b', 'g');
const reviewName = 'article-publication-review-20261104.mjs';
const reviewHash = 'ddf6c46932785f1e7887aedd6f09bca37626173d5dd7da57ee80e7baf71597c0';
const targetName = 'worker.js';
export const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function utf8(input) {
  const bytes = Buffer.from(input);
  const source = bytes.toString('utf8');
  assert(Buffer.from(source).equals(bytes), 'Compiled Worker bytes must be valid UTF-8');
  return source;
}

function discoveryRegion(source) {
  const matches = [...source.matchAll(/^async function withDynamicBabyLoveDiscovery[0-9]*\([^\n]*\) \{\n[\s\S]*?^\}\n/gm)];
  assert.equal(matches.length, 1, 'Expected exactly one compiled discovery function');
  const [{0: body, index}] = matches;
  return {body, before: source.slice(0, index), after: source.slice(index + body.length)};
}

function linkedIdentifiers(body) {
  const names = new Map();
  for (const [full, base] of body.matchAll(linkedNamePattern)) {
    assert(!names.has(base) || names.get(base) === full, 'Ambiguous compiled identifier: ' + base);
    names.set(base, full);
  }
  assert.equal(names.size, linkedNames.length, 'Compiled discovery dependencies changed');
  return names;
}

function project(body, names) {
  return body.replace(linkedNamePattern, (_full, base) => names.get(base));
}

function safeguardRegion(source) {
  const start = '// babylove/webhook.mjs\n';
  const end = '// health-passport/routes.mjs';
  const startAt = source.indexOf(start);
  const endAt = source.indexOf(end, startAt);
  assert(startAt !== -1 && endAt > startAt && source.lastIndexOf(start) === startAt, 'Cannot uniquely identify the serving import safeguard handler');
  const region = source.slice(startAt, endAt);
  const expected = [
    'const reviewIssues = articlePublicationReview(article.body);',
    'if (reviewIssues.length) article = { ...article, publish: false };',
    '...reviewIssues.length ? { reviewRequired: true, reviewIssues } : {}'
  ];
  assert(source.includes('import {articlePublicationReview} from "./' + reviewName + '";'), 'Approved review module import is missing from serving Worker');
  for (const marker of expected) {
    assert(region.includes(marker), 'Approved import safeguard handler has changed');
  }
  return region;
}

export function patchServingModule(input, builtBefore, builtAfter) {
  const original = utf8(input);
  const {before, after} = verifiedDiscoveryRegions(builtBefore, builtAfter);

  const active = discoveryRegion(original);
  const activeIdentifiers = linkedIdentifiers(active.body);
  assert(project(before.body, activeIdentifiers) === active.body, 'Serving discovery does not match the approved compiled baseline');
  const replacement = project(after.body, activeIdentifiers);
  const code = active.before + replacement + active.after;
  const patched = discoveryRegion(code);
  assert(patched.body === replacement, 'Patched discovery function is ambiguous');
  assert(patched.before + active.body + patched.after === original, 'Cannot prove the exact inverse of the serving patch');
  const guard = safeguardRegion(original);
  assert(safeguardRegion(code) === guard, 'The serving import safeguard handler changed');
  return {
    code,
    proof: {
      beforeSHA256: hash(original),
      afterSHA256: hash(code),
      discoveryBeforeSHA256: hash(active.body),
      discoveryAfterSHA256: hash(replacement),
      importSafeguardHandlerSHA256: hash(guard),
      exactInverse: true
    }
  };
}

function verifiedDiscoveryRegions(builtBefore, builtAfter) {
  const before = discoveryRegion(utf8(builtBefore));
  const after = discoveryRegion(utf8(builtAfter));
  assert(before.before === after.before && before.after === after.after, 'Candidate changes compiled bytes outside the discovery function');
  assert(before.body !== after.body, 'Approved discovery change is absent from candidate build');
  assert.deepEqual(linkedIdentifiers(after.body), linkedIdentifiers(before.body), 'Candidate changes the compiled discovery dependencies');
  return {before, after};
}

export function verifyCompiledBuilds(builtBefore, builtAfter) {
  const {before, after} = verifiedDiscoveryRegions(builtBefore, builtAfter);
  return {
    discoveryBeforeSHA256: hash(before.body),
    discoveryAfterSHA256: hash(after.body),
    onlyDiscoveryChanged: true
  };
}

export function prepareKnowledgePackage(original, builtBefore, builtAfter) {
  assert(original.main_module && original.modules?.length, 'Incomplete serving package');
  const matches = name => original.modules.filter(module => module.name === name);
  const target = matches(targetName);
  const guard = matches(reviewName);
  assert.equal(target.length, 1, 'Serving package must contain the unique compiled Worker');
  assert.equal(guard.length, 1, 'Serving package must contain the approved review module');
  assert.equal(hash(Buffer.from(guard[0].content_base64, 'base64')), reviewHash, 'Serving review module does not match the 4 November safeguard');
  const patch = patchServingModule(Buffer.from(target[0].content_base64, 'base64'), builtBefore, builtAfter);
  const modules = original.modules.map(module => module === target[0]
    ? {...module, content_base64: Buffer.from(patch.code).toString('base64')}
    : module);
  return {
    main_module: original.main_module,
    modules,
    proof: {...patch.proof, importSafeguardModuleSHA256: reviewHash}
  };
}

export function verifyKnowledgePackage(original, actual, planned) {
  assert.equal(planned.main_module, original.main_module, 'Planned main module changed');
  for (const field of ['main_module', 'bindings', 'compatibility_date', 'compatibility_flags', 'assets', 'usage_model', 'limits', 'placement']) {
    assert.deepEqual(actual[field], original[field], 'Serving version configuration changed: ' + field);
  }
  if (actual.migration_tag !== undefined) assert.equal(actual.migration_tag, original.migration_tag);
  const names = modules => modules.map(module => module.name).sort();
  assert.deepEqual(names(planned.modules), names(original.modules), 'Planned modules were added or removed');
  assert.deepEqual(names(actual.modules), names(original.modules), 'Provider modules were added or removed');
  for (const expected of planned.modules) {
    const saved = actual.modules.find(module => module.name === expected.name);
    const previous = original.modules.find(module => module.name === expected.name);
    if (expected.name !== targetName) {
      assert(expected.content_base64 === previous.content_base64, 'Planned unrelated module changed: ' + expected.name);
    }
    assert.equal(expected.content_type, previous.content_type, 'Planned module media type changed: ' + expected.name);
    assert.equal(saved.content_type, expected.content_type, 'Provider module media type changed: ' + expected.name);
    assert(saved.content_base64 === expected.content_base64, 'Provider source mismatch: ' + expected.name);
  }
  return {
    ...planned.proof,
    changedModules: [targetName],
    existingModulesPreserved: original.modules.length - 1,
    configurationPreserved: true
  };
}
