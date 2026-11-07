import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const origin = 'https://shiftsometimber.co.uk';
const knowledge = '/knowledge';
const alias = '/explore-knowledge';
const grid = '<div class="kh-grid kh-legacy">';
const cards = [
  {
    slug: 'wegovy-cost-uk',
    title: 'Wegovy costs in the UK',
    summary: 'What to check when comparing quotes and ongoing costs.',
  },
  {
    slug: 'oral-semaglutide-for-weight-loss',
    title: 'Oral semaglutide for weight loss in the UK',
    summary: 'A guide to what the published research can tell you.',
  },
];
const articlePaths = cards.map(card => '/articles/' + card.slug);
const protectedPaths = [
  ...articlePaths,
  '/sitemap.xml',
  '/',
  '/faq/does-sst-prescribe',
  '/programme',
  '/start-here',
  '/robots.txt',
  '/assets/shift-wordmark.png',
];
const policyHeaders = new Set([
  'access-control-allow-origin', 'cache-control', 'content-type',
  'content-security-policy', 'location', 'permissions-policy',
  'referrer-policy', 'strict-transport-security',
  'x-content-type-options', 'x-frame-options', 'x-robots-tag',
]);
const markup = cards.map(({slug, title, summary}, index) =>
  '<article class="kh-card" data-kh-card data-kh-topic="existing" data-babylove-dynamic="' + slug + '">' +
  '<h3>' + title + '</h3><p>' + summary + '</p><a href="' + articlePaths[index] + '">Read the guide →</a></article>'
).join('');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

async function fetchPage(path, redirect = 'manual') {
  const response = await fetch(origin + path, {
    redirect,
    headers: {'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'},
    signal: AbortSignal.timeout(30_000),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  const headers = Object.fromEntries([...response.headers].filter(([name]) =>
    policyHeaders.has(name) || name.startsWith('x-shift-')
  ));
  return {
    bytes,
    receipt: {status: response.status, url: response.url, headers, sha256: hash(bytes)},
  };
}

function utf8(bytes, path) {
  const text = bytes.toString('utf8');
  assert(Buffer.from(text).equals(bytes), path + ' must be valid UTF-8');
  return text;
}

function assertCanonical(html, path) {
  const tags = [...html.matchAll(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi)];
  assert.equal(tags.length, 1, path + ' must have exactly one canonical');
  assert.equal(tags[0][0].match(/\bhref=["']([^"']+)["']/i)?.[1], origin + path, path + ' canonical');
}

async function observe() {
  const paths = [knowledge, alias, ...protectedPaths];
  const [pages, followed] = await Promise.all([
    Promise.all(paths.map(path => fetchPage(path))),
    fetchPage(alias, 'follow'),
  ]);
  const byPath = Object.fromEntries(paths.map((path, index) => [path, pages[index]]));
  const landing = byPath[knowledge];
  const redirect = byPath[alias].receipt;
  assert.equal(landing.receipt.status, 200, knowledge + ' must return 200');
  assert.equal(redirect.status, 308, alias + ' must return 308');
  assert.equal(redirect.headers.location, knowledge, alias + ' must point to /knowledge');
  assert.deepEqual(followed.receipt, landing.receipt, 'Alias must resolve to the same Knowledge response');
  assert(followed.bytes.equals(landing.bytes), 'Alias landing body differs from direct Knowledge');
  for (const path of protectedPaths) {
    assert.equal(byPath[path].receipt.status, 200, path + ' must return 200');
  }
  const html = utf8(landing.bytes, knowledge);
  assertCanonical(html, knowledge);
  const sitemap = utf8(byPath['/sitemap.xml'].bytes, '/sitemap.xml');
  for (const path of articlePaths) {
    assertCanonical(utf8(byPath[path].bytes, path), path);
    assert.equal(sitemap.split('<loc>' + origin + path + '</loc>').length - 1, 1, path + ' must occur once in sitemap');
  }
  return {
    html,
    pages: Object.fromEntries(paths.map(path => [path, byPath[path].receipt])),
  };
}

function assertCardCount(html, count) {
  for (const [index, {slug}] of cards.entries()) {
    assert.equal(html.split('data-babylove-dynamic="' + slug + '"').length - 1, count, slug + ' card count');
    assert.equal(html.split('href="' + articlePaths[index] + '"').length - 1, count, slug + ' link count');
  }
}

export function stripApprovedCards(html) {
  assertCardCount(html, 1);
  assert.equal(html.split(grid).length - 1, 1, 'Knowledge guide grid must appear exactly once');
  assert(html.includes(grid + markup), 'Approved cards must be first, in exact order and with exact approved copy');
  return html.replace(grid + markup, grid);
}

export async function captureLive() {
  const {html, pages} = await observe();
  assertCardCount(html, 0);
  return {capturedAt: new Date().toISOString(), pages};
}

export async function verifyLive(before) {
  const {html, pages} = await observe();
  const unaffected = {...pages, [knowledge]: {...pages[knowledge], sha256: hash(stripApprovedCards(html))}};
  assert.deepEqual(unaffected, before.pages, 'Protected public responses or unrelated Knowledge bytes changed');
  return {
    verifiedAt: new Date().toISOString(),
    pages,
    positions: Object.fromEntries(cards.map(({slug}, index) => [slug, index + 1])),
    existingKnowledgeBytesPreserved: true,
    protectedPaths,
  };
}

export async function verifyRestored(before) {
  const restored = await captureLive();
  assert.deepEqual(restored.pages, before.pages, 'Rollback did not restore the captured public responses');
  return restored;
}
