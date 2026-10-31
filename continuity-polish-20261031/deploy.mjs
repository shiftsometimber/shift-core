import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {transform, version, heroHTML} from './runtime.mjs';

const ACCOUNT = '9e5386dcf455be34c582d93f8bfc79e6';
const ZONE = '66ec3268950adcfc837b7b8b2f8356ed';
const ORIGIN = 'https://shiftsometimber.co.uk';
const PREFIX = 'continuity-polish-20261031/';
const OUT = 'continuity-polish-evidence';
const TARGET = '/clinic-gone-quiet';
const ALIASES = [TARGET, TARGET + '/', TARGET + '.html'];
const CODE_URLS = ['/assets/my-timber-welcome-20261021.js?v=3', '/assets/my-timber-onboarding-20261021.js', '/my-timber-v11.js?v=1'];
const ROUTE_INPUTS = ALIASES.flatMap(pathname => [pathname, pathname + '?continuity-scope=1']);
const PROTECTED = ['/', '/programme', '/provider-switch', '/articles/stopping-glp1', '/member/dashboard', '/knowledge', '/shift-health', '/contact', '/life-back', '/shift-newsroom'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const normalise = html => html
  .replace(/<script\b[^>]*\bsrc=["']https:\/\/static\.cloudflareinsights\.com[^"']*["'][\s\S]*?<\/script>/gi, '')
  .replace(/<script\b[^>]*>[\s\S]*?window\.__CF\$cv\$params[\s\S]*?<\/script>/gi, '');
const mainHTML = html => normalise(html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] || '');
const sorted = values => [...(values || [])].sort((a, b) => a.name.localeCompare(b.name));
const moduleHashes = modules => sorted(modules.map(module => ({name: module.name, sha256: digest(Buffer.from(module.content_base64, 'base64'))})));
const assetConfig = value => value.assets ?? value.resources?.script_runtime?.assets;
const save = (name, value) => fs.writeFileSync(path.join(OUT, name + '.json'), JSON.stringify(value, null, 2));

// A deployment ID proves ownership when a response was received. If the POST
// response was lost, require BOTH the unique intent message and exact split.
export function ownedRecovery(state, current) {
  const message = current.annotations?.['workers/message'];
  const exactLive = current.versions?.length === 1 && current.versions[0].version_id === state.versionId && current.versions[0].percentage === 100;
  const exactZero = current.versions?.length === 2 && current.versions.some(item => item.version_id === state.previousVersion && item.percentage === 100) && current.versions.some(item => item.version_id === state.versionId && item.percentage === 0);
  if (exactLive && ((state.ownedDeployment && current.id === state.ownedDeployment) || (state.promotionAttempted && message === state.promotionMessage))) return {mode: 'live', deploymentId: current.id, reconciled: !state.ownedDeployment};
  if (exactZero && ((state.zeroDeployment && current.id === state.zeroDeployment) || (state.zeroAttempted && message === state.zeroMessage))) return {mode: 'zero', deploymentId: current.id, reconciled: !state.zeroDeployment};
  return null;
}

// Cloudflare route specificity ignores the optional scheme's character count.
export function routeOwner(routes, input) {
  const url = new URL(input), target = url.host + url.pathname + url.search;
  const ranked = routes.flatMap(route => {
    const scheme = route.pattern.match(/^(https?):\/\//)?.[1];
    if (scheme && url.protocol !== scheme + ':') return [];
    const pattern = route.pattern.replace(/^https?:\/\//, '');
    const expression = pattern.split('*').map(part => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*');
    if (!new RegExp('^' + expression + '$').test(target)) return [];
    return [{route, literal: pattern.replaceAll('*', '').length, wildcards: pattern.split('*').length - 1, scheme: Number(Boolean(scheme))}];
  });
  const compare = (a, b) => b.literal - a.literal || a.wildcards - b.wildcards || b.scheme - a.scheme;
  ranked.sort(compare);
  if (ranked.length > 1 && compare(ranked[0], ranked[1]) === 0 && ranked[0].route.script !== ranked[1].route.script) throw Error('Ambiguous route owner for ' + input);
  return ranked[0]?.route;
}

function originalEntry(current, settings) {
  const explicit = current.main_module || current.metadata?.main_module || current.resources?.script?.main_module || settings.main_module;
  const javascript = current.modules.filter(module => /\.(?:mjs|js)$/.test(module.name));
  const referenced = new Set();
  for (const module of javascript) {
    for (const match of Buffer.from(module.content_base64, 'base64').toString().matchAll(/\b(?:from\s*|import\s*)["']([^"']+)["']/g)) {
      if (match[1].startsWith('.')) referenced.add(path.posix.normalize(path.posix.join(path.posix.dirname(module.name), match[1])));
    }
  }
  const roots = javascript.filter(module => !referenced.has(module.name));
  if (!explicit) assert.equal(roots.length, 1, 'Cannot determine the current worker entry');
  const name = explicit || roots[0].name;
  assert(current.modules.some(module => module.name === name), 'Current entry module is missing');
  assert(!name.startsWith('/') && !name.split('/').includes('..'), 'Unsupported current entry name');
  return name;
}

export async function main() {
  assert(process.env.CLOUDFLARE_API_TOKEN, 'Cloudflare deployment credential is required');
  assert.equal(process.env.GITHUB_REF, 'refs/heads/release/continuity-polish-20261031', 'This release must run on its own branch');
  assert.match(process.env.GITHUB_SHA || '', /^[a-f0-9]{40}$/, 'A full source commit is required');
  const releaseIdentity = process.env.GITHUB_SHA + ':' + (process.env.GITHUB_RUN_ID || 'manual') + ':' + (process.env.GITHUB_RUN_ATTEMPT || '1');
  const intentMessage = (state, operation) => 'SHIFT Continuity ' + releaseIdentity + ' ' + state.name + ' ' + operation;
  fs.mkdirSync(OUT, {recursive: true});
  async function cf(endpoint, method = 'GET', body) {
    const multipart = body instanceof FormData;
    const response = await fetch('https://api.cloudflare.com/client/v4' + endpoint, {
      method,
      headers: {Authorization: 'Bearer ' + process.env.CLOUDFLARE_API_TOKEN, ...(body && !multipart ? {'Content-Type': 'application/json'} : {})},
      body: multipart ? body : body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(60000)
    });
    const result = await response.json();
    assert(response.ok && result.success, 'Cloudflare request failed: ' + method + ' ' + endpoint + ' ' + JSON.stringify(result.errors));
    return result.result;
  }
  const routes = () => cf('/zones/' + ZONE + '/workers/routes');
  async function active(name) {
    const response = await cf('/accounts/' + ACCOUNT + '/workers/scripts/' + name + '/deployments');
    const deployment = [...response.deployments].sort((a, b) => b.created_on.localeCompare(a.created_on))[0];
    assert(deployment, 'No current deployment for ' + name);
    assert.equal(deployment.versions.filter(value => value.percentage === 100).length, 1, 'Live traffic is split for ' + name);
    assert(deployment.versions.every(value => value.percentage === 0 || value.percentage === 100), 'Unsupported traffic split for ' + name);
    return deployment;
  }
  const serving = deployment => deployment.versions.find(value => value.percentage === 100).version_id;
  const promote = (name, id, message) => cf('/accounts/' + ACCOUNT + '/workers/scripts/' + name + '/deployments', 'POST', {
    strategy: 'percentage', versions: [{version_id: id, percentage: 100}], annotations: {'workers/message': message}
  });
  async function get(pathname, overrides, {manual = false} = {}) {
    const response = await fetch(ORIGIN + pathname, {
      redirect: manual ? 'manual' : 'follow',
      headers: {'Cache-Control': 'no-cache', ...(overrides ? {'Cloudflare-Workers-Version-Overrides': overrides} : {})},
      signal: AbortSignal.timeout(45000)
    });
    return {status: response.status, html: await response.text(), headers: response.headers, url: response.url};
  }
  async function imageCheck(url, overrides) {
    const response = await fetch(url, {headers: {'Cache-Control': 'no-cache', ...(overrides ? {'Cloudflare-Workers-Version-Overrides': overrides} : {})}, signal: AbortSignal.timeout(45000)});
    assert.equal(response.status, 200, 'Approved hero image unavailable');
    assert((response.headers.get('content-type') || '').startsWith('image/'), 'Hero resource is not an image');
    return {url, sha256: digest(Buffer.from(await response.arrayBuffer()))};
  }
  const states = [];
  let beforeRoutes;
  try {
    beforeRoutes = await routes();
    const scopes = new Map();
    const owners = [];
    for (const input of ROUTE_INPUTS) {
      const url = new URL(input, ORIGIN), route = routeOwner(beforeRoutes, url.href);
      assert(route?.script, 'No existing worker owns ' + input);
      if (!scopes.has(route.script)) scopes.set(route.script, new Set());
      scopes.get(route.script).add(url.pathname + (url.search ? '?' : ''));
      owners.push({path: input, route});
    }
    const baseline = await get(TARGET);
    assert.equal(baseline.status, 200);
    assert(heroHTML(baseline.html), 'The latest approved Continuity hero is not present');
    assert(!baseline.html.includes('data-continuity-polish="' + version + '"'), 'This release is already serving; reconcile instead of wrapping twice');
    const transformed = transform(baseline.html, TARGET);
    const candidate = typeof transformed === 'string' ? transformed : transformed.html;
    assert(candidate && candidate !== baseline.html, 'The approved transformation did not change the page');
    assert(candidate.includes('data-continuity-polish="' + version + '"'), 'Candidate release marker is missing');
    const hero = heroHTML;
    const content = value => value.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
    assert.equal(content(candidate),content(baseline.html),'Design changed page wording');
    assert.deepEqual([...candidate.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]),[...baseline.html.matchAll(/\bhref="([^"]+)"/g)].map(m=>m[1]),'Design changed link destinations/order');
    assert(hero(baseline.html), 'Current hero boundary is missing');
    assert.equal(hero(candidate), hero(baseline.html), 'Approved hero content changed');
    const imageSource = hero(baseline.html).match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1];
    assert(imageSource, 'Approved hero image source is missing');
    const imageURL = new URL(imageSource, ORIGIN);
    assert.equal(imageURL.origin, ORIGIN, 'Hero photograph moved to an unexpected origin');
    const heroImageBefore = await imageCheck(imageURL.href);
    fs.writeFileSync(path.join(OUT, 'continuity-before.html'), baseline.html);
    fs.writeFileSync(path.join(OUT, 'continuity-candidate.html'), candidate);
    const codeBefore = {};
    await Promise.all(CODE_URLS.map(async resourceURL => {
      const resource = await get(resourceURL);
      assert.equal(resource.status, 200, 'Protected support script unavailable: ' + resourceURL);
      assert(/(?:javascript|ecmascript)/i.test(resource.headers.get('content-type') || ''), 'Protected resource is not JavaScript: ' + resourceURL);
      const result = {html:resource.html};
      codeBefore[resourceURL] = {source: resource.html, candidate: result.html, beforeSHA256: digest(resource.html), afterSHA256: digest(result.html)};
      const filename = resourceURL.replace(/^\//, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
      fs.writeFileSync(path.join(OUT, filename + '-before.js'), resource.html);
      fs.writeFileSync(path.join(OUT, filename + '-candidate.js'), result.html);
    }));
    const protectedBefore = {};
    await Promise.all(PROTECTED.map(async pathname => {
      const page = await get(pathname); assert.equal(page.status, 200, pathname);
      const main = mainHTML(page.html); assert(main, 'Missing protected main: ' + pathname);
      protectedBefore[pathname] = {status: page.status, mainSHA256: digest(main)};
    }));
    const aliasBefore = {};
    for (const pathname of ALIASES.filter(value => value !== TARGET)) {
      const page = await get(pathname, undefined, {manual: true});
      aliasBefore[pathname] = {status: page.status, location: page.headers.get('location')};
    }
    for (const [name, scope] of scopes) {
      const deployment = await active(name), previousVersion = serving(deployment);
      assert.equal(deployment.versions.length, 1, 'An existing zero-traffic release is present for ' + name);
      const current = await cf('/accounts/' + ACCOUNT + '/workers/workers/' + name + '/versions/' + previousVersion + '?include=modules');
      const settings = await cf('/accounts/' + ACCOUNT + '/workers/scripts/' + name + '/settings');
      assert(current.modules?.length, 'Current module source unavailable for ' + name);
      assert(!current.modules.some(module => module.name.startsWith(PREFIX)), 'This release prefix already exists on ' + name);
      const oldMain = originalEntry(current, settings), ownedPaths = [...scope].sort();
      const additions = fs.readdirSync(path.dirname(fileURLToPath(import.meta.url)))
        .filter(file => file === 'runtime.mjs')
        .map(file => ({name: PREFIX + file, content_type: 'application/javascript+module', content_base64: fs.readFileSync(new URL(file, import.meta.url)).toString('base64')}));
      assert(additions.some(module => module.name === PREFIX + 'runtime.mjs'));
      const entry = 'import original from "../' + oldMain + '";\nexport * from "../' + oldMain + '";\nimport {wrap} from "./runtime.mjs";\nexport default wrap(original,' + JSON.stringify(ownedPaths) + ');\n';
      additions.push({name: PREFIX + 'entry.mjs', content_type: 'application/javascript+module', content_base64: Buffer.from(entry).toString('base64')});
      const modules = [...current.modules, ...additions];
      assert.equal(new Set(modules.map(module => module.name)).size, modules.length, 'Module name collision');
      const resources = current.resources?.script_runtime || {}, bindings = current.bindings || settings.bindings;
      assert(Array.isArray(bindings), 'Current bindings unavailable for ' + name);
      const metadata = {
        main_module: PREFIX + 'entry.mjs',
        compatibility_date: current.compatibility_date || resources.compatibility_date || settings.compatibility_date,
        compatibility_flags: current.compatibility_flags || resources.compatibility_flags || settings.compatibility_flags || [],
        bindings: bindings.map(binding => ({type: 'inherit', name: binding.name})),
        keep_assets: true,
        annotations: {'workers/message': 'Matt-approved Continuity design polish; preserve all copy, latest hero, support clients and routes', 'workers/tag': 'continuity-polish-' + process.env.GITHUB_SHA.slice(0, 12)}
      };
      for (const key of ['usage_model', 'limits', 'placement', 'cache_options', 'observability', 'tail_consumers', 'logpush']) {
        const value = current[key] ?? resources[key] ?? settings[key];
        if (value !== undefined) metadata[key] = value;
      }
      states.push({name, deployment, previousVersion, current, settings, modules, metadata, bindings, assets: assetConfig(current) ?? settings.assets, ownedPaths, oldMain});
    }
    const preservedCodeChecks = Object.entries(codeBefore).map(([resourceURL, resource]) => ({url: resourceURL, beforeSHA256: resource.beforeSHA256, afterSHA256: resource.afterSHA256}));
    save('before', {source: process.env.GITHUB_SHA, releaseIdentity, routeCount: beforeRoutes.length, owners, protectedPages: protectedBefore, aliases: aliasBefore, heroImage: heroImageBefore, targetMainSHA256: digest(mainHTML(baseline.html)), candidateMainSHA256: digest(mainHTML(candidate)), preservedCodeChecks, workers: states.map(state => ({name: state.name, previousVersion: state.previousVersion, previousDeployment: state.deployment.id, oldMain: state.oldMain, retainedModules: moduleHashes(state.current.modules), bindingTypes: state.bindings.map(binding => ({name: binding.name, type: binding.type}))}))});
    for (const state of states) {
      assert.equal((await active(state.name)).id, state.deployment.id, 'Serving runtime moved before staging ' + state.name);
      const form = new FormData();
      form.set('metadata', new Blob([JSON.stringify(state.metadata)], {type: 'application/json'}), 'metadata.json');
      for (const module of state.modules) form.set(module.name, new Blob([Buffer.from(module.content_base64, 'base64')], {type: module.content_type || 'application/javascript+module'}), module.name);
      const uploaded = await cf('/accounts/' + ACCOUNT + '/workers/scripts/' + state.name + '/versions?bindings_inheritance=strict', 'POST', form);
      state.versionId = uploaded.id; assert.match(state.versionId, /^[a-f0-9-]{36}$/);
      const staged = await cf('/accounts/' + ACCOUNT + '/workers/workers/' + state.name + '/versions/' + state.versionId + '?include=modules');
      assert.equal(staged.main_module, state.metadata.main_module, 'Entry changed during upload');
      assert.deepEqual(moduleHashes(staged.modules), moduleHashes(state.modules), 'Module bytes changed during upload');
      assert.deepEqual(sorted(staged.bindings), sorted(state.bindings), 'Runtime bindings changed');
      assert.deepEqual(assetConfig(staged), state.assets, 'Static assets changed');
      assert.equal(staged.compatibility_date, state.metadata.compatibility_date, 'Compatibility date changed');
      assert.deepEqual(staged.compatibility_flags || [], state.metadata.compatibility_flags, 'Compatibility flags changed');
      assert.equal((await active(state.name)).id, state.deployment.id, 'Staging changed ordinary traffic');
    }
    assert.deepEqual(await routes(), beforeRoutes, 'Routes changed during preparation');
    assert.equal(normalise((await get(TARGET)).html), normalise(baseline.html), 'Target changed while preparing');
    await Promise.all(CODE_URLS.map(async resourceURL => assert.equal((await get(resourceURL)).html, codeBefore[resourceURL].source, 'Protected support script changed while preparing: ' + resourceURL)));
    save('staged', {source: process.env.GITHUB_SHA, workers: states.map(state => ({name: state.name, versionId: state.versionId, previousVersion: state.previousVersion, retainedModules: state.current.modules.length}))});
    for (const state of states) {
      assert.equal((await active(state.name)).id, state.deployment.id, 'Serving runtime moved before zero-traffic verification');
      state.zeroMessage = intentMessage(state, 'zero');
      state.zeroAttempted = true;
      save('zero-intent-' + state.name, {releaseIdentity, previousDeployment: state.deployment.id, previousVersion: state.previousVersion, versionId: state.versionId, message: state.zeroMessage});
      const zero = await cf('/accounts/' + ACCOUNT + '/workers/scripts/' + state.name + '/deployments', 'POST', {strategy: 'percentage', versions: [{version_id: state.previousVersion, percentage: 100}, {version_id: state.versionId, percentage: 0}], annotations: {'workers/message': state.zeroMessage}});
      // Keep the returned ownership ID before a later read can fail.
      state.zeroDeployment = zero.id;
      const observed = await active(state.name);
      assert.equal(observed.id, state.zeroDeployment, 'Zero-traffic deployment was superseded');
      assert.equal(serving(observed), state.previousVersion, 'Zero-traffic verification changed ordinary traffic');
    }
    const overrides = states.map(state => state.name + '="' + state.versionId + '"').join(', ');
    async function verify(override, suffix) {
      let target;
      for (let attempt = 0; attempt < 8; attempt++) {
        target = await get(TARGET, override);
        if (target.status === 200 && target.headers.get('X-Shift-Continuity-Polish') === version) break;
        if (attempt < 7) await new Promise(resolve => setTimeout(resolve, 1500));
      }
      assert.equal(target.status, 200, 'Continuity page unavailable');
      assert.equal(target.headers.get('X-Shift-Continuity-Polish'), version, 'Release marker missing on ' + suffix);
      assert.equal(mainHTML(target.html), mainHTML(candidate), 'Delivered main differs from verified candidate');
      assert.equal(hero(target.html), hero(baseline.html), 'Hero changed on ' + suffix);
      fs.writeFileSync(path.join(OUT, 'continuity-' + suffix + '.html'), target.html);
      await Promise.all(CODE_URLS.map(async resourceURL => {
        let resource;
        for (let attempt = 0; attempt < 8; attempt++) {
          resource = await get(resourceURL, override);
          if (resource.status === 200) break;
          if (attempt < 7) await new Promise(resolve => setTimeout(resolve, 1500));
        }
        assert.equal(resource.status, 200, 'Protected support script unavailable on ' + suffix + ': ' + resourceURL);
        assert(/(?:javascript|ecmascript)/i.test(resource.headers.get('content-type') || ''), 'Protected response is not JavaScript: ' + resourceURL);
        assert.equal(resource.html, codeBefore[resourceURL].candidate, 'Protected support script differs from verified candidate: ' + resourceURL);
        const filename = resourceURL.replace(/^\//, '').replace(/[^a-zA-Z0-9._-]+/g, '-');
        fs.writeFileSync(path.join(OUT, filename + '-' + suffix + '.js'), resource.html);
      }));
      assert.deepEqual(await imageCheck(imageURL.href, override), heroImageBefore, 'Approved hero image bytes changed on ' + suffix);
      await Promise.all(PROTECTED.map(async pathname => {
        const page = await get(pathname, override);
        assert.equal(page.status, protectedBefore[pathname].status, 'Protected response changed: ' + pathname);
        assert.equal(digest(mainHTML(page.html)), protectedBefore[pathname].mainSHA256, 'Protected main changed: ' + pathname);
      }));
      for (const [pathname, previous] of Object.entries(aliasBefore)) {
        const page = await get(pathname, override, {manual: true});
        assert.equal(page.status, previous.status, 'Alias status changed: ' + pathname);
        assert.equal(page.headers.get('location'), previous.location, 'Alias redirect changed: ' + pathname);
      }
      assert.deepEqual(await routes(), beforeRoutes, 'Routes changed on ' + suffix);
    }
    await verify(overrides, 'zero-observed');
    save('zero-traffic', {verified: true, source: process.env.GITHUB_SHA, protectedPages: PROTECTED.length, aliases: aliasBefore, preservedCodeChecks, routesChanged: 0});
    for (const state of states) {
      assert.equal((await active(state.name)).id, state.zeroDeployment, 'Another release followed zero-traffic verification');
      state.promotionMessage = intentMessage(state, 'live');
      state.promotionAttempted = true;
      save('promotion-intent-' + state.name, {releaseIdentity, zeroDeployment: state.zeroDeployment, previousVersion: state.previousVersion, versionId: state.versionId, message: state.promotionMessage});
      const promoted = await promote(state.name, state.versionId, state.promotionMessage);
      state.ownedDeployment = promoted.id;
      const observed = await active(state.name);
      assert.equal(observed.id, state.ownedDeployment, 'Promotion was superseded');
      assert.equal(serving(observed), state.versionId, 'Promotion did not select the approved version');
    }
    await verify(undefined, 'live');
    for (const state of states) assert.equal((await active(state.name)).id, state.ownedDeployment, 'Another deployment followed live verification');
    const receipt = {verified: true, source: process.env.GITHUB_SHA, releaseIdentity, version, url: ORIGIN + TARGET, workers: states.map(state => ({name: state.name, deploymentId: state.ownedDeployment, versionId: state.versionId, previousVersionId: state.previousVersion, retainedModules: state.current.modules.length})), heroPreserved: true, heroImage: heroImageBefore, bindingsPreserved: true, assetConfigurationPreserved: true, preservedCodeChecks, protectedPages: PROTECTED, routeCount: beforeRoutes.length, routesChanged: 0, authenticatedAcceptancePerformed: false, verifiedAt: new Date().toISOString()};
    save('receipt', receipt);
    console.log('CONTINUITY_POLISH_RELEASE ' + JSON.stringify(receipt));
  } catch (error) {
    save('failure', {message: error.message, stack: error.stack, releaseIdentity, workers: states.map(state => ({name: state.name, stagedVersion: state.versionId, previousVersion: state.previousVersion, zeroDeployment: state.zeroDeployment, ownedDeployment: state.ownedDeployment, zeroAttempted: state.zeroAttempted, promotionAttempted: state.promotionAttempted}))});
    const recovery = [];
    for (const state of [...states].reverse()) {
      try {
        // A failed POST response is not evidence that the provider rejected it.
        // Reconcile a bounded number of reads using the exact unique message.
        const pendingMode = state.promotionAttempted && !state.ownedDeployment ? 'live' : state.zeroAttempted && !state.zeroDeployment ? 'zero' : null;
        let current, owned;
        for (let attempt = 0; attempt < (pendingMode ? 3 : 1); attempt++) {
          current = await active(state.name);
          owned = ownedRecovery(state, current);
          if (!pendingMode || owned?.mode === pendingMode) break;
          if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500));
        }
        const unresolvedWrite = Boolean(pendingMode && owned?.mode !== pendingMode);
        const observation = {name: state.name, currentDeploymentId: current.id, currentVersions: current.versions, unresolvedWrite};
        if (owned) {
          save('reconciled-' + state.name, {...observation, releaseIdentity, owned});
          // Never overwrite a deployment that arrived after reconciliation.
          assert.equal((await active(state.name)).id, current.id, 'Deployment moved before owned rollback');
          const rollbackMessage = intentMessage(state, 'restore');
          let restored;
          try {
            restored = await promote(state.name, state.previousVersion, rollbackMessage);
          } catch (rollbackResponseError) {
            const observed = await active(state.name);
            if (observed.annotations?.['workers/message'] === rollbackMessage && observed.versions.length === 1 && serving(observed) === state.previousVersion) restored = observed;
            else throw rollbackResponseError;
          }
          const verified = await active(state.name);
          assert.equal(verified.id, restored.id, 'Owned rollback was superseded');
          assert.equal(serving(verified), state.previousVersion, 'Owned rollback did not restore the predecessor');
          assert.equal(verified.versions.length, 1, 'Owned rollback left a zero-traffic version');
          save('rollback-' + state.name, {deploymentId: restored.id, restoredVersion: state.previousVersion, reconciledFrom: owned.deploymentId, unresolvedWrite});
          recovery.push({...observation, status: 'owned-predecessor-restored', rollbackDeploymentId: restored.id, reconciled: owned.reconciled});
          console.log('Restored owned Continuity predecessor for ' + state.name);
        } else {
          // A successor with another annotation/ID belongs to another operation.
          // Do not guess or write over it, even if its source looks familiar.
          recovery.push({...observation, status: unresolvedWrite ? 'post-outcome-uncertain-no-owned-deployment-observed' : current.id === state.deployment.id ? 'baseline-still-serving' : 'unrelated-successor-preserved'});
        }
      } catch (rollbackError) {
        save('rollback-failure-' + state.name, {message: rollbackError.message});
        recovery.push({name: state.name, status: 'recovery-unverified', unresolvedWrite: true, message: rollbackError.message});
        console.error('Continuity rollback needs inspection for ' + state.name + ': ' + rollbackError.message);
      }
    }
    const uncertain = recovery.some(item => item.unresolvedWrite);
    save('recovery', {source: process.env.GITHUB_SHA, releaseIdentity, uncertain, recovery});
    if (uncertain) console.error('CONTINUITY_RECOVERY_UNCERTAIN ' + JSON.stringify({releaseIdentity, workers: recovery.filter(item => item.unresolvedWrite).map(item => ({name: item.name, status: item.status}))}));
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
