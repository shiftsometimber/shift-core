import test from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
import {claimHqMfaChallenge,hqMfaOriginAllowed} from './hq-mfa-readiness.mjs';
test('a valid MFA challenge can be consumed once, including concurrent claims; expired challenges stay denied',async()=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec("CREATE TABLE hq_mfa_challenges(id INTEGER,used_at TEXT,expires_at TEXT);INSERT INTO hq_mfa_challenges VALUES(1,NULL,'2030-01-01T12:05:00Z'),(2,NULL,'2029-01-01T00:00:00Z');");const DB={prepare(sql){return{bind(...args){return{async run(){return{meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}}}}}}}};
 const claims=await Promise.all([claimHqMfaChallenge(DB,1,'2030-01-01T12:00:00Z'),claimHqMfaChallenge(DB,1,'2030-01-01T12:00:00Z')]);assert.equal(claims.filter(Boolean).length,1);assert.equal(await claimHqMfaChallenge(DB,2,'2030-01-01T12:00:00Z'),false);
});
test('MFA enrolment changes accept only the existing authenticated HQ/API origins',()=>{
 const request=origin=>new Request('https://api.shiftsometimber.co.uk/v1/hq/mfa/setup',{method:'POST',headers:origin?{Origin:origin}:{}});for(const origin of ['https://hq.shiftsometimber.co.uk','https://api.shiftsometimber.co.uk'])assert.equal(hqMfaOriginAllowed(request(origin)),true);for(const origin of [null,'null','https://evil.example','https://shiftsometimber.co.uk','https://hq.shiftsometimber.co.uk.evil.example'])assert.equal(hqMfaOriginAllowed(request(origin)),false);
});
