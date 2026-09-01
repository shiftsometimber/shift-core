import fs from 'node:fs';

const need = (ok, message) => {
  if (!ok) throw new Error(`My Journey integration gate: ${message}`);
};
const read = path => {
  need(fs.existsSync(path), `required integration file ${path} does not exist`);
  return fs.readFileSync(path, 'utf8');
};
const has = (source, marker, message = `missing ${marker}`) =>
  need(source.includes(marker), message);

const shell = read('frontend/member/my-timber-preview.html');
const client = [read('frontend/member/member-my-journey-v1.js'), read('frontend/member/member-my-journey-checkin-v1.js'), read('my-journey-checkin-v1.js'), read('my-journey-observation-v1.js')].join('\n');
const css = [read('frontend/member/member-my-journey-v1.css'), read('frontend/member/member-my-journey-checkin-v1.css'), shell].join('\n');
const adapter = read('frontend/member/api-adapter-v33d.js');
const worker = read('worker-entry-v6.js');
const config = read('wrangler.jsonc');
const productionWorkflow = read('.github/workflows/cloudflare-production-promote.yml');
const weeklyClient = read('frontend/member/member-my-journey-checkin-v1.js');

// One coherent destination in the canonical live shell.
for (const marker of [
  'href="/member-my-journey-v1.css',
  '/member-my-journey-v1.js',
  'href="#journey"',
  '>My Journey<',
  'id="panel-journey"',
  'aria-labelledby="journeyTitle"',
  'id="journeyTitle"',
  'data-portal-panel="journey"',
  '>MY JOURNEY<',
]) has(shell, marker);
need((shell.match(/data-panel="journey"/g) || []).length === 1,
  'the shell must expose exactly one My Journey destination');

// The worker must serve the assets and the authenticated journey API.
for (const marker of [
  "'/member-my-journey-v1.js'",
  "'/member-my-journey-v1.css'",
  "path.startsWith('/v1/journey/')",
]) has(worker, marker);
for (const marker of [
  'shiftsometimber.co.uk/member-my-journey-v1.js*',
  'shiftsometimber.co.uk/member-my-journey-v1.css*',
  'shiftsometimber.co.uk/member-my-journey-checkin-v1.js*',
  'shiftsometimber.co.uk/member-my-journey-checkin-v1.css*',
]) has(config, marker);

// The browser adapter exposes one modular API surface rather than reviving
// separate Progress, Check-in and Life Back destinations.
for (const marker of [
  "request('/journey'",
  "request('/journey/weekly-check-in'",
  "request('/journey/trends'",
]) has(adapter, marker);

// Phase 1: complete saved member story.
for (const marker of [
  'Starting weight',
  'Current weight',
  'JOURNEY PROGRESS',
  'YOUR TARGET',
  'BMI',
  'Waist',
  'How are you feeling now?',
  'Life Back',
  'CLOTHES',
  'What matters most right now?',
  'reviewCadence',
]) has(client, marker, `Phase 1 member story missing “${marker}”`);

// Phase 2: one weekly check-in, adapted to route and carrying context.
for (const marker of [
  'weekly Journey check-in',
  'jab-day',
  'review day',
  'Appetite',
  'sleep',
  'energy',
  'mood',
  'Symptoms',
  'hydration',
  'movement',
  'How have your clothes fitted?',
  'Something fits again',
  'Anything changed around you?',
  'Confirm my week',
]) has(client, marker, `Phase 2 check-in missing “${marker}”`);
need(!weeklyClient.includes('type="number"'), 'weekly Journey must not ask members to type weight, dimensions or tracked numbers into blank boxes');
for (const marker of [
  "numberSelect('weightStone'",
  "numberSelect('weightPounds'",
  "numberSelect('weightValue'",
  "numberSelect('waistCm'",
  "numberSelect('mealDays'",
  "numberSelect('proteinG'",
  "numberSelect('steps'",
  "numberSelect('sessions'",
  "numberSelect('waterDays'",
  'You will never be asked to type your weight or measurements into a blank box.',
]) has(weeklyClient, marker, `respectful selector contract missing “${marker}”`);

// Phase 3: restrained longitudinal interpretation, including explicit limits.
for (const marker of [
  'trendWeeks: 4',
  "kind: weeks <= 1 ? 'my_journey_week' : 'my_journey_12_week'",
  'what_happened',
  'changed_alongside',
  'might_have_contributed',
  'cannot_conclude',
  'next_move',
]) has(client, marker, `Phase 3 observation contract missing “${marker}”`);

// Member-owned lifecycle controls must be visible from the Journey itself.
for (const marker of [
  'data-mj-pause',
  'Export my member data',
  'Reset Journey setup',
  'Delete My Journey',
  'maintenanceLowKg',
  'reviewDay',
]) has(client + adapter, marker, `Journey lifecycle control missing “${marker}”`);
has(adapter, 'deleteMyJourney');
has(adapter, 'getJourneyExport');
has(worker, 'myJourneyRoutes');
for (const marker of ['env.DB.batch', "source='my_journey_weekly'", 'shift_progress_photos_v2']) has(read('my-journey-v1.js'), marker);
need(!client.includes('new MutationObserver'), 'weekly check-in must not race and duplicate during Journey rendering');
for (const marker of ["'my-journey-v1.js'","'my-journey-checkin-v1.js'",'node my-journey-integration-gate.mjs']) has(productionWorkflow, marker, `production Worker coordination missing “${marker}”`);

// Accessibility and resilient interaction contracts.
for (const marker of [
  'role="status"',
  'aria-live="polite"',
  'aria-busy',
  '<label',
  'type="button"',
]) has(client, marker, `accessibility contract ${marker}`);
need(!/outline\s*:\s*(?:0|none)/i.test(css),
  'focus indicators must not be suppressed');
need(/:focus-visible/.test(css), 'visible keyboard focus styling is required');
need(/@media\s*\([^)]*max-width/i.test(css), 'mobile layout contract is missing');
need(/@media\s*\(prefers-reduced-motion:\s*reduce\)/i.test(css),
  'reduced-motion handling is required');

// Locked Shift visual system. White is not a brand surface.
for (const colour of ['#050505', '#e7e3da', '#707762'])
  need(css.toLowerCase().includes(colour), `brand colour ${colour} is missing`);
need(!/(?:background|color)\s*:\s*(?:#fff(?:fff)?|white)\b/i.test(css),
  'unapproved white surface/text found');

console.log('My Journey integration gate: PASS');
