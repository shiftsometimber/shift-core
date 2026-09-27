import test from 'node:test';
import assert from 'node:assert/strict';
import {memberProductV7Routes} from '../member-product-v7.js';
import {GRUB_EXPANSION_SERVING_AUTHORITY} from '../grub-expansion-serving-manifest-v1.mjs';

function controlledDatabase(mode) {
  const trace = {sessionReads:0,catalogueReads:0,writes:[]};
  const changed = GRUB_EXPANSION_SERVING_AUTHORITY.protected_v1.map(({id}) => ({id,title:'Changed recipe',data_json:JSON.stringify({provenance:{final_v1_acceptance:{accepted:true}}}),review_json:'{"status":"approved"}'})).sort((a,b) => a.id.localeCompare(b.id));
  const DB = {prepare(sql) {
    const statement = {bind(...params) { this.params=params; return this; },async first() {
      if (sql.includes('FROM user_sessions')) { trace.sessionReads++; return {id:1,session_id:2,expires_at:'2999-01-01',revoked_at:null}; }
      throw new Error('A legacy route was entered before catalogue authority');
    },async all() {
      if (!sql.includes('FROM structured_content')) throw new Error('A legacy route was entered before catalogue authority');
      trace.catalogueReads++;
      if (mode === 'database-error') throw new Error('Database unavailable');
      if (mode === 'invalid-json') return {results:[{id:'a',title:'Broken',data_json:'{',review_json:'{}'}]};
      if (mode === 'invalid-pagination') return {results:[{id:'z'},{id:'a'}]};
      if (mode === 'changed-originals') return {results:changed.filter(row => row.id > this.params[0]).slice(0,this.params[1])};
      return {results:[]};
    },async run() { trace.writes.push(sql); return {meta:{changes:1}}; }};
    return statement;
  }};
  return {DB,trace};
}

test('missing or changed Grub authority returns 503 before the legacy planner or replacement can write', async () => {
  for (const endpoint of ['plan','replace']) for (const mode of ['missing','changed-originals']) {
    const {DB,trace} = controlledDatabase(mode);
    const response = await memberProductV7Routes(new Request(`https://shiftsometimber.co.uk/v1/grub/${endpoint}`,{method:'POST',headers:{Cookie:'sst_session=synthetic-test-session','Content-Type':'application/json'},body:JSON.stringify({days:3,type:'lunch',current_id:'synthetic-current'})}),{DB},{});
    assert.equal(response.status,503,`${endpoint}/${mode}`);
    assert.equal((await response.json()).error,'final_v1_publication_incomplete');
    assert.equal(trace.sessionReads,1,'V6 must not be entered and re-authenticate');
    assert.ok(trace.writes.every(sql => sql.startsWith('UPDATE user_sessions SET last_used_at=')),'Only session access bookkeeping may write');
    assert.equal(trace.writes.length,1);
  }
});

test('D1, parsing and pagination failures produce a controlled Grub 503 before plan or feedback writes', async () => {
  for (const endpoint of ['plan','replace']) for (const mode of ['database-error','invalid-json','invalid-pagination']) {
    const {DB,trace} = controlledDatabase(mode);
    const response = await memberProductV7Routes(new Request(`https://shiftsometimber.co.uk/v1/grub/${endpoint}`,{method:'POST',headers:{Cookie:'sst_session=synthetic-test-session','Content-Type':'application/json'},body:'{}'}),{DB},{});
    assert.equal(response.status,503,`${endpoint}/${mode}`);
    assert.equal((await response.json()).error,'grub_catalogue_unavailable');
    assert.equal(trace.sessionReads,1);
    assert.ok(trace.writes.every(sql => sql.startsWith('UPDATE user_sessions SET last_used_at=')));
    assert.equal(trace.writes.length,1);
  }
});
