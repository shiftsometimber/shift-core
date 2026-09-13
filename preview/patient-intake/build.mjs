import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../../',import.meta.url),out=new URL('./public/',import.meta.url);await mkdir(out,{recursive:true});
for(const file of ['patient-intake.html','patient-intake.css','patient-intake.js']){let data=await readFile(new URL('frontend/member/'+file,root),'utf8');if(file.endsWith('.html'))data=data.replace('<script src="/patient-intake.js"','<script type="module" src="/demo.js"></script><script type="module" src="/patient-intake.js"');await writeFile(new URL(file,out),data)}
for(const file of ['patient-questionnaire-v2.js','patient-intake-v2.js','patient-refund-v2.js'])await writeFile(new URL(file,out),await readFile(new URL(file,root)));
await writeFile(new URL('demo.js',out),await readFile(new URL('./demo.js',import.meta.url)));
