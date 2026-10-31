// Public metadata only: keys are server-owned topics or validated barcodes.
// Shared across isolates via the existing D1 binding; never use member text,
// cookies, identifiers, photographs or private records as cache keys/values.
export async function reservePublicFetch(DB,provider,intervalMs,now=Date.now()){
 await DB.exec('CREATE TABLE IF NOT EXISTS shift_ai_public_fetch_slots(provider TEXT PRIMARY KEY,next_at INTEGER NOT NULL);');
 const result=await DB.prepare('INSERT INTO shift_ai_public_fetch_slots VALUES(?,?) ON CONFLICT(provider) DO UPDATE SET next_at=excluded.next_at WHERE next_at<=?').bind(provider,now+intervalMs,now).run();
 return result.meta?.changes===1;
}
export async function cachedPublicData(DB,key,now=Date.now()){
 await DB.exec('CREATE TABLE IF NOT EXISTS shift_ai_public_cache(cache_key TEXT PRIMARY KEY,payload TEXT NOT NULL,expires_at INTEGER NOT NULL);');
 const row=await DB.prepare('SELECT payload FROM shift_ai_public_cache WHERE cache_key=? AND expires_at>?').bind(key,now).first();
 try{return row?JSON.parse(row.payload):null}catch{return null}
}
export async function cachePublicData(DB,key,value,ttlMs,now=Date.now()){
 await DB.prepare('DELETE FROM shift_ai_public_cache WHERE expires_at<=?').bind(now).run();
 await DB.prepare('INSERT INTO shift_ai_public_cache VALUES(?,?,?) ON CONFLICT(cache_key) DO UPDATE SET payload=excluded.payload,expires_at=excluded.expires_at').bind(key,JSON.stringify(value),now+ttlMs).run();
}
export async function publicJSON(fetcher,url,{signal,timeoutMs=7000,maxBytes=400000,headers={}}={}){
 const abort=new AbortController(),stop=()=>abort.abort();let reader;
 if(signal?.aborted)stop();else signal?.addEventListener('abort',stop,{once:true});
 const timer=setTimeout(stop,timeoutMs);
 try{
  const response=await fetcher(url,{headers:{Accept:'application/json',...headers},redirect:'error',signal:abort.signal});
  if(!response.ok)throw Error('public_source_unavailable');
  reader=response.body.getReader();const decoder=new TextDecoder();let text='',size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw Error('public_source_too_large');text+=decoder.decode(value,{stream:true})}
  return JSON.parse(text+decoder.decode());
 }finally{if(reader){await reader.cancel().catch(()=>{});reader.releaseLock()}clearTimeout(timer);signal?.removeEventListener('abort',stop)}
}
