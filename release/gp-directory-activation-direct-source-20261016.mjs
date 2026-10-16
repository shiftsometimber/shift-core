import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const supportedDirectBody='dc62cd24ac95bf7bba6d0086ed1c502e56c8d144125ab2a74d0f7ebfb82e549a';

const declaration='export function verifyGpMemberCodeDirect(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={}){';
const privateDeclaration='function verifyGpMemberCodeDirectBeforeActivation(c,{head=currentHead(),read=blob,readContent=content,readDiff=diff,isAncestor=ancestor}={},activation=null){';
const prefix="import {gpDirectoryActivationHistoricalView,gpActivationAuthenticatedRead,gpActivationAuthenticatedContent,gpActivationAuthenticatedDiff,gpActivationAuthenticatedAncestor} from './gp-directory-activation-direct-20261016.mjs';\n";
const captures=`const directGpBeforeActivationNative=Object.freeze({currentHead,blob,content,diff,ancestor,clean,regular});
`;
const locals=`
 // The admitted outer frame proves actual ON source and its complete inverse.
 // Every original direct-GP assertion below still executes against literal G.
 const native=directGpBeforeActivationNative;
 const currentHead=activation?()=>{activation.assertCurrent();return activation.head;}:native.currentHead;
 const blob=activation?(ref,path)=>activation.blob(ref,path):native.blob;
 const content=activation?(ref,path)=>activation.content(ref,path):native.content;
 const diff=activation?(a,b)=>activation.diff(a,b):native.diff;
 const ancestor=activation?(a,b)=>activation.ancestor(a,b):native.ancestor;
 const clean=activation?expected=>{activation.assertCurrent();native.clean(activation.rawHead);assert.equal(currentHead(),expected,'Direct GP source drift: actual HEAD moved');activation.assertCurrent();}:native.clean;
 const regular=activation?(ref,paths,{working=false}={})=>{
  activation.assertCurrent();
  const current=ref==='HEAD'||ref===activation.rawHead||ref===activation.head;
  const literal=current?activation.head:ref;
  native.regular(literal,paths,{working:working&&!current});
  if(working&&current){
   native.regular(activation.rawHead,paths,{working:true});
   for(const path of paths)assert.equal(activation.content(ref,path),native.content(literal,path),'Direct GP source drift: authenticated original working source required '+path);
  }
  activation.assertCurrent();
 }:native.regular;
`;
const suffix=`
// Reuse the direct kernel's actual native visibility guard at the ON boundary.
export function assertDirectGpActivationSourceVisible(){sourceVisible();}
export function withDirectGpActivationNativeVerification(callback){const head=currentHead();clean(head);try{return callback();}finally{clean(head);}}
const directActivationAliases=(ref,view)=>ref==='HEAD'||ref===view.rawHead||ref===view.head?['HEAD',view.rawHead,view.head]:[ref];
const directActivationLiteral=(ref,view)=>ref==='HEAD'||ref===view.rawHead||ref===view.head?view.head:ref;
function directActivationUse(view,callback){view.assertCurrent();try{return callback();}finally{view.assertCurrent();}}
function directActivationAuthenticatedDiff(reader,view){return(a,b)=>directActivationUse(view,()=>{
 let selected;
 for(const left of directActivationAliases(a,view))for(const right of directActivationAliases(b,view)){
  const value=directActivationUse(view,()=>{
   const expected=directGpBeforeActivationNative.diff(left,right);
   const supplied=reader(left,right);
   assert(Array.isArray(supplied),'GP activation source drift: Supplied diff must be an array');
   assert.deepEqual(sorted(supplied),sorted(expected),'GP activation source drift: Supplied diff changed');
   return supplied;
  });
  if(left===directActivationLiteral(a,view)&&right===directActivationLiteral(b,view))selected=value;
 }
 return selected;
});}
function directActivationNativeNegative(error){
 const empty=value=>value===null||typeof value==='string'&&value.length===0||ArrayBuffer.isView(value)&&value.byteLength===0;
 return error!==null&&typeof error==='object'&&error.status===1&&error.signal===null&&empty(error.stdout)&&empty(error.stderr)&&Array.isArray(error.output)&&error.output.length===3&&error.output[0]===null&&empty(error.output[1])&&empty(error.output[2]);
}
function directActivationAuthenticatedAncestor(reader,view){return(a,b)=>directActivationUse(view,()=>{
 let selected;
 for(const left of directActivationAliases(a,view))for(const right of directActivationAliases(b,view)){
  const value=directActivationUse(view,()=>{
   let nativePositive=true;
   try{directGpBeforeActivationNative.ancestor(left,right);}catch(error){if(!directActivationNativeNegative(error))throw error;nativePositive=false;}
   let supplied,raised,didThrow=false;
   try{supplied=reader(left,right);}catch(error){didThrow=true;raised=error;}
   if(nativePositive){if(didThrow)throw raised;assert.notEqual(supplied,false,'GP activation source drift: Supplied ancestry changed');}
   else if(didThrow){if(!directActivationNativeNegative(raised))throw raised;}
   else assert.equal(supplied,false,'GP activation source drift: Supplied negative ancestry changed');
   return supplied;
  });
  if(left===directActivationLiteral(a,view)&&right===directActivationLiteral(b,view))selected=value;
 }
 return selected;
});}
// No caller can supply this independently admitted activation capability.
export function verifyGpMemberCodeDirect(c,options={}){
 const activation=gpDirectoryActivationHistoricalView();
 if(activation.head===activation.rawHead)return verifyGpMemberCodeDirectBeforeActivation(c,options);
 assert.equal(options.head===undefined?activation.rawHead:options.head,activation.rawHead,'Direct GP source drift: actual raw activated HEAD required');
 const selected={read:options.read===undefined?blob:options.read,readContent:options.readContent===undefined?content:options.readContent,readDiff:options.readDiff===undefined?diff:options.readDiff,isAncestor:options.isAncestor===undefined?ancestor:options.isAncestor};
 for(const[name,callback]of Object.entries(selected))assert.equal(typeof callback,'function','Direct GP source drift: supplied '+name+' must remain a function');
 activation.assertCurrent();
 try{return verifyGpMemberCodeDirectBeforeActivation(c,{head:activation.head,read:gpActivationAuthenticatedRead(selected.read,activation),readContent:gpActivationAuthenticatedContent(selected.readContent,activation),readDiff:directActivationAuthenticatedDiff(selected.readDiff,activation),isAncestor:directActivationAuthenticatedAncestor(selected.isAncestor,activation)},activation);}
 finally{activation.assertCurrent();}
}
`;
const once=(source,before,after)=>{assert.equal(source.split(before).length,2,'One exact direct-GP activation bridge anchor required');return source.replace(before,after);};
export function buildDirectGpActivationBridge(source){
 assert(!source.includes(prefix),'Direct-GP activation bridge already present');
 const newline=source.indexOf('\n');
 const body=source.startsWith('const policy=')?source.slice(newline+1):source;
 if(source.startsWith('const policy=')){assert(newline>0&&source[newline-1]===';');JSON.parse(source.slice('const policy='.length,newline-1));}
 assert.equal(createHash('sha256').update(body).digest('hex'),supportedDirectBody,'Explicit reviewed native direct-GP body required before activation retarget');
 return prefix+once(source,declaration,captures+privateDeclaration+locals)+suffix;
}
export function originalDirectGpActivationBridge(source){
 assert(source.startsWith(prefix),'Exact direct-GP activation import required');
 assert(source.endsWith(suffix),'Exact direct-GP activation wrapper required');
 return once(source.slice(prefix.length,-suffix.length),captures+privateDeclaration+locals,declaration);
}
export const DIRECT_GP_ACTIVATION_BRIDGE_INVERSES=Object.freeze([
 ['',prefix,'prefix'],[declaration,captures+privateDeclaration+locals],['',suffix,'suffix'],
]);
