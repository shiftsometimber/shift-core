import vm from'node:vm';import{readFileSync,writeFileSync}from'node:fs';import{gunzipSync}from'node:zlib';const a={};vm.runInNewContext(process.binding('natives')['internal/deps/acorn/acorn/dist/acorn'],{exports:a,module:{exports:a}});
const invalid=Symbol('non-static');
export function dataNodes(source){
 const ast=a.parse(source,{ecmaVersion:'latest',sourceType:'module'}),memo=new WeakMap(),selected=[];
 function value(n){if(!n)return invalid;if(memo.has(n))return memo.get(n);let x=invalid;
  if(n.type==='Literal'&&(n.value===null||['string','boolean'].includes(typeof n.value)||typeof n.value==='number'&&Number.isFinite(n.value)&&!Object.is(n.value,-0))&&!n.regex&&!n.bigint)x=n.value;
  else if(n.type==='TemplateLiteral'&&!n.expressions.length)x=n.quasis[0].value.cooked;
  else if(n.type==='UnaryExpression'&&['-','+'].includes(n.operator)){const v=value(n.argument);if(typeof v==='number'){const v2=n.operator==='-'?-v:v;if(Number.isFinite(v2)&&!Object.is(v2,-0))x=v2;}}
  else if(n.type==='ArrayExpression'){const vs=n.elements.map(value);if(vs.every(v=>v!==invalid))x=vs;}
  else if(n.type==='ObjectExpression'){const obj={};let ok=true;for(const p of n.properties){if(p.type!=='Property'||p.computed||p.method||p.shorthand||p.kind!=='init'){ok=false;break;}const key=p.key.type==='Identifier'?p.key.name:p.key.type==='Literal'?String(p.key.value):null,v=value(p.value);if(key===null||key==='__proto__'||v===invalid){ok=false;break;}Object.defineProperty(obj,key,{value:v,writable:true,enumerable:true,configurable:true});}if(ok)x=obj;}
  memo.set(n,x);return x;
 }
 function walk(n,anc,blocked){if(!n||!n.type)return;let stop=blocked;
  if(/Function(?:Declaration|Expression)$/.test(n.type)||n.type==='ArrowFunctionExpression'){const p=anc.at(-1),obj=anc.at(-2),call=anc.at(-3),esm=p?.type==='Property'&&obj?.type==='ObjectExpression'&&call?.type==='CallExpression'&&call.callee?.type==='Identifier'&&['__esm','__commonJS'].includes(call.callee.name);stop=blocked||!esm;}
  if(!stop&&['ArrayExpression','ObjectExpression'].includes(n.type)&&n.end-n.start>=16384){const x=value(n);if(x!==invalid){const json=JSON.stringify(x);if(json){selected.push({start:n.start,end:n.end,json,type:n.type});return;}}}
  for(const[k,x]of Object.entries(n)){if(['type','start','end','loc'].includes(k))continue;if(Array.isArray(x))for(const y of x)walk(y,[...anc,n],stop);else if(x&&typeof x==='object')walk(x,[...anc,n],stop);}
 }
 walk(ast,[],false);return selected;
}
if(process.argv[1]?.endsWith('performance-static-object-inventory.mjs')){
 const c=JSON.parse(readFileSync('performance-static-text-candidate.json')),r={at:new Date().toISOString(),owners:[]};for(const o of c.owners){const v=JSON.parse(gunzipSync(readFileSync(o.capture))),modules=[];for(const m of v.modules){if(!(m.content_type||'').includes('javascript'))continue;const s=Buffer.from(m.content_base64,'base64').toString(),xs=dataNodes(s);if(xs.length)modules.push({name:m.name,staticJsBytes:xs.reduce((n,x)=>n+x.end-x.start,0),jsonBytes:xs.reduce((n,x)=>n+Buffer.byteLength(x.json),0),dataNodes:xs.length});}r.owners.push({name:o.name,staticJsBytes:modules.reduce((n,m)=>n+m.staticJsBytes,0),jsonBytes:modules.reduce((n,m)=>n+m.jsonBytes,0),modules});}writeFileSync('performance-static-object-inventory.json',JSON.stringify(r,null,2)+'\n');console.log('STATIC_OBJECT_INVENTORY',JSON.stringify(r));}