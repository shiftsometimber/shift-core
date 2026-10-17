// Node-only implementation of the Worker ResponseInit encoding contract.
// This module is imported by the HTTP proof, never by the production Worker.
export const NativeResponse=globalThis.Response;
const modes=new WeakMap(),originalClone=NativeResponse.prototype.clone;
function mode(init){const value=init?.encodeBody??'automatic';if(!['automatic','manual'].includes(value))throw TypeError('Unknown Worker encodeBody mode');return value}
function record(response,encoding){modes.set(response,encoding);return response}
const methods=new Map(['json','redirect','error'].map(name=>[name,(...args)=>{const encoding=name==='json'?mode(args[1]):'automatic';return record(Reflect.apply(NativeResponse[name],NativeResponse,args),encoding)}]));
export const WorkerResponse=new Proxy(NativeResponse,{
 construct(target,args,newTarget){const encoding=mode(args[1]);return record(Reflect.construct(target,args,newTarget===WorkerResponse?target:newTarget),encoding)},
 get(target,key,receiver){return methods.has(key)?methods.get(key):Reflect.get(target,key,receiver)}
});
NativeResponse.prototype.clone=function clone(){const copy=Reflect.apply(originalClone,this,[]);if(modes.has(this))record(copy,'automatic');return copy};
globalThis.Response=WorkerResponse;
// Node fetch returns its native Response rather than using the global constructor.
// Record only responses returned by the captured native fetch; arbitrary native
// responses and their clones remain rejected by responseBodyMode.
const originalFetch=globalThis.fetch;
globalThis.fetch=async function fetch(...args){const response=await Reflect.apply(originalFetch,this,args);if(!(response instanceof NativeResponse))throw TypeError('Native fetch returned a non-Response');return record(response,'automatic')};
export function responseBodyMode(response){if(!(response instanceof NativeResponse)||!modes.has(response))throw TypeError('Untracked Worker response; encoding proof rejected');return modes.get(response)}
