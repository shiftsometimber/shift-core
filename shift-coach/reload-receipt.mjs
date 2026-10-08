import assert from 'node:assert/strict';
import {RELOAD_RUN,assertReconciledReloadReceipt} from '../release/approved-runtime-composition.mjs';
// Historical evidence is the original immutable attempt, never the mutable latest rerun.
// This does not certify today's serving runtime; current production checks remain required.
export async function fetchOriginalReloadProof(get){
 const run=await get('/actions/runs/'+RELOAD_RUN+'/attempts/1');
 const jobs=await get('/actions/runs/'+RELOAD_RUN+'/attempts/1/jobs?per_page=100');
 assert.equal(run.run_attempt,1,'Exact original reload attempt required');
 const matches=jobs.jobs?.filter(j=>j.id===113266037954)||[];
 assert.equal(matches.length,1,'Exact original reload job required');
 const job=matches[0];assert.equal(job.run_attempt,1,'Original reload job attempt drift');
 return {...assertReconciledReloadReceipt(run,job),attempt:1,evidence:'historical original attempt; current live acceptance remains separate'};
}