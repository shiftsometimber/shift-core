// Prepare an existing HQ asset directory without replacing its shell or navigation.
import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
const directory=process.argv[2];if(!directory)throw Error('Pass the existing HQ asset directory');
const root=resolve(directory),file=join(root,'index.html');let html=await readFile(file,'utf8');
if(!html.includes('data-view="orders"')||!html.includes('hq.js'))throw Error('Unrecognised HQ shell');
if(!html.includes('/clinical-assets/client.mjs'))html=html.replace('</body>','<script type="module" src="/clinical-assets/client.mjs"></script></body>');
await mkdir(join(root,'clinical-assets'),{recursive:true});
await copyFile(new URL('./hq-clinical-client.mjs',import.meta.url),join(root,'clinical-assets/client.mjs'));
await copyFile(new URL('./hq-clinical.css',import.meta.url),join(root,'clinical-assets/hq.css'));
await writeFile(file,html);console.log('HQ clinician portal installed into '+root+'; existing shell retained.');
