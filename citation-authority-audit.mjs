import { writeFile } from 'node:fs/promises';

const DEFAULT_BASE = 'https://shiftsometimber.co.uk';
const TRUSTED_HOSTS = new Set([
  'www.gov.uk',
  'gov.uk',
  'www.nhs.uk',
  'nhs.uk',
  'www.nice.org.uk',
  'nice.org.uk',
  'www.england.nhs.uk',
  'england.nhs.uk',
  'www.medicines.org.uk',
  'medicines.org.uk',
  'pubmed.ncbi.nlm.nih.gov',
  'doi.org',
  'www.bmj.com',
  'bmj.com',
  'jamanetwork.com',
  'www.thelancet.com',
  'thelancet.com',
  'www.cochranelibrary.com',
  'cochranelibrary.com',
  'clinicaltrials.gov',
  'www.ema.europa.eu',
  'www.chelwest.nhs.uk',
  'www.hey.nhs.uk',
  'www.nbt.nhs.uk',
  'www.somersetft.nhs.uk',
  'www.southtees.nhs.uk',
  'www.cht.nhs.uk',
  'www.royalberkshire.nhs.uk',
  'www.uhdb.nhs.uk',
  'www.whittington.nhs.uk',
  'bomss.org',
  'www.samaritans.org',
  // Official overseas provider/health-system verification sources used only
  // on the matching country comparison pages.
  'kancelarzp.cz',
  'www.uzis.cz',
  'www.vi.gov.lv',
  'www.vmnvd.gov.lv',
  'vaspvt.lrv.lt',
  'nil.org.pl',
  'rpwdl.ezdrowie.gov.pl',
  'healthturkiye.gov.tr',
  'shgmturizmdb.saglik.gov.tr',
  // Official sponsor/manufacturer sources may establish pipeline status, but
  // never count as independent proof of benefit or safety.
  'annualreport.novonordisk.com',
  'sciencehub.novonordisk.com',
  'www.novonordisk.com',
  'www.amgen.com',
]);

const HEALTH_PATH = /^(?:\/(?:articles|comparisons|faq|guides|mental-health|research|tools)\/|\/(?:glp1-knowledge-centre|mounjaro|wegovy|orlistat|saxenda|weight-loss-medications|compare-weight-loss-treatments|future-medicines-comparison|decision-centre|mens-health|mens-weight-management|health-mot)(?:\/|$))/i;

function stripTags(html) {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractLinks(html) {
  return [...html.matchAll(/<a\b[^>]*?href=["']([^"']+)["'][^>]*>/gi)].map((match) => match[1]);
}

function sourceLinks(html, pageUrl) {
  return extractLinks(html).flatMap((href) => {
    try {
      const url = new URL(href, pageUrl);
      return url.origin === new URL(pageUrl).origin ? [] : [url.href];
    } catch {
      return [];
    }
  });
}

function jsonLd(html) {
  const records = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const value = JSON.parse(match[1]);
      records.push(...(Array.isArray(value) ? value : [value]));
    } catch {
      records.push({ _invalid: true });
    }
  }
  return records.flatMap((record) => Array.isArray(record?.['@graph']) ? record['@graph'] : [record]);
}

function hasArticleMetadata(records, property) {
  return records.some((record) => {
    const types = Array.isArray(record?.['@type']) ? record['@type'] : [record?.['@type']];
    return types.some((type) => ['Article', 'NewsArticle', 'BlogPosting', 'MedicalWebPage'].includes(type)) && Boolean(record?.[property]);
  });
}

function hasStructuredMetadata(records, property) {
  return records.some((record) => {
    const types = Array.isArray(record?.['@type']) ? record['@type'] : [record?.['@type']];
    return types.some((type) => ['Article', 'NewsArticle', 'BlogPosting', 'MedicalWebPage', 'WebApplication', 'Dataset'].includes(type)) && Boolean(record?.[property]);
  });
}

export function auditHtml(url, html) {
  const pathname = new URL(url).pathname;
  const text = stripTags(html);
  const sources = sourceLinks(html, url);
  const trustedSources = sources.filter((href) => TRUSTED_HOSTS.has(new URL(href).hostname));
  const records = jsonLd(html);
  // Page type is determined by the canonical route, not stray health words in
  // global navigation or footer copy. This avoids demanding article metadata
  // from company, legal and utility pages.
  const healthPage = HEALTH_PATH.test(pathname);
  const hasByline = /\b(?:written|researched|reviewed)\s+(?:and\s+researched\s+)?by\b/i.test(text) || /class=["'][^"']*byline/i.test(html);
  const hasReviewDate = /\b(?:(?:evidence|medically|clinical(?:ly)?|last)\s+)?(?:checked|reviewed|updated)\b[^<\n]{0,80}\b20\d{2}\b/i.test(html) || hasArticleMetadata(records, 'dateModified');
  const hasSourceHeading = /(?:sources?\s*(?:&amp;|&|and)?\s*(?:evidence|further reading)?|references|check the official information|trusted help\s*(?:&amp;|&|and)\s*further reading)/i.test(text);
  const hasBoundary = /general (?:UK )?information|not (?:individual )?medical advice|qualified (?:clinician|prescriber|professional)|speak to (?:a|an|your) (?:healthcare|medical|qualified)/i.test(text);
  const invalidJsonLd = records.some((record) => record?._invalid);
  const defects = [];

  if (healthPage && !hasByline) defects.push('missing_byline');
  if (healthPage && !hasReviewDate) defects.push('missing_review_date');
  if (healthPage && !hasSourceHeading) defects.push('missing_source_section');
  if (healthPage && trustedSources.length < 1) defects.push('no_trusted_external_source');
  if (healthPage && !hasBoundary) defects.push('missing_health_boundary');
  if (healthPage && !hasStructuredMetadata(records, 'author') && !hasStructuredMetadata(records, 'creator')) defects.push('missing_structured_author');
  if (healthPage && !hasStructuredMetadata(records, 'dateModified')) defects.push('missing_structured_modified_date');
  if (invalidJsonLd) defects.push('invalid_json_ld');

  return {
    url,
    healthPage,
    status: 200,
    wordCount: text ? text.split(/\s+/u).length : 0,
    signals: { hasByline, hasReviewDate, hasSourceHeading, hasBoundary, structuredAuthor: hasStructuredMetadata(records, 'author') || hasStructuredMetadata(records, 'creator'), structuredModifiedDate: hasStructuredMetadata(records, 'dateModified') },
    sources: { external: [...new Set(sources)], trusted: [...new Set(trustedSources)] },
    defects,
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'ShiftCitationAuthorityAudit/1.0' }, redirect: 'follow' });
  return { response, text: await response.text() };
}

async function mapLimit(items, limit, task) {
  const results = new Array(items.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await task(items[index], index);
    }
  }));
  return results;
}

export async function auditSite(base = DEFAULT_BASE) {
  const origin = new URL(base).origin;
  const { response: sitemapResponse, text: sitemap } = await fetchText(`${origin}/sitemap.xml`);
  if (!sitemapResponse.ok) throw new Error(`sitemap HTTP ${sitemapResponse.status}`);
  const urls = [...new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]))];
  const pages = await mapLimit(urls, 8, async (url) => {
    try {
      const { response, text } = await fetchText(url);
      if (!response.ok) return { url, healthPage: HEALTH_PATH.test(new URL(url).pathname), status: response.status, defects: ['page_http_error'] };
      return { ...auditHtml(url, text), status: response.status };
    } catch (error) {
      return { url, healthPage: HEALTH_PATH.test(new URL(url).pathname), status: 0, defects: ['page_fetch_error'], error: error.message };
    }
  });
  const healthPages = pages.filter((page) => page.healthPage);
  const defectCounts = healthPages.flatMap((page) => page.defects).reduce((counts, defect) => ({ ...counts, [defect]: (counts[defect] || 0) + 1 }), {});
  return {
    generatedAt: new Date().toISOString(),
    base: origin,
    standard: 'shift-citation-authority-v1',
    summary: {
      sitemapUrls: urls.length,
      fetchedOk: pages.filter((page) => page.status === 200).length,
      healthPages: healthPages.length,
      healthPagesPassing: healthPages.filter((page) => page.defects.length === 0).length,
      healthPagesWithDefects: healthPages.filter((page) => page.defects.length > 0).length,
      defectCounts,
    },
    pages,
  };
}

async function main() {
  const baseArg = process.argv.find((arg) => arg.startsWith('--base='));
  const outArg = process.argv.find((arg) => arg.startsWith('--out='));
  const report = await auditSite(baseArg?.slice(7) || DEFAULT_BASE);
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (outArg) await writeFile(outArg.slice(6), output, 'utf8');
  process.stdout.write(`${JSON.stringify(report.summary, null, 2)}\n`);
  if (report.summary.healthPagesWithDefects > 0) process.exitCode = 2;
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exitCode = 1; });
