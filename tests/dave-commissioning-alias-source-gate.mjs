import fs from 'node:fs';
const src=fs.readFileSync('finish-authenticated-production.mjs','utf8');
for(const marker of ['shiftsometimber+structured-${nonce}-a@gmail.com','shiftsometimber+structured-${nonce}-b@gmail.com']){
  if(!src.includes(marker))throw new Error(`missing narrow commissioning alias: ${marker}`);
}
if(src.includes('shiftsometimber+${nonce}-a@gmail.com')||src.includes('shiftsometimber+${nonce}-b@gmail.com'))throw new Error('broad rejected commissioning alias returned');
console.log('PASS Dave commissioning aliases remain inside the narrow production allowlist.');
