import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const TOOL_FILES = ['alcohol', 'bmi', 'calories', 'healthy-weight', 'steps', 'waist-height', 'water'];
const CREATOR = {
  '@type': 'Organization',
  '@id': 'https://shiftsometimber.co.uk/#organization',
  name: 'Shift Some Timber',
  url: 'https://shiftsometimber.co.uk',
};

const RESEARCH_FILE = 'research/uk-mens-weight-health-statistics.html';
const GASTRIC_BALLOON_FILE = 'guides/gastric-balloon-uk-guide.html';
const RETIRED_CHELWEST_SOURCE = /<li><a href="https:\/\/www\.chelwest\.nhs\.uk\/your-visit\/patient-leaflets\/bariatric-dietetics\/dietary-guidance-after-intra-gastric-balloon-insertion"[^>]*>Chelsea and Westminster NHS – Dietary guidance after intragastric balloon<\/a><\/li>/;

function patchWebApplication(html, filename) {
  let found = false;
  const patched = html.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/gi, (whole, open, body, close) => {
    let data;
    try { data = JSON.parse(body); } catch { return whole; }
    if (data?.['@type'] !== 'WebApplication') return whole;
    found = true;
    if (!data.creator) data.creator = CREATOR;
    return `${open}${JSON.stringify(data)}${close}`;
  });
  if (!found) throw new Error(`${filename}: WebApplication JSON-LD not found`);
  return patched;
}

export async function applyCitationAuthority(root) {
  const changed = [];
  for (const slug of TOOL_FILES) {
    const filename = path.join(root, 'tools', `${slug}.html`);
    const before = await readFile(filename, 'utf8');
    const after = patchWebApplication(before, filename);
    if (after !== before) {
      await writeFile(filename, after, 'utf8');
      changed.push(path.relative(root, filename));
    }
  }
  const researchFilename = path.join(root, RESEARCH_FILE);
  const researchBefore = await readFile(researchFilename, 'utf8');
  const researchAfter = researchBefore.replace(/(<script\b[^>]*type=["']application\/ld\+json["'][^>]*>)([\s\S]*?)(<\/script>)/i, (whole, open, body, close) => {
    let data;
    try { data = JSON.parse(body); } catch { return whole; }
    if (data?.['@type'] !== 'Dataset') return whole;
    return `${open}${JSON.stringify({ ...data, creator: { ...CREATOR, ...data.creator, '@id': CREATOR['@id'], url: CREATOR.url } })}${close}`;
  });
  if (researchAfter !== researchBefore) {
    await writeFile(researchFilename, researchAfter, 'utf8');
    changed.push(RESEARCH_FILE);
  }
  const balloonFilename = path.join(root, GASTRIC_BALLOON_FILE);
  const balloonBefore = await readFile(balloonFilename, 'utf8');
  const balloonAfter = balloonBefore.replace(RETIRED_CHELWEST_SOURCE, '');
  if (balloonAfter !== balloonBefore) {
    await writeFile(balloonFilename, balloonAfter, 'utf8');
    changed.push(GASTRIC_BALLOON_FILE);
  }
  return changed;
}

async function main() {
  const root = process.argv[2];
  if (!root) throw new Error('usage: node apply-citation-authority-v1.mjs <site-root>');
  const changed = await applyCitationAuthority(path.resolve(root));
  console.log(JSON.stringify({ standard: 'shift-citation-authority-v1', changed }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exitCode = 1; });
