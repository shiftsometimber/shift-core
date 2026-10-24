import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const aliases = new Map([
  ['/treatments', '/treatment-centre'],
  ['/help-centre', '/help'],
  ['/waiting-list', '/waiting-list-journey'],
  ['/blog', '/explore-knowledge'],
  ['/newsroom', '/shift-newsroom'],
  ['/guides/mounjaro-ultimate-uk-guide', '/mounjaro'],
]);
const hosts = ['shiftsometimber.co.uk', 'www.shiftsometimber.co.uk'];
const methods = ['GET', 'HEAD'];
const expectedHomepageSHA = '960326ddb022efae0f5c2b0a725da1ba31218c027050b87151c7cd8c8f06fe69';
const headers = {'user-agent': 'SST release acceptance 2026-10-24'};

async function request(url, method, redirect = 'manual') {
  const response = await fetch(url, {method, redirect, headers});
  const bytes = method === 'HEAD' ? Buffer.alloc(0) : Buffer.from(await response.arrayBuffer());
  return {response, bytes};
}
async function follow(url, method) {
  let current = url;
  const chain = [];
  for (let i = 0; i < 6; i++) {
    const {response} = await request(current, method);
    chain.push({url: current, status: response.status, location: response.headers.get('location')});
    if (![301, 302, 303, 307, 308].includes(response.status)) return {chain, finalURL: current, finalStatus: response.status};
    const location = response.headers.get('location');
    assert(location, `missing Location for ${current}`);
    current = new URL(location, current).href;
  }
  throw new Error(`redirect loop or excessive chain: ${url}`);
}

const redirectChecks = [];
for (const [source, target] of aliases) {
  for (const host of hosts) {
    for (const slash of [false, true]) {
      for (const query of [false, true]) {
        for (const method of methods) {
          const suffix = slash ? '/' : '';
          const search = query ? '?sst_accept=www-rule' : '';
          const url = `https://${host}${source}${suffix}${search}`;
          const expected = `https://shiftsometimber.co.uk${target}${search}`;
          const result = await follow(url, method);
          assert.equal(result.chain[0].status, 301, `${method} ${url} initial status`);
          assert.equal(result.chain[0].location, expected, `${method} ${url} Location`);
          assert.equal(result.chain.length, 2, `${method} ${url} must use one redirect`);
          assert.equal(result.finalStatus, 200, `${method} ${url} final status`);
          assert.equal(result.finalURL, expected, `${method} ${url} final URL`);
          redirectChecks.push({method, url, expected, ...result});
        }
      }
    }
  }
}

const nonMatchChecks = [];
for (const source of aliases.keys()) {
  for (const variant of [
    {method: 'GET', path: `${source}/not-the-alias`, query: '?sst_nonmatch=nested'},
    {method: 'POST', path: source, query: '?sst_nonmatch=method'},
  ]) {
    const url = `https://www.shiftsometimber.co.uk${variant.path}${variant.query}`;
    const {response} = await request(url, variant.method);
    const expectedLocation = `https://shiftsometimber.co.uk${variant.path}${variant.query}`;
    assert.equal(response.status, 301, `${variant.method} ${url} existing www redirect status`);
    assert.equal(response.headers.get('location'), expectedLocation, `${variant.method} ${url} must bypass exact rule`);
    nonMatchChecks.push({method: variant.method, url, status: response.status, location: response.headers.get('location')});
  }
}

const home = await request('https://shiftsometimber.co.uk/', 'GET');
const homepageSHA = crypto.createHash('sha256').update(home.bytes).digest('hex');
assert.equal(home.response.status, 200);
assert.equal(homepageSHA, expectedHomepageSHA, 'homepage response changed');

const closedPurchase = {};
for (const pathname of ['/cart', '/checkout']) {
  const {response} = await request(`https://shiftsometimber.co.uk${pathname}`, 'GET');
  assert.equal(response.status, 404, `${pathname} must remain closed`);
  closedPurchase[pathname] = response.status;
}

const dashboardOrder = [
  'SST legacy www /guides/mounjaro-ultimate-uk-guide to current canonical',
  'SST legacy www /newsroom to current canonical',
  'SST legacy www /blog to current canonical',
  'SST legacy www /waiting-list to current canonical',
  'SST legacy www /help-centre to current canonical',
  'SST legacy www treatments to current canonical',
  'Redirect from WWW to root [Template]',
];

const evidence = {
  pass: true,
  at: new Date().toISOString(),
  dashboard: {observedOn: 'SST Mac authenticated Safari', usedRules: 7, availableRules: 10, order: dashboardOrder},
  redirectChecks,
  redirectCheckCount: redirectChecks.length,
  nonMatchChecks,
  nonMatchCheckCount: nonMatchChecks.length,
  homepage: {status: home.response.status, sha256: homepageSHA, unchanged: true},
  closedPurchase,
};
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'evidence', 'remaining-20261024', 'www-rules-live-verify.json');
fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({
  pass: true,
  at: evidence.at,
  redirectChecks: redirectChecks.length,
  nonMatchChecks: nonMatchChecks.length,
  homepageUnchanged: true,
  closedPurchase,
  evidence: out,
}));
