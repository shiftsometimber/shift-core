import fs from'node:fs';import{browserCheck}from'./browser-core.mjs';await browserCheck(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
