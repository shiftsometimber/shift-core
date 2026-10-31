import test from 'node:test';
import assert from 'node:assert/strict';
import {waitForDeployment} from './release-state.mjs';
const previous={id:'previous',versions:[{version_id:'old-version',percentage:100}]};
const created={id:'created-zero',versions:[{version_id:'old-version',percentage:100},{version_id:'new-version',percentage:0}]};
test('Tracks the creation receipt while deployment-list reads still show the predecessor',async()=>{let reads=0,waits=0;const observed=await waitForDeployment(async()=>++reads<3?previous:created,created,{previousIds:[previous.id],pause:async()=>waits++});assert.equal(observed.id,'created-zero');assert.equal(reads,3);assert.equal(waits,2);});
test('An unrelated deployment is rejected instead of accepted as propagation',async()=>{await assert.rejects(()=>waitForDeployment(async()=>({...previous,id:'another-release'}),created,{previousIds:[previous.id],pause:async()=>{}}),/Another deployment replaced/);});
test('The expected deployment must also have the exact intended traffic split',async()=>{await assert.rejects(()=>waitForDeployment(async()=>({...created,versions:[{version_id:'new-version',percentage:100}]}),created),/unexpected traffic/);});
