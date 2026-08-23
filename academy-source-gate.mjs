import fs from 'node:fs';

const files = [
  'shift-ai-v3.js',
  'shift-ai-v4.js',
  'shift-ai-v5.js',
  'shoulder-v2.js',
  'intelligent-memory.js',
  'relationship-intelligence.js',
  'proactive-insights.js'
];

const forbidden = [
  'How can I assist',
  'take a step back',
  'break it into smaller chunks',
  'Data Transformer',
  'Cache Optimiser'
];

let failed = false;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const s = fs.readFileSync(f, 'utf8');
  for (const phrase of forbidden) {
    const occurrences = s.split(phrase).length - 1;
    if (!occurrences) continue;
    const lines = s.split(/\r?\n/).filter(line => line.includes(phrase));
    const allowedInGuardrail = lines.every(line => /ANTI-BOT|Avoid|Never say|forbidden|guardrail/i.test(line));
    if (!allowedInGuardrail) {
      console.error(`Academy gate: forbidden generic/hallucinated phrase in ${f}: ${phrase}`);
      failed = true;
    }
  }
}
if (failed) process.exit(1);
console.log('Shift Academy source gate passed.');
