// Account-bound offline snapshots. The service worker never stores private APIs.
// Keys are non-extractable and retained in IndexedDB, never tokens/localStorage.
export function privateScreenCache(){
 const name='my-timber-v7-private',version=1;let opened=null;
 const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 const database=()=>opened||(opened=new Promise((resolve,reject)=>{const r=indexedDB.open(name,version);r.onupgradeneeded=()=>{for(const n of ['keys','snapshots','session'])if(!r.result.objectStoreNames.contains(n))r.result.createObjectStore(n);};r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();opened=null;};resolve(r.result);};r.onerror=()=>{opened=null;reject(r.error);};}));
 async function get(store,key){return request((await database()).transaction(store).objectStore(store).get(key));}
 async function put(store,key,value){const db=await database();return new Promise((resolve,reject)=>{const t=db.transaction(store,'readwrite');t.objectStore(store).put(value,key);t.oncomplete=()=>resolve();t.onerror=()=>reject(t.error);t.onabort=()=>reject(t.error);});}
 async function purge(){try{const db=await database();await new Promise((resolve,reject)=>{const t=db.transaction(['keys','snapshots','session'],'readwrite');for(const store of ['keys','snapshots','session'])t.objectStore(store).clear();t.oncomplete=resolve;t.onerror=()=>reject(t.error);});}catch{};}
 async function save(owner,expiresAt,payload){
  if(!owner||!Number.isFinite(Date.parse(expiresAt))||Date.parse(expiresAt)<=Date.now())return false;
  const old=await get('session','active');if(old&&old.owner!==String(owner))await purge();
  let key=await get('keys',String(owner));if(!key){key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']);await put('keys',String(owner),key);}
  const iv=crypto.getRandomValues(new Uint8Array(12)),bytes=new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(String(owner))},key,bytes);
  await put('snapshots',String(owner),{iv,ciphertext,savedAt:Date.now()});await put('session','active',{owner:String(owner),expiresAt});return true;
 }
 async function restore(){
  try{const session=await get('session','active');if(!session||Date.parse(session.expiresAt)<=Date.now()){await purge();return null;}
   const key=await get('keys',session.owner),record=await get('snapshots',session.owner);if(!key||!record)return null;
   const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:record.iv,additionalData:new TextEncoder().encode(session.owner)},key,record.ciphertext);
   const payload=JSON.parse(new TextDecoder().decode(plain));if(String(payload.data?.accountId)!==session.owner){await purge();return null;}
   return {...session,savedAt:record.savedAt,payload};
  }catch{await purge();return null;}
 }
 return {save,restore,purge};
}
