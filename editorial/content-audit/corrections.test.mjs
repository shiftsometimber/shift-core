import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {correctionPlan,hash,interpolate,UPDATE} from './publish-corrections.mjs';
import {articleHTML} from '../../babylove/dynamic-public.mjs';
const spec=JSON.parse(readFileSync('editorial/content-audit/approved-corrections.json')).articles[0],body=readFileSync(spec.bodyPath,'utf8');
test('Reviewed corrective payload renders one heading, actual leaflet and truthful boundary',()=>{
 assert.equal(hash(body),spec.bodySha256);
 const html=articleHTML({id:spec.id,slug:spec.slug,title:spec.title,summary:spec.summary,seo_title:spec.seoTitle,body,author:'SHIFT Team',publish_at:'2026-09-22T00:00:00Z'});
 assert.equal((html.match(/<h1\b/g)||[]).length,1);assert(html.includes('Five days or less'));assert(html.includes('More than five days'));assert(html.includes('usual scheduled day'));assert(html.includes('medicines.org.uk/emc/files/pil.13800.pdf'));assert(!html.includes('fresh weekly anchor'));assert(!html.includes('— Matt O’Brien'));assert(html.includes('does not decide whether you should inject'));assert(html.includes('commissioned clinician-led missed-dose service'));
});
test('Concurrent content, row, date or unpublished state cannot pass the source fence',()=>{
 const row={id:spec.id,slug:spec.slug,status:'published',publish_at:'2026-09-22',updated_at:spec.expectedUpdatedAt,title:spec.expectedTitle,body:'different newer content'};
 assert.throws(()=>correctionPlan(spec,row,body),/Stored content changed/);
 assert.throws(()=>correctionPlan(spec,{...row,id:999},body),/identity/);
 assert.throws(()=>correctionPlan(spec,{...row,status:'draft'},body),/published/);
 assert.throws(()=>correctionPlan(spec,{...row,publish_at:null},body),/publication/);
 assert.throws(()=>correctionPlan(spec,row,body+'changed'),/payload changed/);
});
test('Exact already-corrected article is idempotent but metadata drift is rejected',()=>{
 const row={id:spec.id,slug:spec.slug,status:'published',publish_at:'2026-09-22',title:spec.title,seo_title:spec.seoTitle,summary:spec.summary,body};
 assert(correctionPlan(spec,row,body).done);assert.throws(()=>correctionPlan(spec,{...row,summary:'newer edit'},body));
});
test('Atomic SQL fence preserves status, author and original publication; concurrent write wins',()=>{
 const db=new DatabaseSync(':memory:');db.exec("CREATE TABLE knowledge_articles(id INTEGER,title TEXT,seo_title TEXT,summary TEXT,body TEXT,updated_at TEXT,slug TEXT,status TEXT,author TEXT,publish_at TEXT);");
 db.exec("INSERT INTO knowledge_articles VALUES(5,'old','old','old','original','before','missed-wegovy-dose','published','SHIFT Team','original-date');");
 const values=[spec.title,spec.seoTitle,spec.summary,body,'after',5,spec.slug,'original','before'];
 assert.equal(db.prepare(UPDATE).run(...values).changes,1);assert.equal(db.prepare(UPDATE).run(...values).changes,0);
 const row=db.prepare('SELECT * FROM knowledge_articles').get();assert.equal(row.author,'SHIFT Team');assert.equal(row.status,'published');assert.equal(row.publish_at,'original-date');assert.equal(row.body,body);
 const sql=interpolate('SELECT ? AS value',["quote's ? stays literal"]);assert.equal(db.prepare(sql).get().value,"quote's ? stays literal");db.close();
});
