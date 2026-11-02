// Anonymous aggregate operational timings. Never read member/session identity.
export const performanceMetricsPath='/v1/life-back/performance-metrics';
const screens=new Set(['today','journey','shop','grub','fit','support','more']),keys=new Set(['screen','visit','usableMs','serverMs','ackMs','accountMs','dataMs','outcome']),readySchemas=new WeakMap();
const schema=[
'CREATE TABLE IF NOT EXISTS my_timber_performance_buckets (hour TEXT NOT NULL,screen TEXT NOT NULL,visit TEXT NOT NULL,metric TEXT NOT NULL,bucket_ms INTEGER NOT NULL,n INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(hour,screen,visit,metric,bucket_ms))',
'CREATE TABLE IF NOT EXISTS my_timber_performance_alerts (hour TEXT NOT NULL,screen TEXT NOT NULL,visit TEXT NOT NULL,reason TEXT NOT NULL,median_ms INTEGER,samples INTEGER NOT NULL,PRIMARY KEY(hour,screen,visit,reason))'
];
async function ensure(db){if(!readySchemas.has(db))readySchemas.set(db,(async()=>{for(const sql of schema)await db.prepare(sql).run();})().catch(e=>{readySchemas.delete(db);throw e;}));return readySchemas.get(db);}
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'}});
async function bounded(request){const reader=request.body?.getReader();if(!reader)throw Error('body');const chunks=[];let n=0;try{for(;;){const r=await reader.read();if(r.done)break;n+=r.value.byteLength;if(n>1024){await reader.cancel();throw Error('size');}chunks.push(r.value);}const all=new Uint8Array(n);let at=0;for(const c of chunks){all.set(c,at);at+=c.length;}return JSON.parse(new TextDecoder().decode(all));}finally{reader.releaseLock();}}
export async function performanceMetricsRoute(request,env){
 if(new URL(request.url).pathname!==performanceMetricsPath)return null;
 if(request.method!=='POST')return reply(405,{error:'method_not_allowed'});
 const origin=request.headers.get('Origin');if(!['https://shiftsometimber.co.uk','https://www.shiftsometimber.co.uk'].includes(origin))return reply(403,{error:'origin_not_allowed'});
 if(!(request.headers.get('Content-Type')||'').startsWith('application/json'))return reply(415,{error:'json_required'});
 let body;try{body=await bounded(request);}catch{return reply(400,{error:'invalid_metrics'});}
 if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(k=>!keys.has(k))||!screens.has(body.screen)||!['fresh','warm'].includes(body.visit)||!['usable','timeout'].includes(body.outcome)||!Number.isInteger(body.usableMs)||body.usableMs<0||body.usableMs>120000)return reply(400,{error:'invalid_metrics'});
 for(const k of ['serverMs','ackMs','accountMs','dataMs'])if(body[k]!==undefined&&(!Number.isInteger(body[k])||body[k]<0||body[k]>120000))return reply(400,{error:'invalid_metrics'});
 try{
 await ensure(env.DB);const now=new Date(),hour=now.toISOString().slice(0,13)+':00:00.000Z',since=new Date(now.getTime()-86400000).toISOString(),until=now.toISOString();
 for(const metric of ['usableMs','serverMs','ackMs','accountMs','dataMs']){
 if(body[metric]===undefined)continue;
 const name=body.outcome==='timeout'&&metric==='usableMs'?'timeoutMs':metric,bucket=Math.ceil(body[metric]/25)*25;
 await env.DB.prepare('INSERT INTO my_timber_performance_buckets(hour,screen,visit,metric,bucket_ms,n) VALUES(?,?,?,?,?,1) ON CONFLICT(hour,screen,visit,metric,bucket_ms) DO UPDATE SET n=n+1').bind(hour,body.screen,body.visit,name,bucket).run();
 }
 const rows=(await env.DB.prepare('SELECT bucket_ms,SUM(n) n FROM my_timber_performance_buckets WHERE hour>=? AND hour<=? AND screen=? AND visit=? AND metric=? GROUP BY bucket_ms ORDER BY bucket_ms').bind(since,until,body.screen,body.visit,'usableMs').all()).results||[],count=rows.reduce((n,r)=>n+Number(r.n),0);let median=0,at=0;for(const r of rows){at+=Number(r.n);if(at>=Math.ceil(count/2)){median=Number(r.bucket_ms);break;}}
 const limit=body.visit==='fresh'?2000:500,reason=body.outcome==='timeout'?'screen_timeout':count>=20&&median>limit?'median_budget_exceeded':null;
 if(reason){const saved=await env.DB.prepare('INSERT OR IGNORE INTO my_timber_performance_alerts(hour,screen,visit,reason,median_ms,samples) VALUES(?,?,?,?,?,?)').bind(hour,body.screen,body.visit,reason,median,count).run();if(saved.meta?.changes)console.warn('MY_TIMBER_PERFORMANCE_BUDGET_ALERT',JSON.stringify({screen:body.screen,visit:body.visit,reason,medianMs:median,samples:count,limitMs:limit}));}
 // Only these new anonymous aggregate tables have this seven-day retention.
 if(Math.random()<.02){const cutoff=new Date(now.getTime()-7*86400000).toISOString();await env.DB.prepare('DELETE FROM my_timber_performance_buckets WHERE hour<?').bind(cutoff).run();await env.DB.prepare('DELETE FROM my_timber_performance_alerts WHERE hour<?').bind(cutoff).run();}
 return reply(202,{accepted:true,budgetAlert:!!reason});
 }catch{return reply(503,{error:'metrics_unavailable'});}
}
export function realUserPerformanceClient(){
 if(parent!==window||window.__MT_PERF_TEST__||window.__mtPerformanceMonitoring)return;window.__mtPerformanceMonitoring=true;
 let measurement=0;const visited=new Set(),screen=path=>{const u=new URL(path,location.origin);if(u.pathname==='/member/dashboard')return u.searchParams.get('timber')==='support'?'support':u.searchParams.get('timber')==='stuff'?'more':'today';if(u.pathname==='/member/life-back/journey')return 'journey';if(u.pathname==='/member/life-back/shop')return 'shop';return {'/member/grub':'grub','/member/fit':'fit'}[u.pathname]||null;};
 function allowed(){try{return window.SSTConsent?.get()?.analytics===true;}catch{return false}}
 function usable(name){const w=window.MT_PERFORMANCE?.current()||window,d=w.document,b=d.body;if(!b||b.dataset.memberSession!=='ready'||!b.hasAttribute('data-mt-shop-navigation')||w.MT_SCREEN?.pending()>0)return false;const visible=e=>{if(!e)return false;const s=w.getComputedStyle(e),r=e.getBoundingClientRect();return s.visibility!=='hidden'&&s.display!=='none'&&r.width>0&&r.height>0;};if(!visible(d.querySelector('main')))return false;if(name==='journey')return visible(d.querySelector('[data-tj-add],[data-tj-record-form],[data-tj-snapshot-text]'));if(name==='shop')return visible(d.querySelector('.mt-shop-category'));if(name==='support'||name==='more')return visible(d.querySelector('#mtUtility'));return [...d.querySelectorAll('main button,main input,main a[href]')].some(visible);}
 function transmit(body){if(!allowed())return;fetch('/v1/life-back/performance-metrics',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}).then(r=>r.ok?r.json():null).then(r=>{if(r?.budgetAlert){console.warn('My Timber performance budget alert',body.screen,body.visit);dispatchEvent(new CustomEvent('sst:performance-budget-alert',{detail:{screen:body.screen,visit:body.visit}}));}}).catch(()=>{});}
 function measure(path,started,source={}){
 const name=screen(path);if(!name)return;const token=++measurement;const visit=visited.has(name)?'warm':'fresh',deadline=performance.now()+20000;let stable=0;
 const tick=()=>{if(token!==measurement||document.hidden||['signed-out','error'].includes(document.body?.dataset.memberSession))return;if(screen(location.href)===name&&!document.querySelector('#mtShopChrome[aria-busy=true]')&&usable(name)){if(++stable<2){requestAnimationFrame(tick);return;}const w=window.MT_PERFORMANCE?.current()||window,n=w.performance.getEntriesByType('navigation')[0],body={screen:name,visit,outcome:'usable',usableMs:Math.min(120000,Math.round(performance.now()-started))};if(n&&visit==='fresh')body.serverMs=Math.max(0,Math.round(n.responseStart-n.requestStart));for(const [from,to]of [['ackMs','ackMs'],['identityMs','accountMs'],['dataAndScreenMs','dataMs']])if(Number.isFinite(source[from]))body[to]=Math.max(0,Math.min(120000,Math.round(source[from])));visited.add(name);transmit(body);return;}stable=0;if(performance.now()>deadline){transmit({screen:name,visit,outcome:'timeout',usableMs:20000});return;}requestAnimationFrame(tick);};requestAnimationFrame(tick);
 }
 document.addEventListener('mt:screen-start',e=>measure(e.detail.row.path,e.detail.started,e.detail.row));
 let initial=false;const boot=()=>{if(initial||!document.body)return;initial=true;measure(location.href,0);};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
}
export const performanceMonitorRuntime='('+realUserPerformanceClient.toString()+')();';
