import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {isDeepStrictEqual} from 'node:util';
import {activeDeployment} from './deployment.mjs';
import {hash} from './package.mjs';
import {programmePublicLibraryLinks} from './delivery.mjs';

const account = '9e5386dcf455be34c582d93f8bfc79e6';
const host = 'shiftsometimber.co.uk', origin = `https://${host}`;
const core = 'shift-core', coreDeployment = '9e15801e-59a9-4bd6-b8d9-13a3adcf76a7';
const coreVersion = '36d0c04b-bb34-4c05-81ac-27e20a958756';
const approvedCommit = 'ca0b012b91e7830d11a1d7d5af424f253ee990b8';
const previousAttempt = 'f40c98ebe4b7a4bd68720d295d533faa08175dec';
const approvedHash = '6911161bc49ffab987e6503c8f5027200cfb8874dfc0ff1009b451224e4375d2';
const delivery = 'aeo-geo/delivery.mjs', moduleName = 'seo-campaign-edge.mjs';
const alias = '/when-the-clinic-goes-quiet', destination = '/clinic-gone-quiet', programme = '/programme';
const query = '?source=release-check&next=%2Fprogramme';
const prefixes = [alias, programme];
const patterns = prefixes.map(path => `${origin}${path}*`);
const lookalikes = prefixes.map(path => `${path}-release-passthrough`);
const protectedPaths = ['/', '/start-here', '/member/dashboard', '/recipes', '/exercises', destination, ...lookalikes];
const previewHeader = 'x-shift-seo-release-preview';
const proof = 'seo-campaign-edge-proof';
const {CLOUDFLARE_API_TOKEN: token, GITHUB_SHA: source, GITHUB_RUN_ID: run, GITHUB_RUN_ATTEMPT: attempt} = process.env;
const worker = `shift-seo-campaign-edge-${run}-${attempt}`;
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const providerId = /^[a-f0-9]{32}$/;

function save(name, value) {
 mkdirSync(proof, {recursive: true});
 const path = `${proof}/${name}.json`;
 writeFileSync(`${path}.tmp`, JSON.stringify(value, null, 2));
 renameSync(`${path}.tmp`, path);
}
const same = (a, b, message) => assert(isDeepStrictEqual(a, b), message);
const git = (...args) => execFileSync('git', args, {stdio: 'pipe'});
const json = (method, body) => ({method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
async function provider(path, init = {}) {
 const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
  ...init, headers: {Authorization: `Bearer ${token}`, ...init.headers}, signal: AbortSignal.timeout(60_000)
 });
 const data = await response.json();
 assert(response.ok && data.success, `Cloudflare refused ${init.method || 'GET'} (${response.status}: ${data.errors?.map(e => e.code).join(', ') || 'no error code'})`);
 return data.result;
}
const api = (path, init) => provider(`/accounts/${account}${path}`, init);
const beta = script => `/workers/workers/${script}`;
const scriptPath = script => `/workers/scripts/${script}`;
const routePath = zone => `/zones/${zone}/workers/routes`;
async function latest(script) {
 const {deployments} = await api(`${scriptPath(script)}/deployments`);
 return activeDeployment(deployments.toSorted((a, b) => b.created_on.localeCompare(a.created_on))[0]);
}
async function coreLease() {
 const live = await latest(core);
 assert.equal(live.id, coreDeployment, 'Core deployment changed');
 assert.equal(live.versions[0].version_id, coreVersion, 'Core version changed');
}
function mainLease() {
 assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
 assert.match(source || '', /^[a-f0-9]{40}$/);
 assert.equal(git('rev-parse', 'HEAD').toString().trim(), source, 'Release checkout changed');
 git('fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main');
 assert.equal(git('rev-parse', 'origin/main').toString().trim(), source, 'Main changed');
}
async function routes(zone) {
 return (await provider(routePath(zone))).map(({id, pattern, script}) => ({id, pattern, script: script || null}))
  .sort((a, b) => a.id.localeCompare(b.id));
}
async function routeLease(zone, baseline, created = []) {
 same(await routes(zone), [...baseline, ...created].sort((a, b) => a.id.localeCompare(b.id)), 'Cloudflare route table moved');
}
function checkOverlaps(baseline) {
 for (const prefix of prefixes) {
  const overlaps = baseline.flatMap(route => {
   const [, scheme, domain, path = ''] = route.pattern.match(/^(?:(https?):\/\/)?([^/]+)(\/.*)?$/) || [];
   assert(domain, 'Unrecognised Cloudflare route pattern');
   if (scheme === 'http' || (domain.startsWith('*') ? !host.endsWith(domain.slice(1).toLowerCase()) : host !== domain.toLowerCase())) return [];
   const wildcard = path.endsWith('*');
   const text = wildcard ? path.slice(0, -1) : path;
   return text.startsWith(prefix) || (wildcard && prefix.startsWith(text)) ? [{route, text, wildcard}] : [];
  });
  assert(overlaps.length && overlaps.every(({route, text, wildcard}) =>
   route.script === core && wildcard && text.length < prefix.length && prefix.startsWith(text)), `Existing route collision for ${prefix}`);
 }
}

export function edgeSource(approved) {
 assert.equal(hash(approved), approvedHash, 'Approved source changed');
 const blocks = [...approved.toString('utf8').matchAll(/^\/\/ Review candidate: one retired public alias[^\n]*\n[\s\S]+?(?=^export const ROBOTS=)/gm)];
 assert.equal(blocks.length, 1, 'Approved public helpers changed');
 return `const ORIGIN=${JSON.stringify(origin)};\n${blocks[0][0]}
export default {async fetch(request, env) {
 const url=new URL(request.url);
 if(url.origin!==ORIGIN){
  const paths=${JSON.stringify([alias, programme, ...lookalikes])};
  if(!url.hostname.endsWith('.workers.dev')||!env.PREVIEW_TOKEN||request.headers.get(${JSON.stringify(previewHeader)})!==env.PREVIEW_TOKEN||
   !['GET','HEAD'].includes(request.method)||!paths.includes(url.pathname))return new Response(null,{status:404});
  const headers=new Headers({'Cache-Control':'no-cache', 'Cloudflare-Workers-Version-Overrides':${JSON.stringify(`${core}="${coreVersion}"`)}});
  request=new Request(ORIGIN+url.pathname+url.search,{method:request.method,headers});
 }
 const redirect=continuityAliasResponse(request);if(redirect)return redirect;
 const response=await env.CORE.fetch(request);
 if(request.method!=='GET'||url.pathname!==${JSON.stringify(programme)}||response.status!==200||
  !(response.headers.get('content-type')||'').includes('text/html'))return response;
 const before=await response.clone().text(),after=programmePublicLibraryLinks(before,url.pathname);
 if(after===before)return response;
 const headers=new Headers(response.headers);
 for(const name of ['Content-Length','Content-Encoding','ETag','Content-MD5','Digest'])headers.delete(name);
 return new Response(after,{status:response.status,statusText:response.statusText,headers});
}};\n`;
}

const scrub = html => html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, tag =>
 /^<script\b[^>]*\bsrc=["']https:\/\/static\.cloudflareinsights\.com\//i.test(tag) || /window\.__CF\$cv\$params/.test(tag) ? '' : tag);
const policyHeaders = ['cache-control', 'content-security-policy', 'content-type', 'location', 'referrer-policy',
 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'x-robots-tag'];
async function page(base, path, method = 'GET', secret) {
 const headers = {'Cache-Control': 'no-cache'};
 if (secret) headers[previewHeader] = secret;
 const response = await fetch(base + path, {method, redirect: 'manual', headers, signal: AbortSignal.timeout(35_000)});
 return {status: response.status, headers: Object.fromEntries(policyHeaders.map(name => [name, response.headers.get(name)])), body: await response.text()};
}
const fingerprint = ({body, ...response}) => ({...response, sha256: hash(scrub(body))});
async function protectedPages() {
 return Object.fromEntries(await Promise.all(protectedPaths.map(async path => [path, fingerprint(await page(origin, path))])));
}
async function verify(base, expected, before, secret) {
 const redirects = ['', query].flatMap(search => ['GET', 'HEAD'].map(method => [search, method]));
 for (const [search, method] of redirects) {
  const response = await page(base, alias + search, method, secret);
  assert.equal(response.status, 301, 'Retired URL did not return HTTP 301');
  assert.equal(response.headers.location, origin + destination + search, 'Retired URL changed its approved destination');
  assert.equal(response.body, '', 'Retired URL sent an unexpected body');
 }
 for (const search of ['', query]) {
  const response = fingerprint(await page(base, programme + search, 'GET', secret));
  if (secret) {
   // A workers.dev Version URL does not carry the site's zone-level headers.
   same([response.status, response.sha256], [expected[search].status, expected[search].sha256], 'Programme preview differs');
  } else same(response, expected[search], 'Live Programme differs from approved edits');
 }
 for (const path of lookalikes) {
  const response = fingerprint(await page(base, path, 'GET', secret));
  if (secret) same([response.status, response.sha256], [before[path].status, before[path].sha256], `Preview passthrough differs for ${path}`);
  else same(response, before[path], `Live passthrough differs for ${path}`);
 }
}
async function waitForEdge(check) {
 for (let retry = 0;; retry++) {
  try {await check();return;}
  catch (error) {
   if (retry === 3) throw error;
   await new Promise(resolve => setTimeout(resolve, 3500));
  }
 }
}

async function rollback() {
 const path = `${proof}/routes-created.json`;
 if (!existsSync(path)) return;
 const {zone, source: receiptSource, run: receiptRun, worker: receiptWorker, deploymentId, versionId, created, pending} = JSON.parse(readFileSync(path));
 same([receiptSource, receiptRun, receiptWorker], [source, run, worker], 'Route receipt belongs to a different release');
 assert(providerId.test(zone) && uuid.test(deploymentId) && uuid.test(versionId), 'Route receipt has invalid identities');
 const deployed = await latest(worker);
 same([deployed.id, deployed.versions[0].version_id], [deploymentId, versionId], 'Edge deployment changed. Refusing stale route rollback');
 const restored = [];
 for (const receipt of created.toReversed()) {
  assert(providerId.test(receipt.id) && patterns.includes(receipt.pattern) && receipt.script === worker, 'Invalid owned route receipt');
  const current = (await routes(zone)).find(route => route.id === receipt.id);
  if (!current) continue;
  same(current, receipt, 'Owned route changed. Refusing stale route rollback');
  await provider(`${routePath(zone)}/${receipt.id}`, {method: 'DELETE'});
  assert(!(await routes(zone)).some(route => route.id === receipt.id), 'Owned route was not removed');
  restored.push(receipt);
 }
 save('rollback', {removed: restored, pending});
 assert(!pending, 'A route creation request lacks an ownership receipt. Inspect it before manual rollback');
}

async function release() {
 assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
 mainLease();
 const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
 same([event.before, event.after], [previousAttempt, source], 'Unexpected edge release source');
 same(git('diff', '--name-only', previousAttempt, source).toString().trim().split('\n').sort(),
  ['.github/workflows/aeo-geo-technical.yml', 'aeo-geo/seo-campaign-release.mjs'], 'Unexpected edge release scope');
 const approved = git('show', `${approvedCommit}:${delivery}`);
 assert(readFileSync(delivery).equals(approved), 'Checkout differs from approved delivery source');
 const code = edgeSource(approved);
 await coreLease();
 const activeCore = await api(`${beta(core)}/versions/${coreVersion}`);
 assert.equal(activeCore.id, coreVersion, 'Unexpected captured Core version');
 assert(activeCore.assets != null || activeCore.bindings.some(binding => binding.type === 'assets'), 'Native asset fallback is unnecessary');
 assert(activeCore.usage_model == null || activeCore.usage_model === 'standard', 'Legacy Core usage model requires separate qualification');
 assert.match(activeCore.compatibility_date || '', /^\d{4}-\d{2}-\d{2}$/, 'Core compatibility date unavailable');
 const [zones, {subdomain}] = await Promise.all([provider(`/zones?name=${host}`), api('/workers/subdomain')]);
 assert(zones.length === 1 && zones[0].name === host && zones[0].account?.id === account && providerId.test(zones[0].id), 'Cloudflare zone unavailable');
 assert(/^[a-z0-9-]+$/.test(subdomain || ''), 'An existing workers.dev subdomain is required for version qualification');
 const zone = zones[0].id;
 const baseline = await routes(zone);
 checkOverlaps(baseline);
 const [aliasBefore, before] = await Promise.all([page(origin, alias), protectedPages()]);
 assert.equal(aliasBefore.status, 404, 'Retired URL already changed');
 assert.equal(before[destination].status, 200, 'Redirect destination is unavailable');
 const expected = {};
 for (const search of ['', query]) {
  const original = await page(origin, programme + search);
  const next = original.status === 200 && original.headers['content-type']?.includes('text/html')
   ? programmePublicLibraryLinks(original.body, programme) : original.body;
  if (!search) assert(original.status === 200 && next !== original.body, 'Programme already changed or no longer matches its approved source');
  expected[search] = fingerprint({...original, body: next});
 }
 save('before', {zone, baseline, before, expected, coreDeployment, coreVersion});

 const secret = randomBytes(32).toString('hex');
 const newWorker = await api('/workers/workers', json('POST', {name: worker, subdomain: {enabled: false, previews_enabled: true}}));
 assert.equal(newWorker.name, worker, 'Unexpected Worker creation');
 let staged;
 try {
  staged = await api(`${beta(worker)}/versions?deploy=false`, json('POST', {main_module: moduleName,
   compatibility_date: activeCore.compatibility_date, bindings: [{type: 'service', name: 'CORE', service: core},
    {type: 'secret_text', name: 'PREVIEW_TOKEN', text: secret}], modules: [{name: moduleName,
    content_type: 'application/javascript+module', content_base64: Buffer.from(code).toString('base64')}]}));
  assert(uuid.test(staged.id), 'Staged version identity absent');
  const reviewed = await api(`${beta(worker)}/versions/${staged.id}?include=modules`);
  assert.equal(reviewed.id, staged.id, 'Unexpected staged version');
  assert.equal(reviewed.main_module, moduleName, 'Unexpected staged entry');
  assert.equal(reviewed.compatibility_date, activeCore.compatibility_date, 'Unexpected staged compatibility date');
  assert(reviewed.usage_model == null || reviewed.usage_model === 'standard', 'Staged Worker has a legacy usage model');
  assert(reviewed.assets == null && reviewed.bindings.length === 2 && reviewed.bindings.some(b => b.name === 'CORE' && b.type === 'service' && b.service === core) &&
   reviewed.bindings.some(b => b.name === 'PREVIEW_TOKEN' && b.type === 'secret_text'), 'Unexpected staged bindings or assets');
  assert(reviewed.modules.length === 1 && reviewed.modules[0].name === moduleName &&
   reviewed.modules[0].content_type === 'application/javascript+module' && Buffer.from(reviewed.modules[0].content_base64, 'base64').equals(Buffer.from(code)), 'Staged source changed');
  const preview = `https://${staged.id.slice(0, 8)}-${worker}.${subdomain}.workers.dev`;
  assert(reviewed.urls?.some(value => value === preview || value === `${preview}/`), 'No exact staged Version URL was provided');
  await waitForEdge(async () => {
   assert.equal((await page(preview, programme)).status, 404, 'Staged URL is accessible without its release secret');
   await verify(preview, expected, before, secret);
  });
 } finally {
  const closed = await api(`${scriptPath(worker)}/subdomain`, json('POST', {enabled: false, previews_enabled: false}));
  same([closed.enabled, closed.previews_enabled], [false, false], 'Preview URL could not be disabled');
 }
 save('staged', {worker, versionId: staged.id, moduleSha256: hash(code), previewVerified: true, previewDisabled: true, routeWrites: 0});
 mainLease();
 await coreLease();
 await routeLease(zone, baseline);
 const deployment = await api(`${scriptPath(worker)}/deployments`, json('POST', {strategy: 'percentage', versions: [{version_id: staged.id, percentage: 100}]}));
 assert(uuid.test(deployment.id), 'New Worker deployment identity absent');
 const checkDeployment = async () => {
  const active = await latest(worker);
  same([active.id, active.versions[0].version_id], [deployment.id, staged.id], 'New Worker serving lease changed');
 };
 const receipt = {source, run, worker, zone, versionId: staged.id, deploymentId: deployment.id, created: [], pending: null};
 for (const pattern of patterns) {
  mainLease();
  await coreLease();
  await checkDeployment();
  await routeLease(zone, baseline, receipt.created);
  receipt.pending = pattern;
  save('routes-created', receipt);
  const route = await provider(routePath(zone), json('POST', {pattern, script: worker}));
  assert(providerId.test(route.id) && route.pattern === pattern && route.script === worker, 'Created route identity is uncertain');
  receipt.created.push({id: route.id, pattern, script: worker});
  receipt.pending = null;
  save('routes-created', receipt);
 }
 await waitForEdge(() => verify(origin, expected, before));
 same(await protectedPages(), before, 'Protected public responses changed');
 mainLease();
 await coreLease();
 await checkDeployment();
 await routeLease(zone, baseline, receipt.created);
 save('live-verification', {verified: true, source, run, worker, deploymentId: deployment.id, versionId: staged.id,
  coreDeployment, coreVersion, routes: receipt.created, protectedPaths, databaseWrites: 0});
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
 try {
  assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID, account);
  assert(token, 'Cloudflare release token is required');
  assert(/^\d+$/.test(run || '') && /^\d+$/.test(attempt || ''), 'Exact GitHub run and attempt required');
  if (process.argv[2] === 'rollback') await rollback();
  else {assert.equal(process.argv.length, 2, 'Unknown edge release mode');await release();}
 } catch (error) {
  save('failure', {message: error.message});
  console.error(error.message);
  process.exitCode = 1;
 }
}
