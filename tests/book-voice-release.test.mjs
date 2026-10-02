import test from 'node:test';import assert from 'node:assert/strict';
import {BOOK_VOICE_PREVIEW,BOOK_VOICE_RUN,BOOK_VOICE_PATHS,validateBookVoice,verifyBookVoiceProof} from '../release/book-voice-scope.mjs';
test('Every exact reviewed editorial, response and preview file is required',()=>{
 const calls=[];validateBookVoice((ref,path)=>{calls.push([ref,path]);return path});assert.equal(calls.length,BOOK_VOICE_PATHS.length*2);
 for(const target of BOOK_VOICE_PATHS)assert.throws(()=>validateBookVoice((ref,path)=>path===target&&ref==='HEAD'?'unreviewed':path),/source drift/);
});
test('A failed, different or uncompleted preview cannot authorise release',async()=>{
 const valid={id:BOOK_VOICE_RUN,head_sha:BOOK_VOICE_PREVIEW,path:'.github/workflows/book-voice-preview.yml',conclusion:'success'};
 for(const wrong of [{conclusion:'failure'},{conclusion:null},{head_sha:'different'},{path:'.github/workflows/other.yml'}])await assert.rejects(verifyBookVoiceProof(async()=>({...valid,...wrong})));
});
