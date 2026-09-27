import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { applyCitationAuthority } from '../apply-citation-authority-v1.mjs';

test('adds a truthful organisation creator to every health calculator schema', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'shift-citation-'));
  await mkdir(path.join(root, 'tools'));
  await mkdir(path.join(root, 'research'));
  await mkdir(path.join(root, 'guides'));
  const source = '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Tool","dateModified":"2026-08-08"}</script>';
  for (const slug of ['alcohol', 'bmi', 'calories', 'healthy-weight', 'steps', 'waist-height', 'water']) await writeFile(path.join(root, 'tools', `${slug}.html`), source);
  await writeFile(path.join(root, 'research/uk-mens-weight-health-statistics.html'), '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Dataset","name":"Research","dateModified":"2026-08-07","creator":{"@type":"Organization","name":"Shift Some Timber"}}</script>');
  await writeFile(path.join(root, 'guides/gastric-balloon-uk-guide.html'), '<ul><li><a href="https://www.chelwest.nhs.uk/your-visit/patient-leaflets/bariatric-dietetics/dietary-guidance-after-intra-gastric-balloon-insertion" rel="noreferrer noopener" target="_blank">Chelsea and Westminster NHS – Dietary guidance after intragastric balloon</a></li><li>Keep me</li></ul>');
  const changed = await applyCitationAuthority(root);
  assert.equal(changed.length, 9);
  const bmi = await readFile(path.join(root, 'tools/bmi.html'), 'utf8');
  assert.match(bmi, /"creator":\{"@type":"Organization","@id":"https:\/\/shiftsometimber\.co\.uk\/#organization"/);
  assert.equal((bmi.match(/"creator"/g) || []).length, 1);
  const research = await readFile(path.join(root, 'research/uk-mens-weight-health-statistics.html'), 'utf8');
  assert.match(research, /"@type":"Dataset"/);
  assert.match(research, /"@id":"https:\/\/shiftsometimber\.co\.uk\/#organization"/);
  const balloon = await readFile(path.join(root, 'guides/gastric-balloon-uk-guide.html'), 'utf8');
  assert.doesNotMatch(balloon, /chelwest/);
  assert.match(balloon, /Keep me/);
  assert.deepEqual(await applyCitationAuthority(root), []);
});
