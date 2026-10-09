import test from 'node:test';import assert from 'node:assert/strict';import {projectTreatment,summaryPdf} from '../treatment-model.mjs';
const record={id:'one',supply:4,status:'active',next_at:'2026-10-08T10:00:00Z'};
const event=(kind,details,i=1)=>({id:String(i),kind,details,treatment_id:'one',occurred_at:`2026-10-08T10:0${i}:00Z`,created_at:`2026-10-08T10:0${i}:00Z`});
test('dose stock, correction, repeat orders and status remain distinct with retained history',()=>{const events=[event('dose_taken',{},1),event('repeat_order',{},2),event('paused',{},3),event('supply_updated',{supply:8},4),event('dose_taken',{},5),event('finished',{},6)];const projected=projectTreatment(record,events);assert.equal(projected.supply,7);assert.equal(projected.status,'finished');assert.equal(projected.next_at,record.next_at);assert.equal(events.length,6);assert.equal(record.supply,4);assert.equal(projectTreatment(record,[...events,event('resumed',{},7)]).status,'active');});
test('other account/treatment and check-in events never change dose stock',()=>{assert.equal(projectTreatment(record,[{...event('dose_taken',{}),treatment_id:'other'},event('checkin',{weight:80})]).supply,4);assert.equal(projectTreatment(record,Array.from({length:6},(_,i)=>event('dose_taken',{},i))).supply,0);});
test('schedule and notification consent are explicitly set, not inferred from a dose',()=>{const projected=projectTreatment(record,[event('reminder_updated',{enabled:true},1),event('schedule_updated',{nextAt:null},2)]);assert.equal(projected.next_at,null);assert.equal(projected.reminder_enabled,true);});
test('PDF has paginated content, escaped values and valid byte offsets',()=>{const bytes=summaryPdf(['My Timber',...Array.from({length:110},(_,i)=>'Entry '+i+' (member) \\ note')]);const pdf=new TextDecoder().decode(bytes);assert(pdf.startsWith('%PDF-1.4'));assert(pdf.includes('/Count 3'));assert(pdf.includes('Entry 109'));const xref=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.slice(xref,xref+4),'xref');const entries=pdf.slice(xref).split('\n').filter(s=>/^\d{10} 00000 n/.test(s));entries.forEach((s,i)=>assert(pdf.slice(Number(s.slice(0,10))).startsWith((i+1)+' 0 obj')));});
test('deployed browser source survives the production bundle without serialised function helpers',async()=>{
 const {build}=await import('esbuild');const {treatmentRuntime}=await import('../treatment-page.mjs');
 const bundled=await build({entryPoints:['member-experience/treatment-page.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2022',keepNames:true,write:false});
 const deployed=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
 assert.equal(deployed.treatmentRuntime,treatmentRuntime);assert(!deployed.treatmentRuntime.includes('__name'));assert(!deployed.treatmentRuntime.includes('const summaryPdf='));
});
test('PDF text streams use real newlines and preserve readable escaped member text',()=>{
 const pdf=new TextDecoder().decode(summaryPdf(['Café — member (reported) \\ note','85.5kg\nReported side effects: nausea']));
 assert(pdf.startsWith('%PDF-1.4\n'));assert(pdf.includes('BT /F1 11 Tf 14 TL 48 792 Td\n'));
 assert(pdf.includes('(Cafe - member \\(reported\\) \\\\ note) Tj T*\n'));
 assert(pdf.includes('(85.5kg) Tj T*\n(Reported side effects: nausea) Tj T*\n'));
});
