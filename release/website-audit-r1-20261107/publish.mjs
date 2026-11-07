import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { applyWebsiteAuditCopy } from './reviewed-copy.mjs';

const origin = 'https://shiftsometimber.co.uk';
const host = new URL(origin).hostname;
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const source = process.env.GITHUB_SHA;
const run = process.env.GITHUB_RUN_ID;
const attempt = process.env.GITHUB_RUN_ATTEMPT;
const worker = 'shift-website-audit-r1-' + run + '-' + attempt;
const prefix = '/accounts/' + account + '/workers';
const previewHeader = 'x-shift-website-audit-preview';
const moduleName = 'website-audit-edge.mjs';
const proof = 'website-audit-revision-1-proof';
const patchHash = 'd0e43bdf16449f3ccd7888012d0de58c909ffb9a2c58d8f6f082dfbc15d6e49c';
const copyHash = 'a92368bbe3f54464deac1706dffa1a45274bc8a7a530cdb1a13b76ed8124a8b2';
const scope = ['/', '/shift-health/blood-tests', '/llms.txt'];
const protectedPaths = ['/faq/does-sst-prescribe', '/recipes', '/exercises', '/knowledge', '/sitemap.xml', '/robots.txt'];
const routeId = /^[a-f0-9]{32}$/;
const uuid = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
const routeList = zone => '/zones/' + zone + '/workers/routes';
const deployments = name => prefix + '/scripts/' + name + '/deployments';
const versions = name => prefix + '/workers/' + name + '/versions';
const sha = value => createHash('sha256').update(value).digest('hex');
const withJson = (method, value) => ({method, headers:{'content-type':'application/json'}, body:JSON.stringify(value)});
const spec = ({pattern, script}) => ({pattern, script});

function save(name, value) {
  mkdirSync(proof, {recursive:true});
  const target = proof + '/' + name + '.json';
  writeFileSync(target + '.tmp', JSON.stringify(value, null, 2) + '\n');
  renameSync(target + '.tmp', target);
}

async function cf(path, init = {}) {
  const res = await fetch('https://api.cloudflare.com/client/v4' + path, {
    ...init, headers:{Authorization:'Bearer ' + token, ...init.headers},
    signal: AbortSignal.timeout(50000)
  });
  const data = await res.json();
  assert(res.ok && data.success, init.method + ' ' + path + ' returned ' + res.status + ' (' + data.errors?.map(e=>e.code).join(', ') + ')');
  return data.result;
}

async function routeTable(zone) {
  return (await cf(routeList(zone))).map(({id, pattern, script})=>({id,pattern,script:script??null})).sort((a,b)=>a.id.localeCompare(b.id));
}

async function active(name) {
  const list = (await cf(deployments(name))).deployments;
  const head = list.toSorted((a,b)=>Date.parse(b.created_on)-Date.parse(a.created_on))[0];
  assert(head && uuid.test(head.id) && head.versions.length===1 && head.versions[0].percentage===100 && uuid.test(head.versions[0].version_id), 'Owner has no single stable active version: ' + name);
  return {name, deploymentId:head.id, versionId:head.versions[0].version_id};
}

function toRoute(pattern) {
  const parsed = /^(?:(https?):\/\/)?([^/]+)(\/.*)?$/.exec(pattern);
  assert(parsed, 'Unknown route pattern: ' + pattern);
  return {scheme:parsed[1], domain:parsed[2], path:parsed[3]??'/*'};
}

function findOwner(path, routes) {
  const eligible = [];
  for (const route of routes) {
    const {scheme, domain, path:pattern} = toRoute(route.pattern);
    if (scheme==='http') continue;
    const suffix = domain.startsWith('*') ? domain.slice(1) : '';
    const domainMatches = suffix ? host.endsWith(suffix) : domain===host;
    const pathMatches = pattern.endsWith('*') ? path.startsWith(pattern.slice(0,-1)) : pattern===path;
    if (!domainMatches || !pathMatches) continue;
    const score = (domain===host ? 10000 : suffix.length) + pattern.length * 10 + (pattern.endsWith('*') ? -10 : 2) + (scheme==='https' ? 1 : 0);
    eligible.push({route, score});
  }
  eligible.sort((a,b)=>b.score-a.score);
  assert(eligible[0]?.route.script && eligible[0].score!==eligible[1]?.score,'Ambiguous or disabled route for ' + path);
  return eligible[0].route;
}

async function readPage(path, {site=origin, method='GET', secret}={}) {
  const headers = {'cache-control':'no-cache'};
  if (secret) headers[previewHeader] = secret;
  const res = await fetch(site + path, {method, headers, redirect:'manual', signal:AbortSignal.timeout(35000)});
  const policy = Object.fromEntries(['cache-control','content-security-policy','content-type','location','referrer-policy','strict-transport-security','x-content-type-options','x-frame-options','x-robots-tag'].map(k=>[k,res.headers.get(k)]));
  return {status:res.status, policy, body:await res.text()};
}

function fingerprint({status,policy,body}) {
  const normalized = policy['content-type']?.includes('text/html') ? body.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, tag=>
    /^<script\b[^>]*\bsrc=["']https:\/\/static\.cloudflareinsights\.com\//i.test(tag) || /window\.__CF\$cv\$params/.test(tag) ? '' : tag) : body;
  return {status,policy,sha256:sha(normalized)};
}

async function settle(check) {
  for (let n=0; n<5; n++) {
    try { return await check(); } catch (error) {
      if (n===4) throw error;
      await new Promise(resolve=>setTimeout(resolve, 2800));
    }
  }
}

async function readProtected() {
  return Object.fromEntries(await Promise.all(protectedPaths.map(async path=>[path,fingerprint(await readPage(path))])));
}

function confirmText(path, text) {
  if (path==='/') {
    assert.equal(text.split('<p class="sst-free-browse"><a href="/recipes">Browse recipes</a><a href="/exercises">Browse exercises</a></p>').length, 2);
    assert(text.indexOf('class="sst-free-features"') < text.indexOf('class="sst-free-browse"'));
    assert(text.indexOf('class="sst-free-browse"') < text.indexOf('class="sst-free-promise"'));
  } else if (path==='/shift-health/blood-tests') {
    for (const panel of ['baseline','advanced','complete']) {
      assert.equal(text.split('/shift-health/blood-tests/' + panel + '/your-test">Preview this test').length, 2);
    }
    assert.equal(text.split('Ordering is closed. This is a preview.').length, 4);
    assert(!text.includes('Choose this test'));
  } else {
    assert.equal(text.split('[Knowledge](https://shiftsometimber.co.uk/knowledge)').length, 2);
    assert.equal(text.split('You can use My Timber free alongside your own clinic and keep using it after treatment ends.').length, 2);
    assert(!text.includes('[Explore knowledge](https://shiftsometimber.co.uk/explore-knowledge)'));
  }
}

function buildEdge(owners, reviewedCode) {
  const routing = JSON.stringify(Object.fromEntries(owners.map(({path,binding,owner,versionId})=>[path,{binding,owner,versionId}])));
  return reviewedCode + '\nconst ROUTING=' + routing + ';\nconst ORIGIN=' + JSON.stringify(origin) + ';\nconst PREVIEW_HEADER=' + JSON.stringify(previewHeader) + ';\n' + `
export default {async fetch(request, env) {
  const url = new URL(request.url);
  const route = ROUTING[url.pathname];
  if (!route) return new Response(null,{status:404});
  const upstream = env[route.binding];
  if (url.hostname !== new URL(ORIGIN).hostname) {
    if (!url.hostname.endsWith('.workers.dev') || !env.PREVIEW_TOKEN ||
        request.headers.get(PREVIEW_HEADER) !== env.PREVIEW_TOKEN || !['GET','HEAD'].includes(request.method)) {
      return new Response(null,{status:404});
    }
    const headers = new Headers({'Cache-Control':'no-cache','Cloudflare-Workers-Version-Overrides':route.owner+'="'+route.versionId+'"'});
    request = new Request(ORIGIN + url.pathname + url.search, {method:request.method,headers});
  }
  if (url.protocol !== 'https:' || url.search || !['GET','HEAD'].includes(request.method)) return upstream.fetch(request);
  const headers = new Headers(request.headers);
  for (const name of ['If-None-Match','If-Modified-Since']) headers.delete(name);
  const response = await upstream.fetch(new Request(request,{headers}));
  if (response.status !== 200) return response;
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes(url.pathname==='/llms.txt' ? 'text/plain' : 'text/html')) return response;
  if (request.method === 'HEAD') {
    const head = new Headers(response.headers);
    for (const name of ['Content-Length','ETag','Last-Modified','Content-MD5','Digest']) head.delete(name);
    return new Response(null,{status:response.status,statusText:response.statusText,headers:head});
  }
  const before = await response.clone().text();
  const after = applyWebsiteAuditCopy(url.pathname,before);
  if (before === after) return response;
  const edited = new Headers(response.headers);
  for (const name of ['Content-Length','Content-Encoding','ETag','Last-Modified','Content-MD5','Digest']) edited.delete(name);
  return new Response(after,{status:response.status,statusText:response.statusText,headers:edited});
}};
`;
}

async function rollback() {
  const file = proof + '/routing.json';
  if (!existsSync(file)) return;
  const receipt = JSON.parse(readFileSync(file));
  assert.deepEqual([receipt.source,receipt.run,receipt.worker],[source,run,worker]);
  assert.deepEqual(receipt.plan.map(row=>row.path),scope);
  assert(routeId.test(receipt.zone));
  assert.deepEqual(await active(worker),receipt.deployment,'Owned preview Worker moved');
  const restored = [];
  for (const item of receipt.plan.toReversed()) {
    const route = (await routeTable(receipt.zone)).find(r=>r.pattern===item.pattern);
    if (route?.script!==worker) {
      assert.deepEqual(route??null,item.before,'Route ownership changed independently: ' + item.pattern);
      continue;
    }
    assert(routeId.test(route.id) && (!item.before || item.before.id===route.id));
    const endpoint=routeList(receipt.zone)+'/'+route.id;
    if (item.before) await cf(endpoint,withJson('PUT',spec(item.before)));
    else await cf(endpoint,{method:'DELETE'});
    assert.deepEqual((await routeTable(receipt.zone)).find(r=>r.pattern===item.pattern)??null,item.before);
    restored.push(item.pattern);
  }
  save('rollback',{restored});
}

async function publish() {
  const reviewed = readFileSync(new URL('./reviewed-copy.mjs',import.meta.url),'utf8');
  assert.equal(sha(reviewed),copyHash,'Runtime copy module differs from the approved revision');
  const [zones,{subdomain}] = await Promise.all([cf('/zones?name=' + host),cf(prefix+'/subdomain')]);
  assert(zones.length===1 && zones[0].name===host && zones[0].account?.id===account && routeId.test(zones[0].id),'Production zone mismatch');
  assert.match(subdomain,/^[a-z0-9-]+$/);
  const zone = zones[0].id;
  const baseline = await routeTable(zone);
  const plan = scope.map(path=>{
    const owner = findOwner(path,baseline);
    const p = toRoute(owner.pattern);
    const exact = p.domain===host && p.path===path;
    return {path,owner:owner.script,pattern:exact ? owner.pattern : origin + path,before:exact ? owner : null};
  });
  assert(plan.every(p=>/^shift-[a-z0-9-]+$/.test(p.owner)),'Unexpected service owner');
  assert.equal(new Set(plan.map(r=>r.pattern)).size,scope.length);
  const plannedAdditions=plan.filter(row=>!row.before).length;
  assert(baseline.length+plannedAdditions<=1000, 'Cloudflare route count would exceed 1000');
  const allOwners = [...new Set(plan.map(row=>row.owner))];
  const owners = await Promise.all(allOwners.map(active));
  const lease = async () => assert.deepEqual(await Promise.all(allOwners.map(active)),owners,'A serving source changed during the release');
  const bindings = owners.map(({name}, i)=>({type:'service',name:'ORIGIN_'+i,service:name}));
  const mapping = plan.map(row=>{
    const i=allOwners.indexOf(row.owner);
    return {path:row.path,owner:row.owner,binding:bindings[i].name,versionId:owners[i].versionId};
  });

  const baselineResponses = await Promise.all(scope.map(path=>readPage(path)));
  const expected = {};
  for (const [i,path] of scope.entries()) {
    const before=baselineResponses[i];
    assert.equal(before.status,200);
    const after=applyWebsiteAuditCopy(path,before.body);
    assert.notEqual(after,before.body,'Approved baseline absent or already changed: '+path);
    confirmText(path,after);
    expected[path]=fingerprint({...before,body:after});
  }
  const protectedBefore = await readProtected();
  save('before',{scope,patchHash,copyHash,source,zone,routeCount:baseline.length,plan,owners,expected,protectedBefore});
  console.log('WEBSITE_AUDIT_PREFLIGHT '+JSON.stringify({routeCount:baseline.length,plan,owners}));

  const code = buildEdge(mapping,reviewed);
  const codeHash = sha(code);
  const secret = randomBytes(32).toString('hex');
  const created = await cf(prefix+'/workers',withJson('POST',{name:worker,subdomain:{enabled:false,previews_enabled:true}}));
  assert.equal(created.name,worker);
  let version;
  try {
    version = await cf(versions(worker)+'?deploy=false',withJson('POST',{
      main_module:moduleName, compatibility_date:'2026-08-09',
      bindings:[...bindings,{type:'secret_text',name:'PREVIEW_TOKEN',text:secret}],
      modules:[{name:moduleName,content_type:'application/javascript+module',content_base64:Buffer.from(code).toString('base64')}]
    }));
    assert(uuid.test(version.id));
    const receipt = await cf(versions(worker)+'/'+version.id+'?include=modules');
    assert.equal(receipt.main_module,moduleName);
    assert.equal(receipt.modules.length,1);
    assert.equal(sha(Buffer.from(receipt.modules[0].content_base64,'base64')),codeHash);
    assert.deepEqual(receipt.bindings.filter(b=>b.type==='service').map(({type,name,service})=>({type,name,service})).sort((a,b)=>a.name.localeCompare(b.name)),bindings);
    assert(receipt.bindings.some(b=>b.type==='secret_text'&&b.name==='PREVIEW_TOKEN')&&receipt.assets==null);
    const preview='https://'+version.id.slice(0,8)+'-'+worker+'.'+subdomain+'.workers.dev';
    assert(receipt.urls?.some(url=>url===preview||url===preview+'/'));
    await settle(async ()=>{
      assert.equal((await readPage('/',{site:preview})).status,404);
      for (const path of scope) {
        const result=await readPage(path,{site:preview,secret});
        confirmText(path,result.body);
        assert.deepEqual(fingerprint(result),expected[path],'Staged GET differs: ' + path);
        const head=await readPage(path,{site:preview,secret,method:'HEAD'});
        assert.equal(head.status,200,'Staged HEAD not healthy: '+path);
        assert.equal(head.body,'','HEAD has a body: '+path);
      }
    });
  } finally {
    const closed=await cf(prefix+'/scripts/'+worker+'/subdomain',withJson('POST',{enabled:false,previews_enabled:false}));
    assert.deepEqual([closed.enabled,closed.previews_enabled],[false,false]);
  }

  save('staged',{worker,versionId:version.id,codeHash,previewVerified:true,previewDisabled:true});
  await lease();
  assert.deepEqual(await routeTable(zone),baseline,'Production routing moved before promotion');
  const deployed=await cf(deployments(worker),withJson('POST',{strategy:'percentage',versions:[{version_id:version.id,percentage:100}]}));
  assert(uuid.test(deployed.id));
  const deployment={name:worker,deploymentId:deployed.id,versionId:version.id};
  save('routing',{source,run,zone,worker,plan,deployment});
  let current = baseline;
  for (const item of plan) {
    await lease();
    assert.deepEqual(await active(worker),deployment);
    assert.deepEqual(await routeTable(zone),current,'Production routing changed during promotion');
    const endpoint=routeList(zone)+(item.before?'/'+item.before.id:'');
    const changed=await cf(endpoint,withJson(item.before?'PUT':'POST',{pattern:item.pattern,script:worker}));
    assert(routeId.test(changed.id) && (!item.before || changed.id===item.before.id));
    assert.deepEqual(spec(changed),{pattern:item.pattern,script:worker});
    current=[...current.filter(r=>r.pattern!==item.pattern),{id:changed.id,...spec(changed)}].sort((a,b)=>a.id.localeCompare(b.id));
  }

  await settle(async ()=>{
    for (const path of scope) {
      const result=await readPage(path);
      confirmText(path,result.body);
      assert.deepEqual(fingerprint(result),expected[path],'Public response differs: '+path);
      const head=await readPage(path,{method:'HEAD'});
      assert.equal(head.status,200,'Public HEAD not healthy: '+path);
      assert.equal(head.body,'','HEAD has a body: '+path);
    }
    assert.deepEqual(await readProtected(),protectedBefore,'A preservation route changed');
  });
  await lease();
  assert.deepEqual(await active(worker),deployment);
  assert.deepEqual(await routeTable(zone),current);
  const receipt={verified:true,scope,protectedPaths,source,run,patchHash,codeHash,deployment,plan,rollback:'Restore or remove only the three owned routes using routing.json.'};
  save('verified',receipt);
  console.log('WEBSITE_AUDIT_REVISION_1_LIVE '+JSON.stringify(receipt));
}

try {
  assert(process.env.GITHUB_REF==='refs/heads/release/website-audit-revision-1-20261107');
  assert(account && token && /^\d+$/.test(run) && /^\d+$/.test(attempt) && /^[a-f0-9]{40}$/.test(source));
  if (process.argv[2]==='rollback') await rollback();
  else await publish();
} catch (error) {
  save('failure',{message:error.message});
  console.error(error.message);
  process.exitCode=1;
}
