import fs from 'node:fs';
import path from 'node:path';

const roots=['frontend','public-site'];
const extensions=/\.(css|html|js|jsx|ts|tsx)$/;
const allowed=new Set(['#050505','#e7e3da','#707762']);
const allowedRgb=new Set(['5,5,5','231,227,218','112,119,98']);
const files=[];
const failures=[];

function walk(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const file=path.join(directory,entry.name);
    if(entry.isDirectory())walk(file);
    else if(extensions.test(entry.name))files.push(file);
  }
}

for(const root of roots)walk(root);
for(const file of files){
  const source=fs.readFileSync(file,'utf8');
  for(const match of source.matchAll(/#[0-9a-f]{3,8}\b/gi)){
    let colour=match[0].toLowerCase();
    if(colour.length===4)colour='#'+[...colour.slice(1)].map(value=>value+value).join('');
    if(!allowed.has(colour))failures.push(`${file}: off-palette colour ${match[0]}`);
  }
  for(const match of source.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[.\d]+)?\s*\)/gi)){
    const base=`${match[1]},${match[2]},${match[3]}`;
    if(!allowedRgb.has(base))failures.push(`${file}: off-palette RGB base ${match[0]}`);
  }
  if(/(?:background(?:-color)?|color|border-color|outline(?:-color)?)\s*:\s*white\b/i.test(source))failures.push(`${file}: white colour declaration`);
  if(/(?:background(?:-color)?|color|border-color|outline(?:-color)?)\s*:\s*black\b/i.test(source))failures.push(`${file}: named black must be exact #050505`);
}

if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log(`PASS brand palette source gate: ${files.length} files use only #050505, #E7E3DA and #707762 colour bases.`);
