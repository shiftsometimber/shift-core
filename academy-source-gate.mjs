import fs from 'node:fs';
const files=['shift-ai-v3.js','shift-ai-v4.js','shift-ai-v5.js','shoulder-v2.js','intelligent-memory.js','relationship-intelligence.js','proactive-insights.js','academy-v2.js'];
const forbidden=['How can I assist','take a step back','break it into smaller chunks','Data Transformer','Cache Optimiser'];
let failed=false;
for(const f of files){if(!fs.existsSync(f))continue;const s=fs.readFileSync(f,'utf8');for(const phrase of forbidden){if(s.includes(phrase)&&!s.includes(`Avoid '${phrase}`)&&!s.includes(`Never say '${phrase}`)){console.error(`Academy gate: forbidden generic/hallucinated phrase in ${f}: ${phrase}`);failed=true}}}
if(failed)process.exit(1);console.log('Shift Academy source gate passed.');
