import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {CATALOGUE_PUBLICATION_RELEASE} from '../catalogue-publication-release-v1.mjs';
import {runPublicationClient,assertCurrentMain} from '../scripts/catalogue-publication-client.mjs';

const sha='1'.repeat(40),release={...CATALOGUE_PUBLICATION_RELEASE,status:'approved'};
const env={GITHUB_REPOSITORY:'shiftsometimber/shift-core',GITHUB_REF:'refs/heads/main',GITHUB_SHA:sha,GITHUB_EVENT_NAME:'push',GITHUB_ACTOR_ID:'315011648',GITHUB_TOKEN:'test-github-only',ACTIONS_ID_TOKEN_REQUEST_URL:'https://token.test/issue?api-version=1',ACTIONS_ID_TOKEN_REQUEST_TOKEN:'test-oidc-only'};
const reply=body=>new Response(JSON.stringify(body),{headers:{'content-type':'application/json'}});
const report={ok:true,release_id:release.release_id,rows_sha256:release.rows_sha256,workflow_sha:sha,original_rows_unchanged:true,transactional:true,inserted:3427,already_present:0,protected_originals:2124};

test('prepared compiled release performs zero network calls and no publication',async()=>{
  const result=await runPublicationClient({release:{...release,status:'prepared'},env:{},fetcher:()=>{throw new Error('must not connect')}});
  assert.equal(result.mutation,'skipped');assert.equal(result.rows_sha256,release.rows_sha256);
});
test('stale main rejects before requesting identity or touching the catalogue',async()=>{
  let calls=0;await assert.rejects(runPublicationClient({release,env,fetcher:async url=>{calls++;assert.match(String(url),/api.github.com/);return reply({object:{sha:'2'.repeat(40)}})}}),/stale_main_rejected/);assert.equal(calls,1);
});
test('a head change during OIDC issuance prevents publication',async()=>{
  let headChecks=0,posts=0;
  await assert.rejects(runPublicationClient({release,env,fetcher:async(url,options)=>{
    if(String(url).includes('api.github.com'))return reply({object:{sha:++headChecks===1?sha:'3'.repeat(40)}});
    if(String(url).includes('token.test'))return reply({value:'short-lived-token'});
    if(options.method==='POST')posts++;throw new Error('no post expected');
  }}),/stale_main_rejected/);assert.equal(posts,0);
});
test('approved client publishes only the pinned selector after two current-main checks',async()=>{
  let checks=0,posts=0;
  const result=await runPublicationClient({release,env,fetcher:async(url,options)=>{
    if(String(url).includes('api.github.com')){checks++;return reply({object:{sha}})}
    if(String(url).includes('token.test')){assert.equal(new URL(url).searchParams.get('audience'),'shift-catalogue-publication');return reply({value:'short-lived-token'})}
    posts++;assert.equal(String(url),'https://api.shiftsometimber.co.uk/v1/commissioning/catalogue-publication');assert.equal(checks,2);assert.equal(options.headers['x-shift-catalogue-oidc'],'short-lived-token');assert.deepEqual(JSON.parse(options.body),{release_id:release.release_id,rows_sha256:release.rows_sha256});return reply(report);
  }});assert.equal(posts,1);assert.equal(result.inserted,3427);
});
test('wrong actor, event, ref and repository cannot publish',async()=>{
  for(const bad of [{GITHUB_ACTOR_ID:'9'},{GITHUB_EVENT_NAME:'workflow_dispatch'},{GITHUB_REF:'refs/heads/feature'},{GITHUB_REPOSITORY:'fork/shift-core'}])await assert.rejects(runPublicationClient({release,env:{...env,...bad},fetcher:()=>{throw new Error('no network expected')}}),/caller_invalid|context_invalid/);
});
test('main check does not accept a failed GitHub API response',async()=>{
  await assert.rejects(assertCurrentMain(env,async()=>new Response('{}',{status:403})),/main_check_http_403/);
});
test('snapshot query contains only the exact catalogue columns and recipe/exercise partition',()=>{
  const sql=execFileSync(process.execPath,['scripts/catalogue-publication-snapshot.mjs','--sql'],{encoding:'utf8'}).trim();
  assert.equal(sql,"SELECT id,content_type,title,version,status,data_json,review_json,created_at,updated_at FROM structured_content WHERE content_type IN ('recipe','exercise') ORDER BY id;");
});
test('promotion publishes before catalogue authority verification and rechecks main immediately before deployment',()=>{
  const source=fs.readFileSync('.github/workflows/cloudflare-production-promote.yml','utf8');
  const publish=source.indexOf('run: node scripts/catalogue-publication-client.mjs');
  assert.ok(publish>source.indexOf('Verify catalogue authority, additive publication guards and timing'));
  assert.ok(publish<source.indexOf('Verify existing production food catalogue without account writes'));
  assert.match(source,/node scripts\/catalogue-publication-client\.mjs --verify-main\s+npx wrangler deploy/);
  assert.match(source,/ref: \$\{\{ github\.sha \}\}/);assert.match(source,/cancel-in-progress: false/);
});
