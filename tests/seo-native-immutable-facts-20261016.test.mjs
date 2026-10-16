import test from 'node:test';import assert from 'node:assert/strict';import {createHash}from 'node:crypto';import {decodeSeoBlobBatch}from '../release/seo-native-immutable-facts-20261016.mjs';
const id=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const a=Buffer.from('Original source\n£ UTF-8\n'),b=Buffer.from('');const one=x=>Buffer.concat([Buffer.from(id(x)+' blob '+x.length+'\n'),x,Buffer.from('\n')]);const raw=Buffer.concat([one(a),one(b)]),expected=[id(a),id(b)];
test('native immutable batch preserves exact UTF8 and empty blob bytes in request order',()=>{const m=decodeSeoBlobBatch(raw,expected);assert.deepEqual(m.get(id(a)),a);assert.deepEqual(m.get(id(b)),b);});
const invalid=[
 ['unknown output type',()=>decodeSeoBlobBatch(raw.toString(),expected)],
 ['duplicate requested identities',()=>decodeSeoBlobBatch(raw,[id(a),id(a)])],
 ['nonliteral requested identity',()=>decodeSeoBlobBatch(raw,['HEAD',id(b)])],
 ['missing header terminator',()=>decodeSeoBlobBatch(Buffer.from(id(a)+' blob 2'),[id(a)])],
 ['wrong type',()=>decodeSeoBlobBatch(Buffer.from(raw.toString().replace(' blob ',' tree ')),expected)],
 ['wrong object order',()=>decodeSeoBlobBatch(raw,[...expected].reverse())],
 ['noncanonical negative size',()=>decodeSeoBlobBatch(Buffer.from(raw.toString().replace(' blob '+a.length,' blob -1')),expected)],
 ['oversize body',()=>decodeSeoBlobBatch(Buffer.from(id(a)+' blob 67108865\n'),[id(a)])],
 ['truncated body',()=>decodeSeoBlobBatch(one(a).subarray(0,-2),[id(a)])],
 ['changed separator',()=>{const x=Buffer.from(one(a));x[x.length-1]=0;decodeSeoBlobBatch(x,[id(a)]);}],
 ['changed actual blob bytes under original header',()=>{const x=Buffer.from(one(a));x[x.indexOf(10)+1]^=1;decodeSeoBlobBatch(x,[id(a)]);}],
 ['unreviewed trailing bytes',()=>decodeSeoBlobBatch(Buffer.concat([raw,Buffer.from('extra')]),expected)]
];for(const[name,run]of invalid)test('native immutable batch rejects '+name,()=>assert.throws(run));

for (const [name,position] of [['object ID',0],['blob type',id(a).length+1],['byte size',id(a).length+6]]) {
 test('native immutable batch rejects high-bit ASCII alias in '+name,()=>{
  const altered=Buffer.from(one(a));altered[position]|=0x80;
  assert.throws(()=>decodeSeoBlobBatch(altered,[id(a)]));
 });
}
test('native immutable batch rejects a non-ASCII BOM before canonical header',()=>{
 assert.throws(()=>decodeSeoBlobBatch(Buffer.concat([Buffer.from([0xef,0xbb,0xbf]),one(a)]),[id(a)]));
});
