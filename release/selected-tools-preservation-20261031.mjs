import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {dirname} from 'node:path';
export const TOOLS_VERSION='8a7e03bb-7ced-421e-aba8-87bca1494ff2';
export const TOOLS_PINS={"tools-ct3-20261031/entry.mjs":"326dcd87165e7d23f057219c014a8f9bca07d8fb8a4254edfb005e5e66d3527d","tools-ct3-20261031/html.mjs":"efb7081f50337295361cb96d6b05f5f7d7d03df773f625609299ca4e86297146","tools-ct3-20261031/media.mjs":"70320207a2f9af8e5577146c1aa29b142a67f83af4bfb9149f4465d3e7757c23","tools-ct3-20261031/presentation.mjs":"a834b85d8d1cf084a8a83c66046400834ad6303788eb8287a14ab72d54862bdf","tools-ct3-20261031/runtime.mjs":"c6b9c05c7ca7f13bc2cfb0033120fee9b8b42c77761e56b75be2d44ee297b673"};
export const hash=b=>createHash('sha256').update(b).digest('hex');
export function verifyToolsPackage(data,baseHash='8f1f2555ad077efed4abb75be6815595f1b0a6a44e4af8539fe303a4121925ea'){
 assert.equal(data.main_module,'tools-ct3-20261031/entry.mjs');
 const pins={...TOOLS_PINS,'worker.js':baseHash};
 assert.deepEqual(data.modules.map(m=>m.name).sort(),Object.keys(pins).sort(),'Unexpected package module');
 for(const m of data.modules)assert.equal(hash(Buffer.from(m.content_base64,'base64')),pins[m.name],m.name);
 return true;
}
export async function stageSelectedTools(built){
 const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+process.env.CLOUDFLARE_ACCOUNT_ID+'/workers/workers/shift-core/versions/'+TOOLS_VERSION+'?include=modules',{headers:{Authorization:'Bearer '+process.env.CLOUDFLARE_API_TOKEN},signal:AbortSignal.timeout(45000)});
 assert(r.ok);const d=await r.json();assert(d.success);verifyToolsPackage(d.result);
 writeFileSync('b1-runtime-release/selected-tools-before.json',JSON.stringify(d.result));
 for(const m of d.result.modules.filter(m=>m.name!=='worker.js')){const path='b1-runtime-release/staged-runtime/'+m.name;mkdirSync(dirname(path),{recursive:true});writeFileSync(path,Buffer.from(m.content_base64,'base64'));}
 const config=readFileSync('wrangler.jsonc','utf8').replace('"main": "shift-coach/worker.mjs"','"main": "b1-runtime-release/staged-runtime/tools-ct3-20261031/entry.mjs", "base_dir": "b1-runtime-release/staged-runtime", "find_additional_modules": true, "rules": [{"type":"ESModule","globs":["**/*.js","**/*.mjs"],"fallthrough":true}]');
 assert.notEqual(config,readFileSync('wrangler.jsonc','utf8'));
 writeFileSync('october-package.wrangler.jsonc',config);
 return 'b1-runtime-release/staged-runtime/tools-ct3-20261031/entry.mjs';
}
