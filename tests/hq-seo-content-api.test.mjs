import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {test} from 'node:test';
import {SEO_CONTENT_PATH, seoContentRoute} from '../hq-seo-content-api.mjs';

const origin = 'https://hq.shiftsometimber.co.uk';
const publicUrl = 'https://shiftsometimber.co.uk/articles/test';
const previewUrl = 'https://example.test/mockup';
const roles = {
  owner:['*'], admin:['*'], content:['content_read','content_write'],
  readonly:['content_read'], support:['support_read'],
};
const proposal = {
  before:'Old', after:'New', placement:'Hero', destination:'/start',
  previewLink:previewUrl, rollback:'Restore old heading',
};
const release = {
  kind:'release', title:'Release fixture', url:publicUrl, area:'core',
  proposal, status:'recommended', priority:35, next:'Review',
};
const checks = {
  draft:'pass', review:'pass', preview:'pass', mobile:'pass', desktop:'pass',
  canonical:'na', sitemap:'pass', indexability:'pass', duplicates:'pass', claims:'pass', rollback:'pass',
};

function fixture(t) {
  const sqlite = new DatabaseSync(':memory:');
  t.after(() => sqlite.close());
  sqlite.exec(readFileSync(new URL('../hq-seo-content-schema.sql', import.meta.url), 'utf8'));
  sqlite.exec('CREATE TABLE hq_audit(hq_user_id INTEGER,action TEXT,entity_type TEXT,entity_id TEXT,metadata TEXT,created_at TEXT)');
  const prepare = (sql, args = []) => ({sql, args, bind:(...bound) => prepare(sql, bound)});
  const DB = {
    prepare,
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const result = statements.map(({sql, args}) => {
          const statement = sqlite.prepare(sql);
          return /^SELECT/.test(sql.trim())
            ? {results:statement.all(...args)}
            : {meta:{changes:statement.run(...args).changes}};
        });
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const authenticate = async (request) => {
    assert.equal(new URL(request.url).pathname, '/v1/hq/me');
    assert.equal(request.method, 'GET');
    const role = request.headers.get('Authorization');
    return role
      ? Response.json({user:{id:1, role}, permissions:roles[role]})
      : Response.json({error:'unauthorised'}, {status:401});
  };
  async function call(method, path = '', body, role = 'owner', from = origin) {
    const request = new Request('https://api.shiftsometimber.co.uk' + SEO_CONTENT_PATH + path, {
      method,
      headers:{Origin:from, ...(role ? {Authorization:role} : {}), ...(body ? {'Content-Type':'application/json'} : {})},
      body:body ? JSON.stringify(body) : undefined,
    });
    const response = await seoContentRoute(request, {DB, ALLOWED_ORIGINS:origin}, {}, authenticate);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), from === origin ? origin : null);
    return {status:response.status, ...(response.status === 204 ? {} : await response.json())};
  }
  return {sqlite, call};
}

test('retains owner-only scope and imported history without trusting imported approval for new deployment', async (t) => {
  const {call} = fixture(t);
  const seed = {
    ...release, id:'legacy-release', title:'Legacy approval', status:'approved', revision:5,
    sourceData:{evidence:{source:'test'}}, history:[{action:'legacy approved'}],
    nativeWorkflow:{stage:'approved', fingerprint:'untrusted'},
  };
  assert.equal((await call('GET', '', null, '')).status, 401);
  for (const role of ['admin','content','readonly','support']) {
    assert.equal((await call('GET', '', null, role)).status, 403);
    assert.equal((await call('GET', '/legacy-release', null, role)).status, 403);
    assert.equal((await call('POST', '/import', {records:[seed]}, role)).status, 403);
  }
  assert.equal((await call('GET', '', null, 'owner', 'https://outside.test')).status, 403);
  assert.equal((await call('OPTIONS', '', null, '')).status, 204);
  assert.deepEqual(await call('POST', '/import', {records:[seed]}), {
    status:200, inserted:1, unchanged:0, conflicts:0, conflictIds:[],
  });
  assert.equal((await call('POST', '/import', {records:[seed]})).unchanged, 1);
  assert.equal((await call('POST', '/import', {records:[{...seed, title:'Changed imported source'}]})).conflicts, 1);
  const saved = await call('GET', '/legacy-release');
  assert.equal(saved.record.history[0].action, 'legacy approved');
  assert.equal(saved.record.sourceData.evidence.source, 'test');
  assert.equal(saved.record.nativeWorkflow, undefined);
  assert.equal((await call('PATCH', '/legacy-release', {
    revision:5, action:'record_deployment', data:{url:publicUrl, reference:'receipt'},
  })).status, 409);
});

test('requires the exact review, release checklist and public evidence before marking a release live', async (t) => {
  const {call} = fixture(t);
  assert.equal((await call('POST', '', {...release, status:'approved'})).status, 400);
  let result = await call('POST', '', release);
  assert.equal(result.status, 201);
  const path = '/' + result.record.id;
  const change = (revision, changes) => call('PATCH', path, {revision, changes});
  const action = (revision, name, data) => call('PATCH', path, {revision, action:name, data});
  assert.equal((await action(1, 'preview', {url:previewUrl})).status, 409);
  assert.equal((await change(1, {checks})).status, 400);
  result = await change(1, {checks:{...checks, claims:''}, qa:'Canonical unchanged for this fixture'});
  assert.equal(result.record.revision, 2);
  result = await action(2, 'preview', {url:previewUrl, note:'Both layouts checked'});
  assert.equal(result.record.status, 'previewed');
  result = await action(3, 'approve', {reference:'Owner note'});
  assert.equal(result.record.status, 'approved');
  assert.equal((await change(4, {checks:{...checks, mobile:''}})).status, 409);
  assert.equal((await action(4, 'record_deployment', {url:publicUrl, reference:'commit fixture'})).status, 409);
  result = await change(4, {checks});
  assert.equal(result.record.status, 'approved');
  result = await action(5, 'record_deployment', {url:publicUrl, reference:'commit fixture'});
  assert.equal(result.record.status, 'deployed');
  assert.equal((await action(6, 'verify', {url:'https://outside.test/articles/test', note:'Wrong host'})).status, 400);
  result = await action(6, 'verify', {
    url:'https://www.shiftsometimber.co.uk/articles/test/', note:'Checked exact copy, placement and canonical',
  });
  assert.equal(result.record.status, 'live');
  assert.equal((await call('GET', '?view=release&q=fixture')).total, 1);
  assert.equal((await call('GET', '?view=review&kind=release&limit=1&offset=1')).records.length, 0);
  result = await change(7, {proposal:{after:'Revised copy'}});
  assert.equal(result.record.status, 'recommended');
  assert.equal(result.record.approval, undefined);
  assert.deepEqual(result.record.checks, {});
  assert.equal(result.record.history.at(-1).previousProposal.proposal.after, 'New');
  assert.equal(result.record.history.at(-1).previousWorkflow.verification.note, 'Checked exact copy, placement and canonical');
  assert.equal((await action(8, 'record_deployment', {url:publicUrl, reference:'forbidden'})).status, 409);
});

test('rejects conflicting writes and rolls back record and history together if the HQ audit fails', async (t) => {
  const {sqlite, call} = fixture(t);
  const created = await call('POST', '', release);
  const path = '/' + created.record.id;
  const change = (revision, notes) => call('PATCH', path, {revision, changes:{notes}});
  const race = await Promise.all([change(1, 'A'), change(1, 'B')]);
  assert.equal(race.filter(result => result.status === 200).length, 1);
  assert.equal(race.filter(result => result.error === 'revision_conflict').length, 1);
  assert.equal(sqlite.prepare('SELECT count(*) AS n FROM hq_audit').get().n, 2);
  sqlite.exec('DROP TABLE hq_audit');
  assert.equal((await change(2, 'Rollback on audit failure')).status, 503);
  const saved = await call('GET', path);
  assert.equal(saved.record.revision, 2);
  assert.equal(saved.record.history.length, 2);
});
