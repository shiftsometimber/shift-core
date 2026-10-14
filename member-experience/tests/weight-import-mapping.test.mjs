import test from 'node:test';import assert from 'node:assert/strict';
import {readWeightTable,previewMappedWeights} from '../weight-import-mapping.mjs';
const NOW=Date.parse('2026-10-13T12:00:00Z');
const mapping={dateColumn:0,weightColumn:1,dateFormat:'ymd',unit:'kg'};
const run=(text,m={})=>previewMappedWeights(text,{...mapping,...m},NOW);
test('Imported header names do not dictate mappings; unrelated private columns stay out',()=>{
 const p=run('Recorded,Mass,Notes,Dose\n2026-10-12,94.5,private,12.5');
 assert.deepEqual(p.rows,[{on:'2026-10-12',weightKg:94.5}]);assert.equal(JSON.stringify(p.rows).includes('private'),false);
});
test('Explicit date format disambiguates day/month instead of guessing',()=>{
 assert.equal(run('date,kg\n01/02/2026,94',{dateFormat:'dmy'}).rows[0].on,'2026-02-01');
 assert.equal(run('date,kg\n01/02/2026,94',{dateFormat:'mdy'}).rows[0].on,'2026-01-02');
});
test('Pounds are explicitly converted without claiming a competitor format',()=>{
 assert.equal(run('when,pounds\n2026-10-12,210',{unit:'lb'}).rows[0].weightKg,95.254);
});
test('Whole stones and separate pounds are converted',()=>{
 assert.equal(run('when,stone,pounds\n2026-10-12,14,7',{unit:'st_lb',poundsColumn:2}).rows[0].weightKg,92.079);
});
test('Semicolon with explicitly selected decimal comma and BOM/CRLF',()=>{
 assert.equal(run('\uFEFFDate;Mass\r\n12/10/2026;94,5\r\n',{delimiter:';',decimal:',',dateFormat:'dmy'}).rows[0].weightKg,94.5);
});
test('Quoted commas, escaped quotes and newlines in ignored fields parse without leakage',()=>{
 const p=run('date,kg,note\n2026-10-12,94,"private, \"\"quoted\"\"\nline"');
 assert.deepEqual(p.rows,[{on:'2026-10-12',weightKg:94}]);
});
test('Leap year, midnight UTC and today are exact',()=>{
 assert.equal(run('d,w\n2024-02-29,94\n2026-10-13,93').rows.length,2);
});
test('Invalid dates, timestamps, future dates and two-digit years fail the whole preview',()=>{
 for(const d of ['2026-02-29','2026-13-01','2026-10-14','2026-10-12T12:00:00Z','26-10-12'])assert.throws(()=>run(`d,w\n${d},94`));
});
test('Duplicate dates never silently overwrite or collapse',()=>{
 assert.throws(()=>run('d,w\n2026-10-12,94\n2026-10-12,93'),/one reading/);
});
test('Formulas, unit suffixes, exponentials, thousand separators and negative values refused',()=>{
 for(const v of ['=94','+94','94kg','9.4e1','-94','Infinity','NaN','"1,000"'])assert.throws(()=>run(`d,w\n2026-10-12,${v}`));
});
test('Range validation runs before rounding and pounds must be below fourteen',()=>{
 for(const v of ['19.9999','400.0001','0'])assert.throws(()=>run(`d,w\n2026-10-12,${v}`));
 assert.throws(()=>run('d,st,lb\n2026-10-12,14,14',{unit:'st_lb',poundsColumn:2}));
 assert.throws(()=>run('d,st,lb\n2026-10-12,14.5,7',{unit:'st_lb',poundsColumn:2}));
});
test('Missing mapping, duplicate columns and unsupported choices refused',()=>{
 for(const m of [{weightColumn:0},{dateColumn:9},{dateFormat:'auto'},{unit:'auto'},{delimiter:'|'},{decimal:'auto'}])assert.throws(()=>run('d,w\n2026-10-12,94',m));
 assert.throws(()=>previewMappedWeights('d,w\n2026-10-12,94',null,NOW));
});
test('Malformed CSV and oversized UTF-8 fail rather than dropping rows',()=>{
 for(const t of ['d,w\n2026-10-12,"94','d,w\n2026-10-12,"94"x','d,w\n2026-10-12,94,extra'])assert.throws(()=>run(t));
 assert.throws(()=>readWeightTable('d,w\n'+ '£'.repeat(17000)),/32 KB/);
});
test('Tab-separated inputs and column order are explicitly selectable',()=>{
 assert.equal(run('Mass\tDate\n94\t2026-10-12',{delimiter:'\t',dateColumn:1,weightColumn:0}).rows[0].weightKg,94);
});
test('365 readings accepted; 366 refused',()=>{
 const lines=Array.from({length:365},(_,i)=>new Date(NOW-i*86400000).toISOString().slice(0,10)+',94');
 assert.equal(run('d,w\n'+lines.join('\n')).rows.length,365);
 assert.throws(()=>run('d,w\n'+lines.join('\n')+'\n2020-01-01,94'),/365/);
});
