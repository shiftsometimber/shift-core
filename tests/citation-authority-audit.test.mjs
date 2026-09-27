import assert from 'node:assert/strict';
import test from 'node:test';
import { auditHtml } from '../citation-authority-audit.mjs';

test('passes a sourced health article with visible and structured authority', () => {
  const page = auditHtml('https://shiftsometimber.co.uk/articles/example', `
    <html><head><script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","author":{"@type":"Person","name":"Matt O'Brien"},"dateModified":"2026-09-06"}</script></head>
    <body><p>Written and researched by Matt O'Brien. Evidence checked 6 September 2026.</p>
    <p>This treatment information is general information, not individual medical advice.</p>
    <h2>Sources &amp; evidence</h2><a href="https://www.nice.org.uk/guidance/ng246">NICE NG246</a></body></html>`);
  assert.deepEqual(page.defects, []);
});

test('identifies a health page carrying claims without authority signals', () => {
  const page = auditHtml('https://shiftsometimber.co.uk/articles/example', '<h1>Weight loss treatment</h1><p>A medicine dose is 5mg.</p>');
  assert.ok(page.defects.includes('missing_byline'));
  assert.ok(page.defects.includes('missing_review_date'));
  assert.ok(page.defects.includes('missing_source_section'));
  assert.ok(page.defects.includes('no_trusted_external_source'));
  assert.ok(page.defects.includes('missing_structured_author'));
});

test('does not impose medical-article requirements on a company page', () => {
  const page = auditHtml('https://shiftsometimber.co.uk/contact', '<h1>Contact Shift</h1><p>Email our team.</p>');
  assert.equal(page.healthPage, false);
  assert.deepEqual(page.defects, []);
});

