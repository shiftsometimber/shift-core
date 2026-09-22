import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schemaCommandArgs} from '../../release/member-details-schema.mjs';
test('single additive schema uses bound command JSON, including leading SQL comments',()=>{
 const sql=readFileSync('member-experience/member-details.sql','utf8'),args=schemaCommandArgs();
 assert.deepEqual(args,['d1','execute','DB','--remote','--config','wrangler.jsonc','--json','--command='+sql]);
 assert(!args.includes('--file'));assert(!args.includes('--command'));
 assert(args.at(-1).startsWith('--command=-- Account'));
 assert.equal((sql.match(/CREATE TABLE/g)||[]).length,1);
 assert(!/\b(?:INSERT|UPDATE|DELETE|DROP|ALTER)\b/.test(sql.replace(/--[^\n]*/g,'').replace(/ON DELETE CASCADE/,'')));
});
