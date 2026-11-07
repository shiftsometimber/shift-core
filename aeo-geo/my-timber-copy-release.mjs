import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {activeDeployment} from './deployment.mjs';
import {hash} from './package.mjs';
import {publicSupportContinuityCopy} from './delivery.mjs';

const account = '9e5386dcf455be34c582d93f8bfc79e6';
const host = 'shiftsometimber.co.uk';
const origin = 'https://' + host;
const core = 'shift-core';
const presentation = 'shift-public-presentation-batch-20261022';
const faq = '/faq/does-sst-prescribe';
const query = '?utm_source=placement-verification';
const lookalike = faq + '-scope-probe';
const changed = ['/', faq, faq + query];
const unchanged = ['/' + query, '/programme', '/start-here', '/robots.txt', '/assets/shift-wordmark.png', '/faq/can-men-take-wegovy', lookalike];
const base = 'bb201fba85e9678dcee07924f4e4b0b5396c69b4';
const approvedHash = '168cc8415148b91d9a0dbe92774b991494f0d707c0c7dc97146fcf54493e235d';
const approvedFiles = ['.github/workflows/aeo-geo-technical.yml', 'aeo-geo/delivery.mjs', 'aeo-geo/my-timber-copy-release.mjs'];
const previewHeader = 'x-shift-placement-preview';
const moduleName = 'my-timber-copy-edge.mjs';
const proof = 'my-timber-copy-release-proof';
const {CLOUDFLARE_API_TOKEN: token, GITHUB_SHA: source, GITHUB_RUN_ID: run, GITHUB_RUN_ATTEMPT: attempt} = process.env;
const worker = 'shift-my-timber-copy-' + run + '-' + attempt;
const operations = [
 {pattern: origin + '/', owner: null},
 {pattern: origin + faq, owner: presentation},
 {pattern: origin + faq + '*', owner: null}
];

const json = (method, body) => ({method, headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
const git = (...args) => execFileSync('git', args, {encoding: 'utf8', stdio: 'pipe'}).trim();
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const providerId = /^[a-f0-9]{32}$/;
const versionPath = name => '/workers/workers/' + name + '/versions';
const scriptPath = name => '/workers/scripts/' + name;
const routePath = zone => '/zones/' + zone + '/workers/routes';

function save(name, value) {
 mkdirSync(proof, {recursive: true});
 const path = proof + '/' + name + '.json';
 writeFileSync(path + '.tmp', JSON.stringify(value, null, 2));
 renameSync(path + '.tmp', path);
}
async function provider(path, init = {}) {
 const response = await fetch('https://api.cloudflare.com/client/v4' + path, {
  ...init, headers: {Authorization: 'Bearer ' + token, ...init.headers}, signal: AbortSignal.timeout(50000)
 });
 const data = await response.json();
 assert(response.ok && data.success, (init.method || 'GET') + ' ' + path + ' returned ' + response.status + ' (' + (data.errors?.map(e => e.code).join(', ') || 'no error code') + ')');
 return data.result;
}
const api = (path, init) => provider('/accounts/' + account + path, init);
async function latest(name) {
 const {deployments} = await api(scriptPath(name) + '/deployments');
 return activeDeployment(deployments.toSorted((a, b) => b.created_on.localeCompare(a.created_on))[0]);
}
async function routes(zone) {
 return (await provider(routePath(zone))).map(({id, pattern, script}) => ({id, pattern, script: script || null}))
  .sort((a, b) => a.id.localeCompare(b.id));
}
function mainLease() {
 assert.equal(process.env.GITHUB_REF, 'refs/heads/main');
 assert.match(source || '', /^[a-f0-9]{40}$/);
 assert.equal(git('rev-parse', 'HEAD'), source);
 git('fetch', '--no-tags', 'origin', '+refs/heads/main:refs/remotes/origin/main');
 assert.equal(git('rev-parse', 'origin/main'), source, 'Main moved; preserve the newer release');
}
function checkOverlaps(baseline) {
 for (const route of baseline) {
  const [, scheme, domain, path = '/'] = route.pattern.match(/^(?:(https?):\/\/)?([^/]+)(\/.*)?$/) || [];
  assert(domain, 'Unrecognised Worker route');
  if (scheme === 'http' || (domain.startsWith('*') ? !host.endsWith(domain.slice(1).toLowerCase()) : host !== domain.toLowerCase())) continue;
  const wildcard = path.endsWith('*');
  const prefix = wildcard ? path.slice(0, -1) : path;
  if (prefix !== '/' && !prefix.startsWith(faq) && !(wildcard && faq.startsWith(prefix))) continue;
  if (route.pattern === origin + faq && route.script === presentation) continue;
  assert(wildcard && prefix === '/' && route.script === core, 'Unexpected public route overlap: ' + route.pattern);
 }
 return operations.map(operation => {
  const existing = baseline.filter(route => route.pattern === operation.pattern);
  if (operation.owner) assert(existing.length === 1 && existing[0].script === operation.owner, 'FAQ owner changed');
  else assert.equal(existing.length, 0, 'A scoped route is already assigned: ' + operation.pattern);
  return {...operation, before: existing[0] || null};
 });
}

export function edgeSource(versions) {
 return [
  publicSupportContinuityCopy.toString(),
  'const ORIGIN=' + JSON.stringify(origin) + ', FAQ=' + JSON.stringify(faq) + ';',
  'const LOOKALIKE=' + JSON.stringify(lookalike) + ', PREVIEW_HEADER=' + JSON.stringify(previewHeader) + ';',
  'const CORE_OVERRIDE=' + JSON.stringify(core + '="' + versions.CORE + '"') + ';',
  'const FAQ_OVERRIDE=' + JSON.stringify(presentation + '="' + versions.FAQ + '"') + ';',
  'export default {async fetch(request,env){',
  ' const url=new URL(request.url);',
  ' const approved=(url.pathname==="/"&&!url.search)||url.pathname===FAQ;',
  ' const faqOwner=url.pathname===FAQ&&!url.search;',
  ' const upstream=faqOwner?env.FAQ:env.CORE;',
  ' if(url.origin!==ORIGIN){',
  '  if(!url.hostname.endsWith(".workers.dev")||!env.PREVIEW_TOKEN||request.headers.get(PREVIEW_HEADER)!==env.PREVIEW_TOKEN||',
  '   !["GET","HEAD"].includes(request.method)||(!approved&&url.pathname!==LOOKALIKE))return new Response(null,{status:404});',
  '  const headers=new Headers({"Cache-Control":"no-cache","Cloudflare-Workers-Version-Overrides":faqOwner?FAQ_OVERRIDE:CORE_OVERRIDE});',
  '  request=new Request(ORIGIN+url.pathname+url.search,{method:request.method,headers});',
  ' }',
  ' if(!approved||request.method!=="GET")return upstream.fetch(request);',
  ' const headers=new Headers(request.headers);',
  ' for(const name of ["If-None-Match","If-Modified-Since"])headers.delete(name);',
  ' const response=await upstream.fetch(new Request(request,{headers}));',
  ' if(response.status!==200||!(response.headers.get("content-type")||"").includes("text/html"))return response;',
  ' const before=await response.clone().text(),after=publicSupportContinuityCopy(before,url.pathname);',
  ' if(after===before)return response;',
  ' const result=new Headers(response.headers);',
  ' for(const name of ["Content-Length","Content-Encoding","ETag","Last-Modified","Content-MD5","Digest"])result.delete(name);',
  ' return new Response(after,{status:response.status,statusText:response.statusText,headers:result});',
  '}};'
 ].join('\n');
}

const policies = ['cache-control', 'content-security-policy', 'content-type', 'location', 'referrer-policy',
 'strict-transport-security', 'x-content-type-options', 'x-frame-options', 'x-robots-tag'];
async function page(path, url = origin, method = 'GET', secret) {
 const headers = {'Cache-Control': 'no-cache'};
 if (secret) headers[previewHeader] = secret;
 const response = await fetch(url + path, {method, redirect: 'manual', headers, signal: AbortSignal.timeout(35000)});
 return {status: response.status, headers: Object.fromEntries(policies.map(name => [name, response.headers.get(name)])), body: Buffer.from(await response.arrayBuffer())};
}
function fingerprint({body, ...response}) {
 if (response.headers['content-type']?.includes('text/html')) {
  body = body.toString().replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, tag =>
   /^<script\b[^>]*\bsrc=["']https:\/\/static\.cloudflareinsights\.com\//i.test(tag) || /window\.__CF\$cv\$params/.test(tag) ? '' : tag);
 }
 return {...response, sha256: hash(body)};
}
async function snapshots(paths) {
 return Object.fromEntries(await Promise.all(paths.map(async path => [path, fingerprint(await page(path))])));
}
async function settle(check) {
 for (let retry = 0;; retry++) {
  try { await check(); return; }
  catch (error) {
   if (retry === 3) throw error;
   await new Promise(resolve => setTimeout(resolve, 3500));
  }
 }
}
const identify = ({id, versions}) => [id, versions[0].version_id];
const routeData = ({pattern, script}) => ({pattern, script});

async function rollback() {
 const file = proof + '/routing-receipt.json';
 if (!existsSync(file)) return;
 const receipt = JSON.parse(readFileSync(file));
 assert.deepEqual([receipt.source, receipt.run, receipt.worker], [source, run, worker], 'Rollback ownership mismatch');
 assert(providerId.test(receipt.zone));
 assert.deepEqual(receipt.plan.map(({pattern, owner}) => ({pattern, owner})), operations);
 assert.deepEqual(identify(await latest(worker)), receipt.deployment, 'Scoped Worker deployment changed');
 const restored = [];
 for (const item of receipt.plan.toReversed()) {
  const current = (await routes(receipt.zone)).find(route => route.pattern === item.pattern);
  if (current?.script !== worker) {
   assert.deepEqual(current || null, item.before, 'Another owner changed the route: ' + item.pattern);
   continue;
  }
  assert(providerId.test(current.id), 'Invalid owned route identity');
  const path = routePath(receipt.zone) + '/' + current.id;
  if (item.before) {
   assert.equal(current.id, item.before.id);
   await provider(path, json('PUT', routeData(item.before)));
  } else {
   await provider(path, {method: 'DELETE'});
  }
  assert.deepEqual((await routes(receipt.zone)).find(route => route.pattern === item.pattern) || null, item.before);
  restored.push(item.pattern);
 }
 save('rollback', {restored});
}

async function release() {
 assert.equal(process.env.GITHUB_EVENT_NAME, 'push');
 mainLease();
 const {before, after} = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
 assert.deepEqual([before, after], [base, source]);
 assert.deepEqual(git('diff', '--name-only', base, source).split('\n').sort(), approvedFiles);
 assert.equal(hash(readFileSync('aeo-geo/delivery.mjs')), approvedHash, 'Copy differs from the reviewed mockups');
 const [coreBefore, faqBefore, zones, {subdomain}] = await Promise.all([
  latest(core), latest(presentation), provider('/zones?name=' + host), api('/workers/subdomain')
 ]);
 assert.deepEqual(identify(coreBefore), ['9e15801e-59a9-4bd6-b8d9-13a3adcf76a7', '36d0c04b-bb34-4c05-81ac-27e20a958756'], 'Core changed since read-only qualification');
 assert(zones.length === 1 && zones[0].name === host && zones[0].account?.id === account && providerId.test(zones[0].id));
 assert.match(subdomain || '', /^[a-z0-9-]+$/);
 const zone = zones[0].id;
 const baseline = await routes(zone);
 const plan = checkOverlaps(baseline);
 const ownerLease = async () => {
  assert.deepEqual((await Promise.all([latest(core), latest(presentation)])).map(identify), [coreBefore, faqBefore].map(identify), 'An origin owner moved');
 };
 const protectedBefore = await snapshots(unchanged);
 const expected = {};
 const head = {};
 for (const path of changed) {
  const original = await page(path);
  assert.equal(original.status, 200);
  const body = publicSupportContinuityCopy(original.body.toString(), new URL(origin + path).pathname);
  assert.notEqual(body, original.body.toString(), 'Approved paragraph moved or was already changed: ' + path);
  expected[path] = fingerprint({...original, body});
  head[path] = fingerprint(await page(path, origin, 'HEAD'));
 }
 const code = edgeSource({CORE: identify(coreBefore)[1], FAQ: identify(faqBefore)[1]});
 const metadata = await api(versionPath(core) + '/' + identify(coreBefore)[1]);
 assert.match(metadata.compatibility_date || '', /^\d{4}-\d{2}-\d{2}$/);
 save('before', {zone, owners: [coreBefore, faqBefore].map(identify), plan, expected, protectedBefore});

 const secret = randomBytes(32).toString('hex');
 const newWorker = await api('/workers/workers', json('POST', {name: worker, subdomain: {enabled: false, previews_enabled: true}}));
 assert.equal(newWorker.name, worker);
 let staged;
 try {
  const bindings = [{type: 'service', name: 'CORE', service: core}, {type: 'service', name: 'FAQ', service: presentation}];
  staged = await api(versionPath(worker) + '?deploy=false', json('POST', {
   main_module: moduleName, compatibility_date: metadata.compatibility_date,
   bindings: [...bindings, {type: 'secret_text', name: 'PREVIEW_TOKEN', text: secret}],
   modules: [{name: moduleName, content_type: 'application/javascript+module', content_base64: Buffer.from(code).toString('base64')}]
  }));
  assert(uuid.test(staged.id));
  const verified = await api(versionPath(worker) + '/' + staged.id + '?include=modules');
  assert.equal(verified.main_module, moduleName);
  assert.equal(verified.compatibility_date, metadata.compatibility_date);
  assert(verified.assets == null && verified.bindings.length === 3);
  assert.deepEqual(verified.bindings.filter(binding => binding.type === 'service').map(({type, name, service}) => ({type, name, service})).sort((a,b) => a.name.localeCompare(b.name)), bindings);
  assert(verified.bindings.some(binding => binding.type === 'secret_text' && binding.name === 'PREVIEW_TOKEN'));
  assert(verified.modules.length === 1 && verified.modules[0].name === moduleName && Buffer.from(verified.modules[0].content_base64, 'base64').equals(Buffer.from(code)));
  const preview = 'https://' + staged.id.slice(0, 8) + '-' + worker + '.' + subdomain + '.workers.dev';
  assert(verified.urls?.some(url => url === preview || url === preview + '/'));
  await settle(async () => {
   assert.equal((await page('/', preview)).status, 404);
   for (const [path, target] of Object.entries({...expected, [lookalike]: protectedBefore[lookalike]})) {
    const actual = fingerprint(await page(path, preview, 'GET', secret));
    assert.deepEqual([actual.status, actual.sha256], [target.status, target.sha256], 'Staged document differs: ' + path);
   }
  });
 } finally {
  const closed = await api(scriptPath(worker) + '/subdomain', json('POST', {enabled: false, previews_enabled: false}));
  assert.deepEqual([closed.enabled, closed.previews_enabled], [false, false]);
 }
 save('staged', {worker, versionId: staged.id, previewVerified: true, previewDisabled: true});
 mainLease();
 await ownerLease();
 assert.deepEqual(await routes(zone), baseline, 'Routes changed before promotion');
 const deployment = await api(scriptPath(worker) + '/deployments', json('POST', {strategy: 'percentage', versions: [{version_id: staged.id, percentage: 100}]}));
 assert(uuid.test(deployment.id));
 const deployed = [deployment.id, staged.id];
 save('routing-receipt', {source, run, zone, worker, plan, deployment: deployed});
 let scopedRoutes = baseline;
 for (const item of plan) {
  mainLease();
  await ownerLease();
  assert.deepEqual(identify(await latest(worker)), deployed);
  assert.deepEqual(await routes(zone), scopedRoutes, 'Routes changed during placement release');
  const path = routePath(zone) + (item.before ? '/' + item.before.id : '');
  const route = await provider(path, json(item.before ? 'PUT' : 'POST', {pattern: item.pattern, script: worker}));
  assert(providerId.test(route.id) && (!item.before || route.id === item.before.id));
  assert.deepEqual(routeData(route), {pattern: item.pattern, script: worker});
  scopedRoutes = [...scopedRoutes.filter(existing => existing.pattern !== item.pattern), {id: route.id, ...routeData(route)}].sort((a,b) => a.id.localeCompare(b.id));
 }
 await settle(async () => {
  assert.deepEqual(await snapshots(changed), expected, 'Live placement differs from the approved text');
  for (const path of changed) assert.deepEqual(fingerprint(await page(path, origin, 'HEAD')), head[path], 'HEAD response changed: ' + path);
 });
 assert.deepEqual(await snapshots(unchanged), protectedBefore, 'A protected response changed');
 mainLease();
 await ownerLease();
 assert.deepEqual(identify(await latest(worker)), deployed);
 assert.deepEqual(await routes(zone), scopedRoutes);
 const result = {verified: true, source, run, worker, deploymentId: deployment.id, versionId: staged.id,
  changed, preserved: unchanged, homepageQueryCopy: false, coreVersion: identify(coreBefore)[1], approvedModuleSha256: approvedHash};
 save('live-verification', result);
 console.log('PLACEMENT_LIVE ' + JSON.stringify(result));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
 try {
  assert.equal(process.env.CLOUDFLARE_ACCOUNT_ID, account);
  assert(token && /^\d+$/.test(run || '') && /^\d+$/.test(attempt || ''), 'Exact authenticated release required');
  if (process.argv[2] === 'rollback') await rollback();
  else { assert.equal(process.argv.length, 2); await release(); }
 } catch (error) {
  save('failure', {message: error.message});
  console.error(error.message);
  process.exitCode = 1;
 }
}
