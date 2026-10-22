const fs=require('node:fs');fs.writeFileSync(__dirname+'/style.mjs','export default '+JSON.stringify(fs.readFileSync(__dirname+'/style.css','utf8'))+';\n');
