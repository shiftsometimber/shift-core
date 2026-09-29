export const connectedHealthMarkup=`<section id="connectedHealthPanel" aria-labelledby="connectedHealthTitle">
<p class="eyebrow">MY TIMBER · CONNECTED HEALTH</p><h2 id="connectedHealthTitle">Your health data, without the typing.</h2>
<p>Connect the health data already on your phone. My Timber can use supported readings from compatible watches, scales, blood-pressure monitors and other apps.</p>
<div id="connectedHealthState" class="ch-state" role="status">Checking connected health…</div>
<div id="connectedHealthActions" class="ch-actions" hidden>
 <a id="connectedHealthConnect" class="ch-button" href="mytimber-health://sync">Connect &amp; sync health data</a>
 <button id="connectedHealthDisconnect" type="button" hidden>Disconnect this health source</button>
</div>
<div id="connectedHealthLatest" class="ch-latest" hidden><h3>Latest synced readings</h3><dl id="connectedHealthReadings"></dl></div>
<p class="ch-help">You choose what Apple Health or Health Connect lets My Timber read. You can change those permissions on your phone at any time. My Timber still works if you don't connect anything.</p>
</section>`;
export const connectedHealthStyles=String.raw`
#connectedHealthPanel{box-sizing:border-box;max-width:920px;width:100%;margin:0 auto 32px;padding:28px;border:1px solid #707762;border-radius:16px;background:#050505;color:#e7e3da}
#connectedHealthPanel *{box-sizing:border-box}#connectedHealthPanel :is(h2,h3,p,dt,dd){color:#e7e3da!important;-webkit-text-fill-color:currentColor}
#connectedHealthPanel h2{font-size:32px;line-height:1.15;margin:8px 0 12px;letter-spacing:-.03em}#connectedHealthPanel h3{margin:22px 0 10px}
#connectedHealthPanel .eyebrow{font-size:11px;letter-spacing:.12em;font-weight:800;color:#c5cdb3!important}
#connectedHealthPanel .ch-state{margin:18px 0;padding:14px;border-left:3px solid #707762;background:#11140f}
#connectedHealthPanel .ch-actions{display:flex;flex-wrap:wrap;gap:10px;margin:16px 0}
#connectedHealthPanel :is(.ch-button,button){display:inline-flex;align-items:center;min-height:46px;padding:11px 16px;border:1px solid #707762;border-radius:8px;background:#e7e3da!important;color:#050505!important;-webkit-text-fill-color:#050505!important;font:700 15px/1.3 Arial,sans-serif;text-decoration:none;cursor:pointer}
#connectedHealthPanel .ch-latest dl{display:grid;grid-template-columns:minmax(150px,1fr) 1fr;gap:8px 16px;margin:0}#connectedHealthPanel dt{font-weight:700}#connectedHealthPanel dd{margin:0}
#connectedHealthPanel .ch-help{font-size:14px;opacity:.88}#connectedHealthPanel [hidden]{display:none!important}
@media(max-width:600px){#connectedHealthPanel{padding:20px 16px}#connectedHealthPanel h2{font-size:28px}#connectedHealthPanel .ch-latest dl{grid-template-columns:1fr;gap:3px}#connectedHealthPanel dd{margin-bottom:10px}}
`;
export const connectedHealthRuntime=String.raw`(()=>{
'use strict';
const panel=document.getElementById('connectedHealthPanel');if(!panel||panel.dataset.bound)return;panel.dataset.bound='true';
const $=id=>document.getElementById(id),state=$('connectedHealthState'),actions=$('connectedHealthActions'),connect=$('connectedHealthConnect'),disconnect=$('connectedHealthDisconnect'),latest=$('connectedHealthLatest'),readings=$('connectedHealthReadings');
const native=/\bMyTimber\/1\.1\.0\b/.test(navigator.userAgent),apple=/iPhone|iPad|iPod/.test(navigator.userAgent),platform=apple?'apple_health':'health_connect';
const labels={weight_kg:'Weight',body_fat_pct:'Body fat',systolic_mmhg:'Blood pressure · systolic',diastolic_mmhg:'Blood pressure · diastolic',heart_rate_bpm:'Heart rate',resting_heart_rate_bpm:'Resting heart rate',oxygen_saturation_pct:'Oxygen saturation',respiratory_rate_bpm:'Respiratory rate',body_temperature_c:'Body temperature',steps:'Steps today',active_energy_kcal:'Active energy today',distance_m:'Distance today',sleep_minutes:'Sleep',exercise_minutes:'Exercise'};
const fmt=(type,r)=>{const n=Number(r.value);if(type==='distance_m'&&n>=1000)return(n/1000).toFixed(1)+' km';if(type==='sleep_minutes')return Math.round(n/60*10)/10+' h';return(Number.isInteger(n)?n:n.toFixed(1))+' '+r.unit};
async function api(path,method='GET',body){const r=await fetch(path,{method,credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(12000)});const b=await r.json().catch(()=>({}));if(!r.ok)throw Error(b.message||'Connected health could not be checked.');return b}
function draw(status,data){
 const current=status.connections?.find(x=>x.platform===platform&&x.enabled);
 actions.hidden=false;connect.hidden=!native;disconnect.hidden=!current;
 if(!status.trackingEnabled){state.textContent='Optional health tracking is off. Turn it on in My Timber before connecting a health source.';connect.hidden=true;disconnect.hidden=true;return}
 if(current)state.textContent=(platform==='apple_health'?'Apple Health':'Health Connect')+' connected'+(current.lastSyncAt?' · last synced '+new Date(current.lastSyncAt).toLocaleString():'')+'.';
 else state.textContent=native?'Nothing connected on this phone yet.':'No connected source on this browser. Open the My Timber app on your phone to connect Apple Health or Health Connect.';
 const entries=Object.entries(data?.latest||{});readings.replaceChildren();latest.hidden=!entries.length;
 for(const[type,r]of entries){if(!labels[type])continue;const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=labels[type];dd.textContent=fmt(type,r);readings.append(dt,dd)}
}
async function load(){try{const [s,d]=await Promise.all([api('/v1/device-health/status'),api('/v1/device-health/readings')]);draw(s,d)}catch(e){state.textContent=e.message;actions.hidden=true}}
disconnect.addEventListener('click',async()=>{if(!confirm('Disconnect this health source? Existing readings stay in your My Timber record unless you request their deletion.'))return;disconnect.disabled=true;try{await api('/v1/device-health/connection','DELETE',{platform});await load()}catch(e){state.textContent=e.message}finally{disconnect.disabled=false}});
window.addEventListener('focus',()=>setTimeout(load,350));document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});load();
})();`;
export function withConnectedHealth(html){
 if(html.includes('id="connectedHealthPanel"')||!/<main\b/.test(html))return html;
 return html.replace(/(<main\b[^>]*>)/,'$1'+connectedHealthMarkup).replace('</body>','<link rel="stylesheet" href="/assets/member-experience/connected-health.css"><script defer src="/assets/member-experience/connected-health.mjs"></script></body>');
}
