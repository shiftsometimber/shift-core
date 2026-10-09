// Read-only public check. Exit non-zero if any of the nine repaired pages regresses.
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const paths = ['/decision-centre','/tools/alcohol','/tools/bmi','/tools/calories','/tools/healthy-weight','/tools/protein','/tools/waist-height','/tools/walking','/tools/water'];
function* walk(value) {
  if (Array.isArray(value)) { for (const child of value) yield* walk(child); }
  else if (value && typeof value === 'object') { yield value; for (const child of Object.values(value)) yield* walk(child); }
}
async function check(path, fetchImpl = fetch) {
  try {
    const url = 'https://shiftsometimber.co.uk' + path;
    const response = await fetchImpl(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Cache-Control': 'no-cache' }, signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, 'Unexpected HTTP status');
    const html = await response.text();
    const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi)];
    const nodes = [...walk(blocks.map(match => JSON.parse(match[1])))];
    const applicationItems = nodes.filter(node => [node['@type']].flat().some(type => ['SoftwareApplication','WebApplication','MobileApplication'].includes(type))).length;
    const pages = nodes.filter(node => [node['@type']].flat().includes('WebPage') && node.url === url);
    assert.equal(applicationItems, 0, 'Application markup returned');
    assert.equal(pages.length, 1, 'Expected exactly one canonical WebPage item');
    assert.equal(pages[0]['@id'], url + '#webpage', 'WebPage identifier changed');
    assert.equal(pages[0].isAccessibleForFree, true, 'Free-access declaration changed');
    return { path, status: response.status, htmlSha256: createHash('sha256').update(html).digest('hex'), jsonBlocks: blocks.length, applicationItems, canonicalWebPageItems: pages.length, passed: true };
  } catch (error) { return { path, passed: false, error: error.message }; }
}
async function verifyAll(fetchImpl = fetch) {
  return Promise.all(paths.map(path => check(path, fetchImpl)));
}
async function main(fetchImpl = fetch) {
  const checks = await verifyAll(fetchImpl);
  const receipt = { verifiedAt: new Date().toISOString(), scope: 'Public HTTP and structured data only; not a Semrush recrawl or calculator interaction test', checks };
  console.log(JSON.stringify(receipt, null, 2));
  if (checks.some(check => !check.passed)) process.exitCode = 1;
}
module.exports = { paths, check, verifyAll, main };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

