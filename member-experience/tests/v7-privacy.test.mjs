import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {fixture} from '../../health-passport/fixture.mjs';import {erasureDatabase} from '../v7-privacy.mjs';
const tables=new Set(['mt_v7_crews','mt_v7_crew_members','mt_v7_crew_invites','mt_v7_effort']);
function setup(t){const f=fixture({seed:false});t.after(()=>f.close());f.db.exec(fs.readFileSync(new URL('../v7-crew-schema.sql',import.meta.url),'utf8'));f.db.exec("INSERT INTO mt_v7_crews VALUES('crew',1,'2026-11-03');INSERT INTO mt_v7_crew_members VALUES('crew',1,'One','2026-11-03'),('crew',2,'Two','2026-11-03');INSERT INTO mt_v7_crew_invites VALUES('hash','crew',1,'2026-12-01');INSERT INTO mt_v7_effort VALUES(1,'2026-11-02',1,'2026-11-03'),(2,'2026-11-02',2,'2026-11-03');UPDATE member_state SET preferences='{\"lifeBack\":{\"progress\":{\"v7\":{}}},\"v7NutritionDay\":{\"proteinG\":20}}' WHERE user_id=1;");return f;}
test('existing health erasure transaction also clears only the requesting account V7 stores',async t=>{
 const f=setup(t),DB=erasureDatabase(f.env.DB,1,tables,true);await DB.batch([DB.prepare("UPDATE member_state SET preferences=json_remove(preferences,'$.lifeBack') WHERE user_id=?").bind(1)]);
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM mt_v7_crew_members WHERE user_id=1').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM mt_v7_effort WHERE user_id=1').get().n,0);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM mt_v7_crew_invites').get().n,0);
 assert.equal(f.db.prepare('SELECT alias FROM mt_v7_crew_members WHERE user_id=2').get().alias,'Two');assert.equal(f.db.prepare('SELECT created_by FROM mt_v7_crews').get().created_by,null);
 assert(!('v7NutritionDay' in JSON.parse(f.db.prepare('SELECT preferences FROM member_state WHERE user_id=1').get().preferences)));
});
test('a failed original erasure rolls back V7 additions in the same transaction',async t=>{
 const f=setup(t),DB=erasureDatabase(f.env.DB,1,tables,true);await assert.rejects(DB.batch([DB.prepare("UPDATE member_state SET preferences=json_remove(preferences,'$.lifeBack') WHERE user_id=?").bind(1),DB.prepare("INSERT INTO mt_v7_crews VALUES('crew',1,'duplicate')")]));
 assert.equal(f.db.prepare('SELECT COUNT(*) n FROM mt_v7_crew_members').get().n,2);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM mt_v7_effort').get().n,2);assert.equal(f.db.prepare('SELECT COUNT(*) n FROM mt_v7_crew_invites').get().n,1);
});
