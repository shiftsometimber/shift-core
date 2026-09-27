import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { applyEarnedAuthority } from '../apply-earned-authority-v1.mjs';

test('turns the source summary into a downloadable, transparent analysis', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'shift-earned-authority-'));
  await mkdir(path.join(root, 'research'));
  await writeFile(path.join(root, 'research/uk-mens-weight-health-statistics.html'), `<html><head>
    <title>Old title</title><meta content="Old description" name="description"/>
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Dataset","name":"Old"}</script>
    <meta content="Old OG" property="og:title"/><meta content="Old OG description" property="og:description"/>
    <meta content="Old X" name="twitter:title"/><meta content="Old X description" name="twitter:description"/>
    </head><body><section><div><div class="breadcrumbs"><a href="/">Home</a> / Old title</div><p class="eyebrow">Data resource</p><h1>Old</h1><p class="byline-v12">Written and researched by Matt O'Brien</p><p>A citation-friendly summary of old figures.</p></div></section>
    <article><div class="sst-reading-lead-v31"><p class="standfirst">Old</p></div><h2 data-section="04" id="media">Media enquiries</h2><p>Old media copy</p></article></body></html>`);

  const changed = await applyEarnedAuthority(root);
  assert.deepEqual(changed, [
    'research/uk-mens-weight-health-statistics.html',
    'research/data/england-mens-weight-health-2024.csv',
    'EARNED-AUTHORITY-MEDIA-PACK-V1.md',
    'earned-authority-outreach-tracker.csv',
  ]);
  const html = await readFile(path.join(root, changed[0]), 'utf8');
  assert.match(html, /Five findings journalists can verify/);
  assert.match(html, /"@type":"DataDownload"/);
  assert.match(html, /Men’s Weight &amp; Waist in England/);
  const csv = await readFile(path.join(root, changed[1]), 'utf8');
  assert.match(csv, /status,calculation,primary_source/);
  assert.match(csv, /1993-2024,7\.3,kg,derived,86\.2 minus 78\.9/);
  const media = await readFile(path.join(root, changed[2]), 'utf8');
  assert.match(media, /Never say “new study”/);
});
