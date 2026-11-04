// Build-time extraction of the exact serving generator declarations. Resolved
// lexical references retain dependencies and their initialisation statements;
// the unrelated HTTP application/document graph is not instantiated in the job.
import {createRequire} from 'node:module';import crypto from 'node:crypto';
const require=createRequire('/private/tmp/my-timber-v7-compiler/package.json'),{parse}=require('acorn'),{analyze}=require('eslint-scope');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
export function generatorSubset(source,exports){
 const ast=parse(source,{ecmaVersion:'latest',sourceType:'module',ranges:true}),manager=analyze(ast,{ecmaVersion:2022,sourceType:'module',optimistic:true,ignoreEval:false,impliedStrict:true}),scope=manager.scopes.find(s=>s.type==='module');
 if(!scope)throw Error('Serving source has no module scope');const nodes=ast.body,vars=new Map(scope.variables.map(v=>[v.name,v])),dependencies=nodes.map(()=>new Set()),effects=new Map(),definitions=new Map();
 function index(at){let lo=0,hi=nodes.length-1;while(lo<=hi){const m=(lo+hi)>>1;if(at<nodes[m].start)hi=m-1;else if(at>=nodes[m].end)lo=m+1;else return m;}throw Error('Unmapped lexical reference');}
 const declaration=n=>/^(?:VariableDeclaration|FunctionDeclaration|ClassDeclaration|ImportDeclaration|ExportNamedDeclaration|ExportDefaultDeclaration)$/.test(n.type);
 for(const v of scope.variables){definitions.set(v.name,new Set(v.defs.map(d=>index(d.name.start))));effects.set(v.name,new Set());for(const ref of v.references){const i=index(ref.identifier.start);dependencies[i].add(v.name);if(ref.isWrite()||(!declaration(nodes[i])&&v.name!=='__name'))effects.get(v.name).add(i);}}
 const included=new Set(),reached=new Set(),queue=Object.values(exports);
 while(queue.length){const name=queue.pop();if(reached.has(name))continue;reached.add(name);const v=vars.get(name);if(!v)throw Error('Serving generator dependency missing: '+name);for(const i of [...definitions.get(name),...effects.get(name)])if(!included.has(i)){included.add(i);for(const dep of dependencies[i])if(!reached.has(dep))queue.push(dep);}}
 const selected=[...included].sort((a,b)=>a-b).map(i=>{const node=nodes[i];if(node.type==='ExportNamedDeclaration'){if(!node.declaration)return null;return node.declaration;}if(node.type==='ExportDefaultDeclaration')throw Error('Generator unexpectedly depends on the HTTP default application');return node;}).filter(Boolean);
 const code=selected.map(n=>source.slice(n.start,n.end)).join('\n')+'\nexport {'+Object.entries(exports).map(([publicName,localName])=>localName+(localName===publicName?'':' as '+publicName)).join(',')+'};\n';
 // Parsing catches a missing lexical definition or malformed extraction before
 // the provider sees any candidate. Every retained statement is byte-identical.
 parse(code,{ecmaVersion:'latest',sourceType:'module',ranges:true});
 return {code,manifest:{sourceSHA256:hash(source),subsetSHA256:hash(code),sourceBytes:Buffer.byteLength(source),subsetBytes:Buffer.byteLength(code),retainedStatements:selected.length,retainedBindings:[...reached].sort(),statementHashes:selected.map(n=>({start:n.start,end:n.end,sha256:hash(source.slice(n.start,n.end))}))}};
}
