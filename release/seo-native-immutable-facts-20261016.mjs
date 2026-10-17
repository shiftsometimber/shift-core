import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {TextDecoder} from 'node:util';
import {immutableHistoryExecFileSync as execFileSync} from './immutable-git-facts.mjs';
import {freshDetachedSourceHead} from './fresh-food-source-head-20261016.mjs';
const oid=/^[a-f0-9]{40}$/,maximumBytes=64e6;
const decode=bytes=>new TextDecoder('utf-8',{fatal:true}).decode(bytes);
const git=(args,options={})=>execFileSync('git',args,{maxBuffer:maximumBytes,...options});
const actualHead=()=>freshDetachedSourceHead()??decode(git(['rev-parse','HEAD'])).trim();
function path(value){assert.equal(typeof value,'string');assert(/^[A-Za-z0-9_.\/-]+$/.test(value)&&!value.startsWith('/')&&!value.split('/').some(x=>!x||x==='.'||x==='..'),'Exact immutable source path required');return value;}
export function decodeSeoBlobBatch(output,expected){
 assert(Buffer.isBuffer(output),'Native Git batch bytes required');assert(Array.isArray(expected)&&new Set(expected).size===expected.length);for(const id of expected)assert(oid.test(id),'Literal immutable blob ID required');
 let offset=0;const result=new Map();
 for(const id of expected){
  const end=output.indexOf(10,offset);assert(end>=offset,'Missing immutable batch header');
  const headerBytes=output.subarray(offset,end);assert(headerBytes.every(byte=>byte<128),'Exact ASCII immutable batch header required');const header=headerBytes.toString('ascii'),match=/^([a-f0-9]{40}) blob (0|[1-9][0-9]*)$/.exec(header);assert(match,'Exact immutable blob header required');assert.equal(match[1],id,'Immutable batch request order or identity drift');
  const size=Number(match[2]);assert(Number.isSafeInteger(size)&&size>=0&&size<=maximumBytes,'Bounded immutable blob size required');offset=end+1;assert(output.length-offset>=size+1,'Truncated immutable blob bytes');const bytes=output.subarray(offset,offset+size);offset+=size;assert.equal(output[offset++],10,'Exact immutable blob separator required');
  assert.equal(createHash('sha1').update('blob '+size+'\0').update(bytes).digest('hex'),id,'Immutable blob content identity drift');assert(!result.has(id),'Duplicate immutable batch object');result.set(id,bytes);
 }
 assert.equal(offset,output.length,'Unreviewed trailing immutable batch bytes');return result;
}
// Only immutable object facts are batched, scoped to one verification call.
// HEAD, source visibility, supplied readers and every verdict remain fresh.
export function readSeoNativeImmutableFacts({head,base,payload,maintenanceSource,paths,maintenancePaths,inversePaths,ledger}){
 for(const id of [head,base,payload,maintenanceSource])assert(oid.test(id),'Exact immutable source reference required');
 const sourcePaths=[...paths,...maintenancePaths];assert.equal(new Set(sourcePaths).size,sourcePaths.length);for(const p of [...sourcePaths,...inversePaths,ledger])path(p);
 const requests=new Map();function add(ref,list){const set=requests.get(ref)??new Set();for(const p of list)set.add(p);requests.set(ref,set);}
 add(head,[...sourcePaths,ledger]);add(maintenanceSource,maintenancePaths);add(payload,paths);add(base,[...inversePaths,ledger]);
 const maps=new Map(),ids=new Set();
 for(const[ref,set]of requests){
  const requested=[...set],raw=git(['ls-tree','-z',ref,'--',...requested]),rows=decode(raw).split('\0');assert.equal(rows.pop(),'','Native mode list must terminate exactly');const map=new Map();
  for(const row of rows){const match=/^([0-7]{6}) blob ([a-f0-9]{40})\t(.+)$/.exec(row);assert(match,'Exact native immutable mode row required');assert.equal(match[1],'100644','Only original regular source files may be batched');assert(set.has(match[3])&&!map.has(match[3]),'Unknown or duplicate native immutable path');map.set(match[3],match[2]);ids.add(match[2]);}
  assert.deepEqual([...map.keys()].sort(),requested.sort(),'Every requested native immutable source path required');maps.set(ref,map);
 }
 const expected=[...ids],objects=decodeSeoBlobBatch(git(['cat-file','--batch'],{input:Buffer.from(expected.join('\n')+'\n')}),expected);
 function object(ref,p){if(ref==='HEAD'){assert.equal(actualHead(),head,'SEO source drift: actual HEAD moved during native fact lookup');ref=head;}assert(maps.has(ref),'Unreviewed immutable fact reference');const id=maps.get(ref).get(p);assert(id,'Unreviewed immutable fact path');return id;}
 return Object.freeze({blob:(ref,p)=>object(ref,p),content:(ref,p)=>decode(objects.get(object(ref,p)))});
}
