import assert from 'node:assert/strict';
import {transformSync} from 'esbuild';
// Only the function serialized with toString is reformatted by the Worker bundler.
// All remaining application bytes must still match exactly.
export function assertAppClient(actual,expected){
 const marker=';(()=>{',prefix='const myTimberFirstWeekView=';
 assert(actual.startsWith(prefix)&&expected.startsWith(prefix),'Missing first-week function');
 const a=actual.indexOf(marker),e=expected.indexOf(marker);assert(a>prefix.length&&e>prefix.length,'Missing application boundary');
 const canonical=source=>transformSync(source,{loader:'js',target:'es2022',charset:'utf8',legalComments:'none',minifyWhitespace:true}).code;
 assert.equal(canonical(actual.slice(0,a+1)),canonical(expected.slice(0,e+1)),'Compiled first-week function changed');
 assert.equal(actual.slice(a+1),expected.slice(e+1),'Application script changed outside compiled function');
}
