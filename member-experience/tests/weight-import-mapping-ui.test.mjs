import {recordedWeekActivationHistoricalView} from '../../release/my-timber-recorded-week-scope-20261014.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8'),ui=read('frontend/member/member-progress-v1.js'),module=read('member-experience/weight-import-mapping.mjs');
const retained=JSON.parse(read('release/combined-csv-ui-original-20261014.json'));
test('the browser uses exact immutable reviewed CSV parser bytes, isolated from other Progress helpers',()=>{
 const embedded='  const explicitWeightMapping=(()=>{\n'+module.replaceAll('export function ','function ')+'\nreturn {readWeightTable,previewMappedWeights};\n})();\n';
 assert.equal(ui.split(embedded).length,2);
});
test('CSV UI changes only the existing optional weight-import component',()=>{
 const start=ui.indexOf('  const explicitWeightMapping=(()=>{'),end=ui.indexOf('\n  }',ui.indexOf('  function mountWeightImport(host){',start))+4;
 const restored=ui.slice(0,start)+retained.originalFunction+ui.slice(end);
 assert.equal(restored,execFileSync('git',['show',retained.base+':'+retained.path],{encoding:'utf8'}));
});
test('mapping must be explicit, shows converted dates and kilograms, and uses only the established confirmed import boundary',()=>{
 for(const name of ['dateColumn','weightColumn','dateFormat','unit'])assert.match(ui,new RegExp('data-map="'+name+'" required><option value="">'));
 assert.match(ui,/Converted readings to import/);assert.match(ui,/Date \(YYYY-MM-DD\)/);assert.match(ui,/Weight \(kg\)/);
 const component=ui.slice(ui.indexOf('  function mountWeightImport(host){'),ui.indexOf('\n  }',ui.indexOf('  function mountWeightImport(host){'))+4);
 assert.equal((component.match(/fetch\(/g)||[]).length,1);
 assert.match(component,/data-import-confirm/);assert.match(component,/if\(v!==version\|\|document.hidden\|\|!section.isConnected\|\|!rows\)return/);
 assert.match(component,/JSON.stringify\(\{rows\}\)/);assert.doesNotMatch(component,/JSON.stringify\(\{[^}]*text|console\.|localStorage|sessionStorage/);
 assert.match(component,/response.status===401\|\|response.status===409/);
});
test('no native widget, build, tester, production config or model source is changed by the CSV interface',()=>{
 const diff=execFileSync('git',['diff','--name-only',retained.base,recordedWeekActivationHistoricalView().head,'--','my-timber-app','wrangler.jsonc','wrangler.coaching.jsonc','shift-coach/worker.mjs'],{encoding:'utf8'}).trim();
 assert.equal(diff,'');
});
