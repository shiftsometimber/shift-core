const fs=require('node:fs'),path=require('node:path');const base=__dirname;
for(const name of ['style','client'])fs.writeFileSync(path.join(base,name+'.mjs'),'export default '+JSON.stringify(fs.readFileSync(path.join(base,name+(name==='style'?'.css':'.js')),'utf8'))+';\n');
