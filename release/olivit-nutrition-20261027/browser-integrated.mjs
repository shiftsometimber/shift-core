import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,unlinkSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

// Reuse the successful supplement verifier, extending its hub expectations for
// the newer, already-live Testing & Wellbeing card. No product check is removed.
const sourcePath=new URL('../../health-nutrition/browser-qa.mjs',import.meta.url);
const temporary=new URL('../../health-nutrition/browser-composed-release.mjs',import.meta.url);
let source=readFileSync(sourcePath,'utf8');
for(const [before,after] of [
 ["['Bloods','Energy & testosterone','Fertility','Hair & skin','Heart health','Mental wellbeing','Sleep','Supplements & Nutrition']","['Bloods','Energy & testosterone','Fertility','Hair & skin','Heart health','Mental wellbeing','Sleep','Supplements & Nutrition','Testing & Wellbeing']"],
 ["['Supplements & Nutrition','rgb(112, 119, 98)']]","['Supplements & Nutrition','rgb(112, 119, 98)'],['Testing & Wellbeing','rgb(231, 227, 218)']]"]
]){
 assert.equal(source.split(before).length,2,'Browser preservation expectation moved');source=source.replace(before,after);
}
writeFileSync(temporary,source);
try{execFileSync(process.execPath,[fileURLToPath(temporary),'--live'],{stdio:'inherit',timeout:175000});}
finally{unlinkSync(temporary);}
