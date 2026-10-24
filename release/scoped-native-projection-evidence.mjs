import {readFileSync,lstatSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {immutableHistorySourceHead,immutableHistorySourceToken} from './immutable-git-facts.mjs';
import {nativeNavigationFreshSourceChecker} from './recorded-week-navigation-outer-frame-20261018.mjs';

// This utility has no admission authority. Each production owner keeps its key
// private and supplies only its own zero-argument native constructor. Supplied
// source readers must bypass it. No disk receipt or caller verdict is accepted.
const scopes=new WeakMap();
const freeze=Object.freeze,descriptors=Object.getOwnPropertyDescriptors,proto=Object.getPrototypeOf;
function freezeNativeData(value,seen=new Set()){
 if(value===null||typeof value!=='object')return;
 if(seen.has(value))return;seen.add(value);
 if(![Object.prototype,Array.prototype,null].includes(proto(value)))throw Error('Unsupported projection data');
 const fields=descriptors(value);
 for(const key of Reflect.ownKeys(fields)){
  if(typeof key!=='string')throw Error('Unsupported projection key');
  const d=fields[key];if(!Object.hasOwn(d,'value'))throw Error('Projection accessors cannot be retained');
  freezeNativeData(d.value,seen);
 }
 freeze(value);
}
function gitNamespaceStamp(){
 try{
  const hash=createHash('sha256');let left=100000;
  const walk=path=>{
   if(--left<0)throw Error('Bounded native namespace required');
   const s=lstatSync(path,{bigint:true,throwIfNoEntry:false});
   hash.update(path+'\0');
   if(!s){hash.update('absent\0');return;}
   if(s.isSymbolicLink()||!s.isFile()&&!s.isDirectory())throw Error('Ordinary native Git storage required');
   hash.update([s.dev,s.ino,s.mode,s.size,s.mtimeNs,s.ctimeNs].map(String).join(':')+'\0');
   if(s.isDirectory())for(const name of readdirSync(path).sort())walk(resolve(path,name));
  };
  walk(resolve('.git/objects'));walk(resolve('.git/refs'));
  return hash.digest('hex');
 }catch{return null;}
}
export function reuseExactNativeProjection(owner,construct){
 const token=immutableHistorySourceToken();
 if(!token)return construct();
 let entries=scopes.get(token);if(!entries){entries=new WeakMap();scopes.set(token,entries);}
 const previous=entries.get(owner);
 if(previous){
  previous.check();
  const before=gitNamespaceStamp();
  if(before!==null&&before===previous.namespace){
   previous.value.assertCurrent();previous.check();
   if(gitNamespaceStamp()===before)return previous.value;
  }
  entries.delete(owner);
 }
 const before=gitNamespaceStamp(),value=construct();
 // Original native constructor and every original assertion execute on a miss.
 if(!value||value.nativeSource!==true||!Object.isFrozen(value)||typeof value.assertCurrent!=='function'||before===null)return value;
 value.assertCurrent();
 const check=nativeNavigationFreshSourceChecker(immutableHistorySourceHead());check();
 const after=gitNamespaceStamp();if(after===null||after!==before)return value;
 try{freezeNativeData(value);}catch{return value;}
 check();if(gitNamespaceStamp()!==after)return value;
 entries.set(owner,{value,check,namespace:after});return value;
}
