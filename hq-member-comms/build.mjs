import {readFileSync,writeFileSync} from 'node:fs';
const files={hq:'hq.html',member:'member.html',css:'style.css',client:'client.js',memberClient:'member-client.js'};
writeFileSync(new URL('content.mjs',import.meta.url),Object.entries(files).map(([key,file])=>'export const '+key+'='+JSON.stringify(readFileSync(new URL(file,import.meta.url),'utf8'))+';').join('\n')+'\n');
