import {execFileSync} from 'node:child_process';
export function collectorD1(args,execute=execFileSync){
 const raw=execute('npx',['wrangler','d1','execute','DB','--remote','--config','wrangler.jsonc','--json',...args],{encoding:'utf8',maxBuffer:8*1024*1024});
 // Wrangler's file-import path prints progress even with --json. Its exit code
 // establishes command success; the caller verifies the stored rows separately.
 return args.includes('--file')?null:JSON.parse(raw);
}
