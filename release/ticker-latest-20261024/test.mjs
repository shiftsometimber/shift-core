import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('./public-news-ticker-v1.js',import.meta.url),'utf8');
const selector=source.slice(source.indexOf('  function publishedItems'),source.indexOf('  const start ='));
function select(rows,newsroom=true){
 const box={URL,Date,Set,Number,Array,String};vm.createContext(box);
 vm.runInContext("const origin='https://shiftsometimber.co.uk';"+selector+";this.result=publishedItems",box);
 return JSON.parse(JSON.stringify(box.result(rows,newsroom,Date.parse('2026-10-24T20:00:00Z'))));
}
const row=(id,date,more={})=>({id,headline:'Story '+id,published_at:date,destinations:['medicine_news'],metadata:{slug:'medicine-news/story-'+id,datePublished:date},...more});
test('selects newest published news without frozen edition IDs',()=>{
 const rows=[row(1,'2026-09-01'),row(2,'2026-10-20'),row(3,'2026-10-24')];
 assert.deepEqual(select(rows).map(x=>x.id),[3,2,1]);
 rows.push(row(4,'2026-10-24T19:00:00Z'));
 assert.equal(select(rows)[0].id,4);
});
test('revision sorts first while original publication date is preserved',()=>{
 const r=row(1,'2026-09-01');r.metadata.dateModified='2026-10-24';
 const [x]=select([row(2,'2026-10-20'),r]);
 assert.equal(x.id,1);assert.equal(x.published_at,'2026-09-01T00:00:00.000Z');assert.equal(x.revised,true);
});
test('excludes non-Newsroom destinations, unsafe URLs and invalid or future dates',()=>{
 const rows=[row(1,'2026-10-20',{destinations:['draft']}),row(2,'invalid'),row(3,'2026-10-25')];
 for(const url of ['https://evil.example/news','javascript:alert(1)','//evil.example/news','https://shiftsometimber.co.uk@evil.example/','https://shiftsometimber.co.uk/medicine-news/x?private=x']){
  const r=row(rows.length+10,'2026-10-20');r.metadata.canonical=url;rows.push(r);
 }
 assert.equal(select(rows).length,0);
});
test('deduplicates canonical paths and limits eight ordered stories',()=>{
 const rows=Array.from({length:12},(_,i)=>row(i,'2026-10-'+String(i+1).padStart(2,'0')));
 rows.push({...rows[11]});
 const r=select(rows);assert.equal(r.length,8);assert.equal(new Set(r.map(x=>x.url)).size,8);assert.equal(r[0].id,11);
});
test('fallback accepts only dated safe published ticker items',()=>{
 const rows=[{id:1,headline:'Existing approved story',url:'/medicine-news/approved',published_at:'2026-10-20'},{id:2,headline:'Unsafe',url:'https://evil.example/',published_at:'2026-10-20'}];
 assert.equal(select(rows,false).length,1);
});
test('client keeps publication feed separate from scanner freshness and escapes headlines',()=>{
 assert(source.includes("Promise.allSettled"));assert(source.includes("link.textContent = item.headline"));
 assert(!source.includes('innerHTML'));assert(!source.includes('body.current ='));assert(!source.includes('published-newsroom-20260917'));
 assert(source.includes("duplicate.setAttribute('aria-hidden','true')"));assert(source.includes('link.tabIndex = -1'));
});
