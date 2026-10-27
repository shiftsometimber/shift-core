import test from 'node:test';
import assert from 'node:assert/strict';
import {privateSituation} from '../shed-support-loop.mjs';

test('finishing a personal goal never implies that a member stopped treatment',()=>{
 assert.equal(privateSituation({memberSupport:{stage:'finished',memories:[{choice:'late',text:'Late finishes are awkward'}]}}),'late');
 assert.equal(privateSituation({memberSupport:{stage:'finished',memories:[]}}),'general');
 assert.equal(privateSituation({memberSupport:{stage:'changing'}}),'after-treatment');
 assert.equal(privateSituation({memberSupport:{stage:'stopped'}}),'after-treatment');
});
