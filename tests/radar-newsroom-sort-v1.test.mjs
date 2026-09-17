import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {newsPublicationDate,newsSortKey,compareNews} from '../radar-newsroom-sort-v1.js';
import {NEWSROOM_FILTER_SCRIPT} from '../radar-newsroom-filters-v1.js';
import {radarNewsPageRoutes,NEWSROOM_ROWS_SQL} from '../radar-news-pages-v1.js';
import {DatabaseSync} from 'node:sqlite';
const row=(id,title,date,region='UK')=>({id,headline:title,region,reviewed_at:'2026-09-17',updated_at:'2026-09-17',content_package_json:JSON.stringify({headline:title,seo:{slug:'medicine-news/'+id,datePublished:date},destinations:['medicine_news']})});
test('first successful publication audit beats journal dates and later republishes',async()=>{
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE radar_events(id INTEGER,headline TEXT,region TEXT,regulator TEXT,event_type TEXT,content_package_json TEXT,source_evidence_json TEXT,reviewed_at TEXT,updated_at TEXT,created_at TEXT,status TEXT);CREATE TABLE radar_audit(event_id INTEGER,action TEXT,created_at TEXT)");
 const event=row(1,'Future journal issue','2099-12-01');
 db.prepare("INSERT INTO radar_events(id,headline,region,content_package_json,status) VALUES(?,?,?,?, 'published')").run(event.id,event.headline,event.region,event.content_package_json);
 db.exec("INSERT INTO radar_audit VALUES(1,'approved','2026-09-01'),(1,'published','2026-09-08 12:00:00'),(1,'published','2026-09-16 12:00:00'),(1,'social_published','2026-09-17')");
 const result=db.prepare(NEWSROOM_ROWS_SQL).all()[0];
 assert.equal(newsPublicationDate(result),'2026-09-08T12:00:00.000Z');
 assert.equal(newsPublicationDate(event),'','No future date is presented as already published');
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('<html><head></head><body><main>Shell</main></body></html>');
 try{
  const html=await(await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/medicine-news/1'),{DB:{prepare:()=>({all:async()=>({results:[result]})})}})).text();
  assert.match(html,/Published 8 September 2026/);assert.match(html,/"datePublished":"2026-09-08T12:00:00.000Z"/);assert.ok(!html.includes('2099-12-01'));
 }finally{globalThis.fetch=original;db.close()}
});
test('publication order ignores later reviews, keeps UTC time, and puts undated stories last',()=>{
  const rows=[row(1,'Zulu','2026-09-16T23:30:00-02:00'),row(2,'alpha','2026-09-17T00:30:00Z'),row(3,'Beta','2026-09-15'),row(4,'Undated',null),row(5,'Invalid','2026-02-30')];
  const keys=rows.map(newsSortKey),titles=order=>[...keys].sort((a,b)=>compareNews(a,b,order)).map(x=>x.title);
  assert.equal(newsPublicationDate(rows[0]),'2026-09-17T01:30:00.000Z');
  assert.equal(newsPublicationDate(row(7,'SQLite','2026-09-16 13:15:20')),'2026-09-16T13:15:20.000Z');
  assert.equal(newsPublicationDate(rows[3]),'');assert.equal(newsPublicationDate(rows[4]),'');
  assert.deepEqual(titles('newest'),['Zulu','alpha','Beta','Invalid','Undated']);
  assert.deepEqual(titles('oldest'),['Beta','alpha','Zulu','Invalid','Undated']);
  assert.deepEqual(titles('az'),['alpha','Beta','Invalid','Undated','Zulu']);
  assert.deepEqual(titles('za'),['Zulu','Undated','Invalid','Beta','alpha']);
});
test('initial HTML orders globally by publication before JavaScript and preserves article content',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>new Response('<html><head></head><body><main>Shell</main></body></html>');
 try{
  const rows=[row(1,'Older UK','2026-09-01'),row(2,'Newest international','2026-09-16','US'),row(3,'Undated',null)];
  const html=await(await radarNewsPageRoutes(new Request('https://shiftsometimber.co.uk/shift-newsroom'),{DB:{prepare:()=>({all:async()=>({results:rows})})}})).text();
  const slugs=[...html.matchAll(/data-id="([^"]+)"/g)].map(x=>x[1]);
  assert.deepEqual(slugs,['medicine-news/2','medicine-news/1','medicine-news/3']);
  assert.match(html,/Publication date unavailable/);assert.match(html,/Published <time datetime="2026-09-16T00:00:00.000Z">2026-09-16/);
 }finally{globalThis.fetch=original}
});
test('real event handlers combine sort/filter, retain sorting on clear and restore safe URL state',()=>{
 const events={},fields=['medicine','topic','region','sort'].map(name=>({name,value:name==='sort'?'newest':'',options:(name==='sort'?['newest','oldest','az','za']:['','uk','us','safety']).map(value=>({value})),focus(){}}));
 const cards=[{dataset:{id:'1',title:'Zulu',date:'2026-09-16T00:00:00Z',region:'uk'}},{dataset:{id:'2',title:'Alpha',date:'2026-09-15T00:00:00Z',region:'us'}},{dataset:{id:'3',title:'Beta',date:'',region:'uk'}}];
 const list={children:[...cards],appendChild(card){this.children=this.children.filter(x=>x!==card);this.children.push(card)}};
 const group={querySelectorAll:()=>cards},result={},empty={},reset={addEventListener:(n,fn)=>events.reset=fn},emptyReset={addEventListener:(n,fn)=>events.emptyReset=fn};
 const form={elements:{namedItem:name=>fields.find(x=>x.name===name)},querySelector:()=>reset,addEventListener:(n,fn)=>events[n]=fn};
 const location={protocol:'https:',pathname:'/shift-newsroom',search:'',hash:'#region=uk&sort=az'};let lastUrl='';
 const document={readyState:'complete',querySelector:s=>({'[data-news-filters]':form,'[data-news-list]':list,'[data-news-results]':result,'[data-news-empty]':empty,'[data-news-clear-empty]':emptyReset}[s]),querySelectorAll:s=>s==='[data-news-card]'?cards:[group]};
 vm.runInNewContext(NEWSROOM_FILTER_SCRIPT,{document,location,URLSearchParams,history:{replaceState:(a,b,url)=>lastUrl=url},window:{addEventListener:(n,fn)=>events[n]=fn}});
 const visible=()=>list.children.filter(x=>!x.hidden).map(x=>x.dataset.title);
 assert.deepEqual(visible(),['Beta','Zulu']);assert.equal(result.textContent,'Showing 2 of 3 stories');
 fields[3].value='za';events.change();assert.deepEqual(visible(),['Zulu','Beta']);assert.match(lastUrl,/#region=uk&sort=za$/);
 events.reset();assert.deepEqual(visible(),['Zulu','Beta','Alpha']);assert.equal(fields[3].value,'za');assert.equal(lastUrl,'/shift-newsroom#sort=za');
 fields[3].value='oldest';events.change();assert.deepEqual(visible(),['Alpha','Zulu','Beta']);
 fields[1].value='safety';events.change();assert.equal(empty.hidden,false);assert.equal(group.hidden,true);
 events.emptyReset();assert.deepEqual(visible(),['Alpha','Zulu','Beta']);
 location.hash='#sort=unknown&region=bogus';events.hashchange();assert.equal(fields[3].value,'newest');assert.deepEqual(visible(),['Zulu','Alpha','Beta']);
});
