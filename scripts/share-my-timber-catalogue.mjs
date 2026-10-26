import vm from 'node:vm';
import {createHash} from 'node:crypto';
// Share the unchanged approved catalogue already present in the current support
// module. Match its provenance and complete value before exposing one binding.
// No existing function or catalogue literal is rewritten.
export function shareCatalogue(source,expected){
 const literal=JSON.stringify(expected.proof).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const expression=new RegExp('([A-Za-z_$][\\w$]*)=(?:Object\\.freeze\\()?\\{proof:'+literal,'g');
 const matches=[...source.matchAll(expression)];
 if(matches.length!==1)throw Error('Current catalogue binding is not uniquely identifiable');
 const match=matches[0],start=source.indexOf('{',match.index);let depth=0,quote=null,escaped=false,end=-1;
 for(let i=start;i<source.length;i++){
  const ch=source[i];
  if(quote){if(escaped)escaped=false;else if(ch==='\\')escaped=true;else if(ch===quote)quote=null;continue;}
  if(ch==='"'||ch==="'"||ch==='`'){quote=ch;continue;}
  if(ch==='{')depth++;else if(ch==='}'&&--depth===0){end=i+1;break;}
 }
 if(end<0)throw Error('Catalogue literal is incomplete');
 const actual=vm.runInNewContext('('+source.slice(start,end)+')',Object.create(null),{timeout:10000});
 const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 const fingerprint=v=>createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
 const expectedHash=fingerprint(expected);
 if(fingerprint(actual)!==expectedHash)throw Error('The source catalogue differs from the deployed catalogue; reconcile it before building');
 const extra='\nexport {'+match[1]+' as UK_FULL_PUBLICATION};\n';
 return {source:source.includes(' as UK_FULL_PUBLICATION}')?source:source+extra,proof:{binding:match[1],sourceSHA256:createHash('sha256').update(source).digest('hex'),catalogueSHA256:expectedHash,existingBytesUnchanged:true}};
}
