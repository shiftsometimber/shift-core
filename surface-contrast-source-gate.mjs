import fs from 'node:fs';
import path from 'node:path';

const roots = ['frontend', 'public-site'];
const files = [];
const lightBackground = /background(?:-color)?\s*:\s*(?:#fff(?:fff)?\b|white\b|#e7e3da\b|var\(--cream\)|var\(--shift-cream\))/i;
const paleForeground = /(?:^|;)\s*color\s*:\s*(?:#fff(?:fff)?\b|white\b|#e7e3da\b|var\(--cream\)|var\(--shift-cream\))/i;
const explicitForeground = /(?:^|;)\s*color\s*:/i;
const componentSelector = /(?:card|panel|option|input|select|button|field|tile|box|surface|article|summary|notice|banner|sheet)/i;

function walk(directory) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.name.endsWith('.css')) files.push(file);
  }
}

roots.forEach(walk);
const failures = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = match[1].trim();
    const declarations = match[2];
    if (!lightBackground.test(declarations)) continue;
    if (paleForeground.test(declarations)) {
      failures.push(`${file}: ${selector} puts pale text on a light surface`);
      continue;
    }
    if (componentSelector.test(selector) && !explicitForeground.test(declarations)) {
      failures.push(`${file}: ${selector} has a light component surface without an owned foreground colour`);
    }
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`PASS surface contrast source gate: ${files.length} stylesheets contain no pale-on-light components or unsafe inherited foregrounds.`);
