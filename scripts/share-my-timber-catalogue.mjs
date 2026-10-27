import vm from 'node:vm';
import {createHash} from 'node:crypto';
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const fingerprint=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
function locate(source,expected){
 const literal=JSON.stringify(expected.proof).replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');
 const expression=new RegExp('([A-Za-z_$][\\w$]*)\\s*=\\s*(?:Object\\.freeze\\(\\s*)?\\{\\s*(?:"proof"|proof)\\s*:\\s*'+literal,'g'),matches=[...source.matchAll(expression)];
 if(matches.length!==1)throw Error('Current catalogue binding is not uniquely identifiable');
 const match=matches[0],start=source.indexOf('{',match.index);let depth=0,quote=null,escaped=false,end=-1;
 for(let i=start;i<source.length;i++){const ch=source[i];if(quote){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===quote)quote=null;continue;}if(ch==='"'||ch==="'"||ch===String.fromCharCode(96)){quote=ch;continue;}if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end=i+1;break;}}
 if(end<0)throw Error('Catalogue literal is incomplete');
 const actual=vm.runInNewContext('('+source.slice(start,end)+')',Object.create(null),{timeout:10000}),expectedHash=fingerprint(expected);
 if(fingerprint(actual)!==expectedHash)throw Error('The source catalogue differs from the deployed catalogue; reconcile it before building');
 return {binding:match[1],start,end,expectedHash};
}
// Expose one exact native binding. Every existing owner byte stays unchanged.
export function shareCatalogue(source,expected){
 const c=locate(source,expected),extra='\nexport {'+c.binding+' as UK_FULL_PUBLICATION};\n';
 return {source:source.includes(' as UK_FULL_PUBLICATION}')?source:source+extra,proof:{binding:c.binding,sourceSHA256:createHash('sha256').update(source).digest('hex'),catalogueSHA256:c.expectedHash,existingBytesUnchanged:true}};
}
// The old and new handlers share the owner's exact catalogue. All functions
// remain byte-identical; only the value-checked duplicate literal is replaced.
export function shareOwnerCatalogue(owner,prior,expected){
 const shared=shareCatalogue(owner,expected),alias='__myTimberExactFullCatalogue',statement="\nimport {UK_FULL_PUBLICATION as "+alias+"} from './worker.mjs';\n";
 if(prior.includes(statement)){
  const assignments=[...prior.matchAll(new RegExp('=\\s*(?:Object\\.freeze\\(\\s*)?'+alias+'(?:\\s*\\))?\\s*[,;]','g'))];
  if(prior.split(statement).length!==2||prior.split(alias).length!==3||assignments.length!==1)throw Error('Unexpected previously shared catalogue');
  return {owner:shared.source,prior,proof:{owner:shared.proof,priorAlreadyShared:true,priorSHA256:createHash('sha256').update(prior).digest('hex')}};
 }
 if(prior.includes(alias))throw Error('Shared catalogue identifier collision');
 const c=locate(prior,expected),replacement=prior.slice(0,c.start)+alias+prior.slice(c.end)+statement;
 return {owner:shared.source,prior:replacement,proof:{owner:shared.proof,priorAlreadyShared:false,priorSHA256:createHash('sha256').update(prior).digest('hex'),literalStart:Buffer.byteLength(prior.slice(0,c.start)),literalEnd:Buffer.byteLength(prior.slice(0,c.end)),reference:alias,importStatement:statement,literalSHA256:createHash('sha256').update(prior.slice(c.start,c.end)).digest('hex'),duplicateLiteralBytesRemoved:c.end-c.start,functionsUnchanged:true}};
}
