const fs=require('node:fs'),p=require('node:path');fs.writeFileSync(p.join(__dirname,'style.mjs'),'export default '+JSON.stringify(fs.readFileSync(p.join(__dirname,'style.css'),'utf8'))+';\n');
