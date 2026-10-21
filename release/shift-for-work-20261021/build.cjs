const fs=require('fs'),path=require('path');const r=__dirname,arrow='<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 12h16m-6-6 6 6-6 6"/></svg>';
const images=Object.fromEntries(['hero.webp','lunch.webp'].map(name=>[name,fs.readFileSync(path.join(r,'assets',name)).toString('base64')]));
const data={main:fs.readFileSync(path.join(r,'main.html'),'utf8').replaceAll('{{arrow}}',arrow),style:fs.readFileSync(path.join(r,'style.css'),'utf8'),client:fs.readFileSync(path.join(r,'client.mjs'),'utf8'),images};
fs.writeFileSync(path.join(r,'content.mjs'),Object.entries(data).map(([k,v])=>'export const '+k+'='+JSON.stringify(v)+';').join('\n')+'\n');
