import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
writeFileSync(new URL('content.mjs',import.meta.url),['panel.html','style.css','client.js'].map((name,i)=>'export const '+['panel','style','client'][i]+'='+JSON.stringify(read(name))+';').join('\n')+'\n');
