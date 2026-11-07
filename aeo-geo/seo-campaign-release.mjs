import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {isDeepStrictEqual} from 'node:util';
import {programmePublicLibraryLinks} from './delivery.mjs';
import {activeDeployment, replaceActiveTraffic} from './deployment.mjs';
import {hash} from './package.mjs';
import {runtimeRollbackDecision} from '../release/runtime-rollback-guard.mjs';

const account = '9e5386dcf455be34c582d93f8bfc79e6';
const host = 'shiftsometimber.co.uk';
const origin = `https://${host}`;
const alias = '/when-the-clinic-goes-quiet';
const destination = '/clinic-gone-quiet';
const programme = '/programme';
const query = '?source=release-check&next=%2Fprogramme';
const targetPaths = [alias, alias + query, programme, programme + query];
const protectedPaths = ['/', '/start-here', '/member/dashboard', '/recipes', '/exercises', destination];
const delivery = 'aeo-geo/delivery.mjs';
const baseHash = 'f459d7d72b975715a3eaf1af0333c3b3ba53f413dfc26aa532c1e7cf5a2a6195';
const approvedHash = '6911161bc49ffab987e6503c8f5027200cfb8874dfc0ff1009b451224e4375d2';
const settingsKeys = ['placement', 'limits', 'observability', 'logpush'];
const versionKeys = ['bindings', 'compatibility_date', 'compatibility_flags', 'assets', 'usage_model', 'migration_tag',
 'cache_options', 'containers', 'exports', 'limits', 'package_dependencies', 'placement'];
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const proof = 'seo-campaign-proof';
const {CLOUDFLARE_API_TOKEN: token, GITHUB_SHA: source, GITHUB_RUN_ID: run} = process.env;

mkdirSync(proof, {recursive: true});
function save(name, value) {
 const path = `${proof}/${name}.json`;
 writeFileSync(`${path}.tmp`, JSON.stringify(value, null, 2));
 renameSync(`${path}.tmp`, path);
}
function same(actual, expected, message) {
 assert(isDeepStrictEqual(actual, expected), message);
}
function git(...args) {
 return execFileSync('git', args, {stdio: 'pipe'});
}
function mainLease() {
 assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
 assert.match(source || '', /^[a-f0-9]{40}$/);
 assert.match(run || '', /^\d+$/);
 assert.equal(git('rev-parse', 'HEAD').toString().trim(), source, 'Checkout moved during release');
 git('fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main');
 assert.equal(git('rev-parse', 'origin/main').toString().trim(), source, 'Main moved during release');
}

async function provider(path, init = {}) {
 const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
  ...init, headers: {Authorization: `Bearer ${token}`, ...init.headers}, signal: AbortSignal.timeout(60_000)
 });
 const data = await response.json();
 assert(response.ok && data.success, `Cloudflare refused ${init.method || 'GET'} ${response.status} (${data.errors?.map(e => e.code).join(', ') || 'no error code'})`);
 return data.result;
}
const api = (path, init) => provider(`/accounts/${account}${path}`, init);
const script = worker => `/workers/scripts/${worker}`;
const version = (worker, id, include = '') => api(`/workers/workers/${worker}/versions/${id}${include}`);
const settings = worker => api(`${script(worker)}/settings`);
async function latest(worker) {
 const {deployments} = await api(`${script(worker)}/deployments`);
 const current = activeDeployment(deployments.toSorted((a, b) => b.created_on.localeCompare(a.created_on))[0]);
 assert(uuid.test(current.id) && uuid.test(current.versions[0].version_id) && Number.isFinite(Date.parse(current.created_on)), 'Invalid deployment identity');
 return current;
}
const deploy = (worker, versions) => api(`${script(worker)}/deployments`, {
 method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({strategy: 'percentage', versions})
});

function matchingRoute(route, url) {
 const [, scheme, domain, path = ''] = route.pattern.match(/^(?:(https?):\/\/)?([^/]+)(\/.*)?$/) || [];
 if (!domain || (scheme && `${scheme}:` !== url.protocol)) return null;
 const domainText = domain.toLowerCase().replace(/^\*/, '');
 const pathText = path.replace(/\*$/, '');
 const target = url.pathname + url.search;
 if (!(domain.startsWith('*') ? url.hostname.endsWith(domainText) : url.hostname === domainText)) return null;
 if (!(path.endsWith('*') ? target.startsWith(pathText) : target === pathText)) return null;
 return {pattern: route.pattern, worker: route.script || null,
  specificity: [Number(Boolean(scheme)), Number(!domain.startsWith('*')), domainText.length, Number(!path.endsWith('*')), pathText.length]};
}
async function owners(zone) {
 const routes = await provider(`/zones/${zone}/workers/routes`);
 return Object.fromEntries(targetPaths.map(path => {
  const matches = routes.map(route => matchingRoute(route, new URL(origin + path))).filter(Boolean);
  const mostSpecific = matches.filter(a => !matches.some(b =>
   b.specificity.every((n, i) => n >= a.specificity[i]) && b.specificity.some((n, i) => n > a.specificity[i])));
  return [path, mostSpecific.map(({pattern, worker}) => ({pattern, worker})).sort((a, b) => a.pattern.localeCompare(b.pattern))];
 }));
}
function routeWorker(matches) {
 const workers = new Set(matches.map(match => match.worker));
 const [worker] = workers;
 assert(workers.size === 1 && /^[a-z0-9][a-z0-9-]*$/.test(worker || ''), 'The approved URL needs one unambiguous existing route owner');
 return worker;
}

async function page(path, method = 'GET') {
 const response = await fetch(origin + path, {method, redirect: 'manual', headers: {'Cache-Control': 'no-cache'}, signal: AbortSignal.timeout(35_000)});
 return {status: response.status, location: response.headers.get('location'), body: await response.text()};
}
const scrub = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, scriptTag =>
 /^<script\b[^>]*\bsrc=["']https:\/\/static\.cloudflareinsights\.com\//i.test(scriptTag) ||
 /window\.__CF\$cv\$params/.test(scriptTag) ? '' : scriptTag);
const fingerprint = ({status, location, body}) => ({status, location, sha256: hash(scrub(body))});
async function protectedPages() {
 return Object.fromEntries(await Promise.all(protectedPaths.map(async path => [path, fingerprint(await page(path))])));
}

async function rollback() {
 const path = `${proof}/deployments.json`;
 const receipts = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
 const intents = `${proof}/promotion-intents.json`;
 const pending = existsSync(intents) ? JSON.parse(readFileSync(intents, 'utf8')).filter(intent =>
  !receipts.some(receipt => receipt.script === intent.script && receipt.versionId === intent.versionId)) : [];
 const results = [];
 for (const receipt of receipts.toReversed()) {
  try {
   const live = await latest(receipt.script);
   const decision = runtimeRollbackDecision({before: receipt.before, active: live, receipt, source, run});
   if (decision.action === 'restore') {
    const restored = await deploy(receipt.script, receipt.before.providerVersions);
    const active = await latest(receipt.script);
    assert.equal(active.id, restored.id, 'Rollback was displaced');
    assert.equal(active.versions[0].version_id, decision.versionId, 'Captured version did not return to traffic');
   }
   results.push({worker: receipt.script, ...decision});
  } catch (error) {
   results.push({worker: receipt.script, action: 'refused', reason: error.message});
  }
 }
 save('rollback', {results, pending});
 assert(!pending.length, 'A promotion request has no ownership receipt. Inspect the active deployment before any manual restoration');
 assert(results.every(result => result.action !== 'refused'), 'At least one guarded rollback was refused');
}

async function capture(worker, approved) {
 const before = await latest(worker);
 const original = await version(worker, before.versions[0].version_id, '?include=modules,sourcemaps');
 assert.equal(original.id, before.versions[0].version_id, 'Captured version identity differs from serving traffic');
 const config = await settings(worker);
 assert(original.modules.some(module => module.name === original.main_module), 'Published entry module absent');
 assert.equal(new Set(original.modules.map(module => module.name)).size, original.modules.length, 'Duplicate published module names');
 const current = original.modules.find(module => module.name === delivery);
 const currentHash = current && hash(Buffer.from(current.content_base64, 'base64'));
 save(`capture-${worker}`, {worker, deploymentId: before.id, versionId: before.versions[0].version_id,
  mainModule: original.main_module, deliverySha256: currentHash ?? null, moduleCount: original.modules.length});
 assert.equal(currentHash, baseHash, `Published delivery module drifted for ${worker}`);
 const modules = original.modules.map(module => module.name === delivery ? {...module, content_base64: approved.toString('base64')} : module);
 return {worker, before, original, config, modules};
}
async function deploymentLease({worker, before, config}) {
 const current = await latest(worker);
 assert.equal(current.id, before.id, `Serving lease moved for ${worker}`);
 same(current.providerVersions, before.providerVersions, `Serving traffic moved for ${worker}`);
 const currentSettings = await settings(worker);
 for (const key of settingsKeys) same(currentSettings[key], config[key], `Serving ${key} moved for ${worker}`);
}
async function stage({worker, original, config, modules}) {
 const metadata = {main_module: original.main_module, compatibility_date: original.compatibility_date,
  compatibility_flags: original.compatibility_flags || [], bindings: original.bindings.map(binding => ({type: 'inherit', name: binding.name})),
  keep_assets: true, annotations: {'workers/commit_sha': source, 'workers/message': `Approved Shift continuity and Programme links, run ${run}`}};
 for (const key of settingsKeys) if (config[key] !== undefined) metadata[key] = config[key];
 for (const key of ['cache_options', 'containers', 'limits', 'package_dependencies', 'placement', 'usage_model']) {
  if (original[key] !== undefined) metadata[key] = original[key];
 }
 const form = new FormData();
 form.set('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}), 'metadata.json');
 for (const module of modules) form.set(module.name, new Blob([Buffer.from(module.content_base64, 'base64')], {type: module.content_type}), module.name);
 // Multipart inheritance uses the newest uploaded version, even if it has no traffic.
 assert.equal((await version(worker, 'latest')).id, original.id, `An unpromoted upload could change inherited settings for ${worker}`);
 const staged = await api(`${script(worker)}/versions?bindings_inherit=strict`, {method: 'POST', body: form});
 assert(uuid.test(staged.id), 'Staged version identity absent');
 const reviewed = await version(worker, staged.id, '?include=modules,sourcemaps');
 assert(Number.isInteger(original.number) && reviewed.number === original.number + 1, `Another upload could have changed inherited settings for ${worker}`);
 assert.equal(reviewed.id, staged.id, 'Retrieved version does not match the staged version');
 assert.equal(reviewed.main_module, original.main_module, 'Staged entry module changed');
 for (const key of versionKeys) same(reviewed[key], original[key], `Staged ${key} changed for ${worker}`);
 assert.equal(reviewed.modules.length, modules.length, 'Staged module count changed');
 for (const expected of modules) {
  const actual = reviewed.modules.find(module => module.name === expected.name);
  assert(actual?.content_type === expected.content_type && hash(Buffer.from(actual.content_base64, 'base64')) ===
   hash(Buffer.from(expected.content_base64, 'base64')), `Staged module differs for ${worker}: ${expected.name}`);
 }
 save(`staged-${worker}`, {worker, versionId: staged.id, originalModulesUnchanged: modules.length - 1, amendedModule: delivery, sha256: approvedHash});
 return staged.id;
}

async function release() {
 assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
 mainLease();
 const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
 assert.equal(event.after, source);
 assert.match(event.before || '', /^[a-f0-9]{40}$/);
 const changed = git('diff', '--name-only', event.before, source).toString().trim().split('\n');
 const allowed = [delivery, 'aeo-geo/seo-campaign.test.mjs', 'aeo-geo/seo-campaign-release.mjs', '.github/workflows/aeo-geo-technical.yml'];
 assert(changed.includes(delivery) && changed.every(path => allowed.includes(path)), 'Unapproved files in release scope');
 const approved = readFileSync(delivery);
 assert.equal(hash(approved), approvedHash, 'Checkout does not match the approved delivery module');
 assert.equal(hash(git('show', `${event.before}:${delivery}`)), baseHash, 'Main base differs from reviewed delivery module');
 const zones = await provider(`/zones?name=${host}`);
 assert(zones.length === 1 && zones[0].name === host && zones[0].account?.id === account, 'Approved Cloudflare zone was not found');
 const zone = zones[0].id;
 const routes = await owners(zone);
 save('route-owners', {routes, routeWrites: 0});
 const workers = [...new Set(Object.values(routes).map(routeWorker))];
 const plans = await Promise.all(workers.map(worker => capture(worker, approved)));

 const [originalProgramme, originalProgrammeQuery, protectedBefore, aliasBefore] = await Promise.all([
  page(programme), page(programme + query), protectedPages(), page(alias)
 ]);
 const expectedProgramme = programmePublicLibraryLinks(originalProgramme.body, programme);
 const expectedProgrammeQuery = fingerprint({...originalProgrammeQuery,
  body: programmePublicLibraryLinks(originalProgrammeQuery.body, programme)});
 save('public-before', {programme: fingerprint(originalProgramme), programmeQuery: fingerprint(originalProgrammeQuery),
  alias: fingerprint(aliasBefore), protected: protectedBefore});
 assert.equal(aliasBefore.status, 404, 'Current alias differs from the approved baseline');
 assert.equal(protectedBefore[destination].status, 200, 'Redirect destination is unavailable');
 assert(originalProgramme.status === 200 && expectedProgramme !== originalProgramme.body, 'Current Programme differs from the approved baseline');

 for (const plan of plans) {
  mainLease();
  await deploymentLease(plan);
  plan.staged = await stage(plan);
 }
 const intents = [], receipts = [];
 for (const plan of plans) {
  mainLease();
  same(await owners(zone), routes, 'Route owners moved before promotion');
  await deploymentLease(plan);
  intents.push({script: plan.worker, versionId: plan.staged});
  save('promotion-intents', intents);
  const result = await deploy(plan.worker, replaceActiveTraffic(plan.before, plan.staged));
  assert(uuid.test(result.id), 'Promotion receipt missing deployment identity');
  receipts.push({kind: 'owned_runtime_deployment', source, run, script: plan.worker, deploymentId: result.id, versionId: plan.staged, before: plan.before});
  save('deployments', receipts);
  const active = await latest(plan.worker);
  assert.equal(active.id, result.id, 'Promotion was displaced');
  assert.equal(active.versions[0].version_id, plan.staged, 'Staged version did not receive production traffic');
 }

 const redirectChecks = [[alias, 'GET', ''], [alias, 'HEAD', ''], [alias + query, 'GET', query], [alias + query, 'HEAD', query]];
 let liveProgramme, liveProgrammeQuery, redirects;
 for (let attempt = 0; attempt < 5; attempt++) {
  [liveProgramme, liveProgrammeQuery, ...redirects] = await Promise.all([
   page(programme), page(programme + query), ...redirectChecks.map(([path, method]) => page(path, method))
  ]);
  if (liveProgramme.status === 200 && scrub(liveProgramme.body) === scrub(expectedProgramme) &&
   isDeepStrictEqual(fingerprint(liveProgrammeQuery), expectedProgrammeQuery) &&
   redirects.every((result, i) => result.status === 301 && result.location === origin + destination + redirectChecks[i][2] && !result.body)) break;
  if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 4000));
 }
 const protectedAfter = await protectedPages();
 save('public-after', {programme: fingerprint(liveProgramme), programmeQuery: fingerprint(liveProgrammeQuery),
  redirects: redirects.map((result, i) => ({path: redirectChecks[i][0], method: redirectChecks[i][1], ...fingerprint(result)})), protected: protectedAfter});
 assert.equal(liveProgramme.status, 200, 'Programme did not return HTTP 200');
 assert(scrub(liveProgramme.body) === scrub(expectedProgramme), 'Live Programme differs from the two approved link edits');
 same(fingerprint(liveProgrammeQuery), expectedProgrammeQuery, 'Programme query response differs from the approved edits');
 for (const [i, result] of redirects.entries()) {
  assert.equal(result.status, 301, 'Retired URL did not return HTTP 301');
  assert.equal(result.location, origin + destination + redirectChecks[i][2], 'Retired URL redirected to an unexpected destination');
  assert.equal(result.body, '', 'Retired URL sent an unexpected body');
 }
 same(protectedAfter, protectedBefore, 'Protected paths changed during release');
 mainLease();
 same(await owners(zone), routes, 'Route owners moved during verification');
 for (const receipt of receipts) assert.equal((await latest(receipt.script)).id, receipt.deploymentId, 'Deployment moved during verification');
 save('live-verification', {verified: true, source, run, workers, redirect: {from: alias, to: destination, status: 301, queryPreserved: true},
  programme: {path: programme, links: {'Browse public recipes': '/recipes', 'Browse movement guides': '/exercises'}},
  protectedPaths, routeWrites: 0, databaseWrites: 0});
}

try {
 assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID, account);
 assert(token, 'Existing Cloudflare deployment token missing');
 if (process.argv[2] === 'rollback') await rollback();
 else {
  assert.equal(process.argv.length, 2, 'Unrecognised release mode');
  await release();
 }
} catch (error) {
 save('failure', {mode: process.argv[2] || 'release', message: error.message});
 console.error(error.message);
 process.exitCode = 1;
}
