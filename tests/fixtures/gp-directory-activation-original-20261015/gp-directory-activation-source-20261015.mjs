import assert from 'node:assert/strict';
// This builder changes only literal, reviewed hook sites. Its inverse is saved
// in the activation policy and must reconstruct the accepted GP-code source.
const once=(text,before,after)=>{assert.equal(text.split(before).length,2,'One exact activation bridge anchor required: '+before.slice(0,110));return text.replace(before,after);};
export const GP_ACTIVATION_IMPORT="import {gpDirectoryActivationHistoricalView,gpActivationAuthenticatedRead,gpActivationAuthenticatedContent,gpActivationAuthenticatedDiff,gpActivationAuthenticatedAncestor} from './gp-directory-activation-20261015.mjs';\n";
export const GP_ACTIVATION_GP_WRAPPERS=`
// First authenticate the exact flags-ON source against literal accepted GP-code
// source. The retained GP flags-OFF body then runs on that real immutable G.
export function verifyGpCodeStack(c,options={}){
 const activation=gpDirectoryActivationHistoricalView();
 if(activation.head===activation.rawHead)return verifyGpCodeStackBeforeDirectoryActivation(c,options);
 assert.equal(options.head??activation.rawHead,activation.rawHead,'GP activation source drift: Actual raw activated HEAD required');
 return verifyGpCodeStackBeforeDirectoryActivation(c,{head:activation.head,
  read:gpActivationAuthenticatedRead(options.read??blob,activation),
  readContent:gpActivationAuthenticatedContent(options.readContent??content,activation),
  readDiff:gpActivationAuthenticatedDiff(options.readDiff??diff,activation),
  isAncestor:gpActivationAuthenticatedAncestor(options.isAncestor??ancestor,activation)},activation);
}
export function gpMemberCodeHistoricalView(reader=null,{defaultReader=reader===null}={}){
 const activation=gpDirectoryActivationHistoricalView(reader===blob?null:reader,{defaultReader});
 if(activation.head===activation.rawHead)return gpMemberCodeHistoricalViewBeforeDirectoryActivation(reader,{defaultReader});
 const inner=gpMemberCodeHistoricalViewBeforeDirectoryActivation(activation.read,{defaultReader:false},activation),ref=r=>r===activation.rawHead?'HEAD':r;
 const view={...inner,rawHead:activation.rawHead,affected:p=>activation.affected(p)||inner.affected(p),
  assertCurrent:activation.assertCurrent,authentic:activation.authentic,nativeAuthentic:activation.nativeAuthentic,nativeContentAuthentic:activation.nativeContentAuthentic,
  read:(r,p)=>inner.read(ref(r),p),blob:(r,p)=>inner.blob(ref(r),p),content:(r,p)=>inner.content(ref(r),p),
  diff:(a,b)=>diff(a==='HEAD'||a===activation.rawHead?inner.head:a,b==='HEAD'||b===activation.rawHead?inner.head:b),
  ancestor:(a,b)=>ancestor(a==='HEAD'||a===activation.rawHead?inner.head:a,b==='HEAD'||b===activation.rawHead?inner.head:b),
  currentContent:content,gpDirectoryActivationContext:activation};
 admittedViews.add(view);Object.freeze(view);for(const kind of['read','blob','content','diff','ancestor'])admittedReaders.set(view[kind],Object.freeze({kind,view}));view.assertCurrent();return view;
}
`;
export const GP_ACTIVATION_GP_REPLACEMENTS=Object.freeze([
 ['export function verifyGpCodeStack(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={}){','function verifyGpCodeStackBeforeDirectoryActivation(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={},activation=null){'],
 [' clean();return withImmutableHistoryVerification(()=>{const actual=currentHead();try{',' clean();return withImmutableHistoryVerification(()=>{const rawCurrent=currentHead(),actual=activation?activation.head:rawCurrent;try{'],
 ['headNow:()=>{assertUnchangedRaw(actual);return policy.originalHead;},clean:()=>assertUnchangedRaw(actual)','headNow:()=>{assertUnchangedRaw(rawCurrent);if(activation)activation.assertCurrent();return policy.originalHead;},clean:()=>{assertUnchangedRaw(rawCurrent);if(activation)activation.assertCurrent();}'],
 [' }finally{assertUnchangedRaw(actual);}});',' }finally{assertUnchangedRaw(rawCurrent);if(activation)activation.assertCurrent();}});'],
 ['export function gpMemberCodeHistoricalView(reader=null,{defaultReader=reader===null}={}){','function gpMemberCodeHistoricalViewBeforeDirectoryActivation(reader=null,{defaultReader=reader===null}={},activation=null){'],
 [' const rawHead=currentHead(),record=JSON.parse(content(rawHead,manifest)),c=record[key],sourceReader=reader===null?blob:reader;assert.equal(typeof sourceReader,\'function\');const assertCurrent=()=>assertUnchangedRaw(rawHead);'," const rawHead=activation?activation.head:currentHead(),record=activation?activation.record:JSON.parse(content(rawHead,manifest)),c=record[key],sourceReader=reader===null?blob:reader;assert.equal(typeof sourceReader,'function');const assertCurrent=()=>{assertUnchangedRaw(activation?activation.rawHead:rawHead);if(activation)activation.assertCurrent();};"],
 [' if(c)verifyGpCodeStack(c,{head:rawHead});',' if(c)verifyGpCodeStackBeforeDirectoryActivation(c,{head:rawHead,...(activation?{read:activation.blob,readContent:activation.content,readDiff:activation.diff,isAncestor:activation.ancestor}:{})},activation);']
].map(p=>Object.freeze(p)));
export function buildGpActivationBridge(original){assert(!original.includes(GP_ACTIVATION_IMPORT),'Activation bridge already present');let next=original;for(const[b,a]of GP_ACTIVATION_GP_REPLACEMENTS)next=once(next,b,a);return GP_ACTIVATION_IMPORT+next+GP_ACTIVATION_GP_WRAPPERS;}
export function originalGpActivationBridge(current){assert(current.startsWith(GP_ACTIVATION_IMPORT),'Exact independent activation import required');assert(current.endsWith(GP_ACTIVATION_GP_WRAPPERS),'Exact activation wrappers required');let original=current.slice(GP_ACTIVATION_IMPORT.length,-GP_ACTIVATION_GP_WRAPPERS.length);for(const[b,a]of[...GP_ACTIVATION_GP_REPLACEMENTS].reverse())original=once(original,a,b);return original;}
