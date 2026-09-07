import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PAGE = 'research/uk-mens-weight-health-statistics.html';
const DATA = 'research/data/england-mens-weight-health-2024.csv';
const MEDIA_PACK = 'EARNED-AUTHORITY-MEDIA-PACK-V1.md';
const OUTREACH_TRACKER = 'earned-authority-outreach-tracker.csv';

const CSV = `metric,group,period,value,unit,status,calculation,primary_source,source_table,notes
Overweight including obesity,Men aged 16 and over,2024,70,percent,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 3 and 4,Measured height and weight
Living with obesity,Men aged 16 and over,2024,29,percent,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 3 and 4,BMI 30 kg/m2 or more
Overweight but not obesity,Men aged 16 and over,2024,41,percentage points,derived,70 minus 29,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 3 and 4,Approximate because published inputs are rounded
Male-female gap in overweight including obesity,Men minus women,2024,8,percentage points,derived,70 minus 62,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 3 and 4,Published inputs are rounded
Mean measured weight,Men aged 16 and over,1993,78.9,kg,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 1 and 2,
Mean measured weight,Men aged 16 and over,2024,86.2,kg,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 1 and 2,
Change in mean measured weight,Men aged 16 and over,1993-2024,7.3,kg,derived,86.2 minus 78.9,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 1 and 2,Not an estimate of individual weight gain
Relative change in mean measured weight,Men aged 16 and over,1993-2024,9.3,percent,derived,(86.2 minus 78.9) divided by 78.9 times 100,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 1 and 2,Calculated using rounded published means
Mean measured waist circumference,Men aged 16 and over,2024,98.4,cm,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Table 9,
Mean waist-to-height ratio,Men aged 16 and over,2024,0.56,ratio,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Table 9,
Increased or high central adiposity,Men aged 16 and over,2024,74,percent,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Table 9,Waist-to-height ratio above 0.5
Central adiposity above BMI headline,Men aged 16 and over,2024,4,percentage points,derived,74 minus 70,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Tables 3 4 and 9,Comparison of two different measures; not the same individuals
Increased or high central adiposity,Men aged 16 to 34,2024,50,percent,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Table 9,
Increased or high central adiposity,Men aged 75 and over,2024,94,percent,reported,,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Table 9,
Age-group gap in increased or high central adiposity,Men 75 and over minus men 16 to 34,2024,44,percentage points,derived,94 minus 50,https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity,Table 9,Published inputs are rounded
`;

const ARTICLE = `<div class="sst-reading-lead-v31"><p class="standfirst">New analysis of the Health Survey for England 2024 shows that excess weight is common among men, but waist-to-height data exposes an even wider risk signal. Every figure and calculation below can be checked or downloaded.</p></div>
<div class="stat-grid"><div class="stat-card"><strong>70%</strong><span>of men were overweight or living with obesity.</span></div><div class="stat-card"><strong>74%</strong><span>had a waist-to-height ratio above 0.5.</span></div><div class="stat-card"><strong>+7.3kg</strong><span>change in men's mean measured weight since 1993.</span></div><div class="stat-card"><strong>44 points</strong><span>central-adiposity gap between men aged 16–34 and 75+.</span></div></div>
<div class="cite-panel"><strong>Download the underlying figures</strong><p>The CSV separates values reported by NHS England from calculations made by Shift Some Timber. It includes formulas, units, source tables and limitations.</p><p><a class="button button-primary" download href="/research/data/england-mens-weight-health-2024.csv">Download CSV data</a></p></div>
<h2 data-section="01" id="findings">Five findings journalists can verify</h2>
<ol><li><strong>Seven in ten men were above the healthy BMI range.</strong> The survey reports 70% of men as overweight including obesity, compared with 62% of women: an eight-percentage-point gap.</li><li><strong>About 41% of men were overweight but not living with obesity.</strong> SHIFT calculated this by subtracting the published 29% obesity prevalence from the published 70% overweight-including-obesity figure. Both inputs are rounded, so 41% is approximate.</li><li><strong>The waist signal was broader than the BMI headline.</strong> Seventy-four per cent of men had increased or high central adiposity, four percentage points above the 70% classified as overweight including obesity. These are different measures and this comparison does not prove that an extra four per cent of the same men were missed by BMI.</li><li><strong>Men's mean measured weight was 7.3kg higher than in 1993.</strong> It increased from 78.9kg to 86.2kg, a 9.3% relative rise calculated from the published rounded means. This compares population averages; it is not the weight gained by a typical individual.</li><li><strong>Central adiposity rose sharply by age.</strong> The published rate was 50% among men aged 16–34 and 94% among men aged 75+, a 44-percentage-point gap.</li></ol>
<h2 data-section="02" id="method">Methodology</h2>
<p>This is a secondary analysis of NHS England's Health Survey for England 2024 chapter on adult overweight and obesity, published 27 January 2026. SHIFT did not survey participants and has not presented the official statistics as proprietary data.</p>
<p>Reported values were transcribed from NHS England's narrative and tables. Derived values use simple subtraction or percentage-change calculations shown in the downloadable CSV. Calculations were performed on the rounded published values and are labelled as derived. No significance tests, modelled estimates or causal claims were added.</p>
<p>The HSE used measured height and weight during interviewer visits and measured waist circumference during health visits. Survey estimates have sampling uncertainty. The 2024 adult obesity estimate across both sexes had a published 95% confidence interval of 28.4% to 31.5%; users should consult the official tables for measure-specific bases, confidence intervals and suppression rules.</p>
<h2 data-section="03" id="definitions">Definitions</h2>
<ul><li><strong>Overweight including obesity:</strong> BMI of 25kg/m² or more.</li><li><strong>Obesity:</strong> BMI of 30kg/m² or more.</li><li><strong>Increased central adiposity:</strong> waist-to-height ratio from 0.5 to 0.59.</li><li><strong>High central adiposity:</strong> waist-to-height ratio of 0.6 or more.</li></ul>
<p>NICE recommends using waist-to-height ratio as an additional measure for adults with a BMI below 35kg/m², while using lower BMI thresholds for adults from specified ethnic minority backgrounds who are at greater cardiometabolic risk.</p>
<h2 data-section="04" id="limitations">What this analysis cannot say</h2>
<ul><li>The survey covers <strong>England</strong>, not the whole United Kingdom.</li><li>Different percentages must not be treated as counts of the same individuals without participant-level cross-tabulation.</li><li>Age-group differences do not demonstrate that ageing caused the difference.</li><li>Population means are not personal targets or predictions.</li><li>HSE 2021 used self-reported height and weight and is not directly comparable with measured-data years.</li></ul>
<div class="cite-panel"><strong>Suggested citation</strong><p>Shift Some Timber (2026), “Men's weight and waist in England: five findings from the Health Survey for England 2024”, published 7 September 2026. Based on NHS England accredited official statistics.</p></div>
<h2 data-section="05" id="sources">Primary sources</h2><ul class="source-list"><li><a href="https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity" rel="noopener noreferrer">NHS England — Health Survey for England 2024: adults' overweight and obesity</a></li><li><a href="https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024" rel="noopener noreferrer">NHS England — full HSE 2024 release and methods</a></li><li><a href="https://www.nice.org.uk/guidance/ng246" rel="noopener noreferrer">NICE NG246 — overweight and obesity management</a></li></ul>
<div class="note"><strong>Important:</strong> This is general population information, not individual medical advice. Speak to a qualified healthcare professional about personal health concerns.</div>
<h2 data-section="06" id="media">Media and reuse</h2><p>You may reproduce the derived findings with attribution and a link to this page. Cite NHS England as the primary data source. For data questions or founder comment, email <a href="mailto:hello@shiftsometimber.co.uk"><strong>hello@shiftsometimber.co.uk</strong></a>.</p>`;

const MEDIA = `# SHIFT earned-authority media pack — England men's weight data 2026

## Status
Prepared for review. Do not send until the research page and CSV are live and Matt approves outreach.

## Story
New SHIFT analysis of NHS England's measured 2024 data finds that 70% of men were overweight or living with obesity, while 74% had a waist-to-height ratio above 0.5—showing why waist measurement belongs in the public conversation alongside BMI.

## Verified findings
- 70% of men were overweight including obesity; 29% were living with obesity.
- The approximate overweight-but-not-obesity share was 41% (70 minus 29; rounded inputs).
- Men's mean measured weight rose from 78.9kg in 1993 to 86.2kg in 2024: +7.3kg or +9.3% using rounded published means.
- 74% of men had increased or high central adiposity.
- Central adiposity affected 50% of men aged 16–34 and 94% aged 75+: a 44-point gap.

Primary source: NHS England, Health Survey for England 2024, published 27 January 2026. This is secondary analysis, not a new participant survey.

## Founder comment
“Weight conversations often begin and end with BMI. The official data shows why that is too narrow: nearly three quarters of men had a waist-to-height ratio above the recommended level. We have made every calculation downloadable because health information should be easy to check, not wrapped in marketing.” — Matt O'Brien, founder, Shift Some Timber

## Outreach order
1. Macclesfield Nub News — local founder turns national NHS data into an open resource; use its public Nub It route.
2. Cheshire Live / Macclesfield Express — local business and men's-health angle; verify the current newsdesk route on publication day.
3. Men's Health UK — waist-to-height versus BMI and the 16–34 finding; address the current health/features desk.
4. Guardian health desk — only with a live national policy hook.
5. Health Service Journal — measurement and inequalities angle, not treatment sales.
6. Healthwatch Cheshire East — resource sharing, not editorial endorsement.

## Local pitch
Subject: Macclesfield founder opens NHS men's-weight data for journalists

Hi [name],

Macclesfield-based Shift Some Timber has published a transparent analysis and downloadable CSV from the latest measured Health Survey for England data.

The clearest finding is that 70% of men were overweight or living with obesity, while 74% had a waist-to-height ratio above 0.5. Men's mean measured weight was also 7.3kg higher than in 1993.

The work does not claim a new survey: every reported figure links to NHS England and every SHIFT calculation is labelled. Matt O'Brien can discuss why he built the resource after losing 4.5 stone and why ordinary men need useful health information without lectures.

Research: https://shiftsometimber.co.uk/research/uk-mens-weight-health-statistics

Would this be useful for your health or local-business coverage?

## National pitch
Subject: The men's waist figure hiding behind England's obesity headline

Hi [name],

The latest measured Health Survey for England says 70% of men were overweight or living with obesity. A less-reported measure is higher: 74% had increased or high central adiposity, based on waist-to-height ratio.

Shift Some Timber has published a reproducible five-finding analysis and downloadable CSV, separating NHS England's reported values from simple derived calculations. One age split stands out: the central-adiposity figure rises from 50% among men aged 16–34 to 94% at 75+.

Research and methods: https://shiftsometimber.co.uk/research/uk-mens-weight-health-statistics

If useful, founder Matt O'Brien can provide plain-English comment on why BMI should not be the only measurement men understand.

## Rules
- Never say “new study”, “UK-wide”, “proves”, or “BMI misses 4% of men”.
- Lead with the finding, not the company.
- Never claim editorial endorsement from a directory, social share or link.
- Personalise each pitch; no bulk blast. Follow up once after four working days, then stop.
`;

const TRACKER = `priority,outlet,desk_or_route,angle,status,pitched_on,follow_up_on,coverage_url,link_type,notes
1,Macclesfield Nub News,Nub It public submission,Local founder and open NHS data,ready,,,,,
2,Cheshire Live / Macclesfield Express,Verify current newsdesk route,Local men's-health data story,research,,,,,
3,Men's Health UK,Current health or features desk,Waist-to-height versus BMI,research,,,,,
4,The Guardian,Health desk or named reporter,National policy hook only,hold,,,,,
5,Health Service Journal,Relevant policy desk,Measurement and inequalities angle,research,,,,,
6,Healthwatch Cheshire East,Partnership contact,Shareable public resource,research,,,,,
`;

function replaceOnce(value, pattern, replacement, label) {
  const next = value.replace(pattern, replacement);
  if (next === value) throw new Error(`Could not patch ${label}`);
  return next;
}

export async function applyEarnedAuthority(root) {
  const pagePath = path.join(root, PAGE);
  let html = await readFile(pagePath, 'utf8');
  html = replaceOnce(html, /<title>[^<]*<\/title>/, '<title>Men’s Weight &amp; Waist in England: HSE 2024 Analysis</title>', 'title');
  html = replaceOnce(html, /<meta content="[^"]*" name="description"\/>/, '<meta content="Downloadable analysis of NHS England data on men’s weight, obesity and waist-to-height ratio, with transparent calculations and limitations." name="description"/>', 'description');
  html = replaceOnce(html, /<meta content="[^"]*" property="og:title"\/>/, '<meta content="Men’s Weight &amp; Waist in England: HSE 2024 Analysis" property="og:title"/>', 'Open Graph title');
  html = replaceOnce(html, /<meta content="[^"]*" property="og:description"\/>/, '<meta content="Five reproducible findings from NHS England’s measured weight and waist data, with a downloadable CSV." property="og:description"/>', 'Open Graph description');
  html = replaceOnce(html, /<meta content="[^"]*" name="twitter:title"\/>/, '<meta content="Men’s Weight &amp; Waist in England: HSE 2024 Analysis" name="twitter:title"/>', 'X title');
  html = replaceOnce(html, /<meta content="[^"]*" name="twitter:description"\/>/, '<meta content="Five reproducible findings from NHS England’s measured weight and waist data, with a downloadable CSV." name="twitter:description"/>', 'X description');
  html = replaceOnce(html, /<script type="application\/ld\+json">\{[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org', '@type': 'Dataset',
    name: "Men's weight and waist in England: HSE 2024 analysis",
    description: "A reproducible secondary analysis of official Health Survey for England 2024 statistics on men's weight, BMI and central adiposity.",
    url: 'https://shiftsometimber.co.uk/research/uk-mens-weight-health-statistics',
    datePublished: '2026-09-07', dateModified: '2026-09-07',
    creator: { '@type': 'Organization', '@id': 'https://shiftsometimber.co.uk/#organization', name: 'Shift Some Timber', url: 'https://shiftsometimber.co.uk' },
    spatialCoverage: { '@type': 'Place', name: 'England' }, temporalCoverage: '1993/2024',
    license: 'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/',
    isBasedOn: 'https://digital.nhs.uk/data-and-information/publications/statistical/health-survey-for-england/2024/adults-overweight-and-obesity',
    distribution: { '@type': 'DataDownload', encodingFormat: 'text/csv', contentUrl: 'https://shiftsometimber.co.uk/research/data/england-mens-weight-health-2024.csv' },
    variableMeasured: ['Overweight including obesity', 'Obesity', 'Mean measured weight', 'Mean waist circumference', 'Waist-to-height ratio', 'Central adiposity']
  })}</script>`, 'dataset schema');
  html = replaceOnce(html, /<p class="eyebrow">Data resource<\/p><h1[\s\S]*?<\/h1><p class="byline-v12">/, '<p class="eyebrow">Open data analysis · England</p><h1 style="font-size:clamp(34px,3.2vw,46px)!important;line-height:1.03!important;letter-spacing:-0.025em!important">Men’s weight and waist in England: <span class="accent">five findings</span></h1><p class="byline-v12">', 'hero');
  html = replaceOnce(html, /<div class="breadcrumbs"><a href="\/">Home<\/a> \/ [^<]*<\/div>/, '<div class="breadcrumbs"><a href="/">Home</a> / Men’s weight and waist in England</div>', 'breadcrumb');
  html = replaceOnce(html, /<p>A citation-friendly summary[\s\S]*?<\/p><\/div><\/section>/, '<p>Reproducible analysis of NHS England’s 2024 measured-weight and waist data. Published 7 September 2026 · Evidence checked 7 September 2026.</p></div></section>', 'hero summary');
  html = replaceOnce(html, /<div class="sst-reading-lead-v31">[\s\S]*?<h2 data-section="04" id="media">[\s\S]*?<\/p><\/article>/, `${ARTICLE}</article>`, 'article');
  await writeFile(pagePath, html, 'utf8');
  await mkdir(path.join(root, 'research/data'), { recursive: true });
  await writeFile(path.join(root, DATA), CSV, 'utf8');
  await writeFile(path.join(root, MEDIA_PACK), MEDIA, 'utf8');
  await writeFile(path.join(root, OUTREACH_TRACKER), TRACKER, 'utf8');
  return [PAGE, DATA, MEDIA_PACK, OUTREACH_TRACKER];
}

async function main() {
  const root = process.argv[2];
  if (!root) throw new Error('usage: node apply-earned-authority-v1.mjs <site-root>');
  console.log(JSON.stringify({ changed: await applyEarnedAuthority(path.resolve(root)) }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error); process.exitCode = 1; });
