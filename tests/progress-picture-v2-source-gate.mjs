import fs from 'node:fs';
const visual=fs.readFileSync('shift-visualise-v1.js','utf8');
const entry=fs.readFileSync('worker-entry-v6.js','utf8');
for (const token of ["'+10'","'-5'","'-10'","'-15'","'-20'","'-25'",'shift_progress_photos','progress-photo']) {
  if(!visual.includes(token)) throw new Error(`Missing ${token}`);
}
for (const token of ['Access-Control-Allow-Origin','OPTIONS','withMemberCors']) {
  if(!entry.includes(token)) throw new Error(`Missing ${token}`);
}
console.log('Progress Picture V2 source gate passed');
