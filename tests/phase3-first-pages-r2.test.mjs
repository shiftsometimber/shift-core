import assert from 'node:assert/strict';
import test from 'node:test';
import { phase3Pages } from '../evidence/seo-authority/phase3-first-pages-r2.mjs';

const words = (page) => [page.title, page.dek, page.boundary, ...page.sections.flatMap((section) => [section.heading, ...section.paragraphs])].join(' ').trim().split(/\s+/u).length;

test('Phase 3 has one complete first page for each authorised hub', () => {
  assert.equal(phase3Pages.length, 7);
  for (const field of ['hub', 'url', 'intent', 'slug']) assert.equal(new Set(phase3Pages.map((page) => page[field])).size, 7, field);
});

test('every candidate has substantive exact copy and primary-source evidence', () => {
  for (const page of phase3Pages) {
    assert.ok(page.title.length > 20, `${page.slug}: title`);
    assert.ok(page.description.length > 80, `${page.slug}: description`);
    assert.ok(page.dek.length > 100, `${page.slug}: dek`);
    assert.ok(page.boundary.length > 80, `${page.slug}: boundary`);
    assert.ok(page.sections.length >= 3, `${page.slug}: sections`);
    assert.ok(words(page) >= 220, `${page.slug}: substantive copy (${words(page)} words)`);
    assert.ok(page.sources.length >= 2, `${page.slug}: sources`);
    for (const source of page.sources) {
      const url = new URL(source.href);
      assert.ok(['www.nhs.uk', 'www.nice.org.uk', 'www.gov.uk', 'www.england.nhs.uk'].includes(url.hostname), `${page.slug}: primary source`);
      assert.equal(url.protocol, 'https:');
    }
  }
});

test('medicine-adjacent candidates keep specialist decisions out of copy', () => {
  const glp1 = phase3Pages.find((page) => page.slug === 'practical-glp1');
  const nhs = phase3Pages.find((page) => page.slug === 'nhs-explainers');
  assert.match(glp1.boundary, /does not decide whether a medicine is suitable/i);
  assert.match(glp1.boundary, /dose/i);
  assert.match(nhs.boundary, /not an eligibility assessment or medicine recommendation/i);
  assert.match(nhs.sections.flatMap((section) => section.paragraphs).join(' '), /qualified prescriber/i);
});

test('mental-health and BMI candidates retain their safety boundaries', () => {
  const mentalHealth = phase3Pages.find((page) => page.slug === 'life-back');
  const bmi = phase3Pages.find((page) => page.slug === 'tools');
  assert.match(mentalHealth.boundary, /call 999 or go to A&E/i);
  assert.ok(mentalHealth.sources.some((source) => source.href.includes('/get-urgent-help-for-mental-health/')));
  assert.equal(bmi.tool, 'bmi');
  assert.match(bmi.boundary, /not a diagnosis, eligibility decision/i);
});
