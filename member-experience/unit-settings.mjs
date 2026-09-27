import {authenticateMember} from '../member-state-fast-v1.js';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
export async function unitSettingsRoute(request,env){
 if(new URL(request.url).pathname!=='/v1/settings/units')return null;
 if(!['GET','PATCH'].includes(request.method))return json({error:'method_not_allowed'},405);
 const auth=await authenticateMember(request,env);if(auth.response)return auth.response;
 if(request.method==='PATCH'){
  if(request.headers.get('Origin')!==new URL(request.url).origin)return json({error:'origin_not_allowed'},403);
  const body=await request.json().catch(()=>null);
  if(!body||!['stone_lb','kg','lb'].includes(body.weight)||!['ft_in','cm'].includes(body.height))return json({error:'invalid_units'},400);
  // Only owned display preferences change. Measurements and other Journey
  // branches are preserved atomically, including concurrent Fit/Grub writes.
  const prefs={myJourney:{setup:{units:body.weight}},displayUnits:{height:body.height}};
  await env.DB.prepare(`INSERT INTO member_state(user_id,preferences,updated_at) VALUES(?,?,?)
   ON CONFLICT(user_id) DO UPDATE SET preferences=json_set(COALESCE(member_state.preferences,'{}'),
    '$.myJourney',json_set(CASE WHEN json_type(member_state.preferences,'$.myJourney')='object' THEN json_extract(member_state.preferences,'$.myJourney') ELSE '{}' END,
     '$.setup',json_set(CASE WHEN json_type(member_state.preferences,'$.myJourney.setup')='object' THEN json_extract(member_state.preferences,'$.myJourney.setup') ELSE '{}' END,'$.units',?)),
    '$.displayUnits',json_set(CASE WHEN json_type(member_state.preferences,'$.displayUnits')='object' THEN json_extract(member_state.preferences,'$.displayUnits') ELSE '{}' END,'$.height',?)),updated_at=excluded.updated_at`).bind(auth.userId,JSON.stringify(prefs),new Date().toISOString(),body.weight,body.height).run();
 }
 const row=await env.DB.prepare('SELECT preferences FROM member_state WHERE user_id=?').bind(auth.userId).first();
 const prefs=JSON.parse(row?.preferences||'{}');
 return json({units:{weight:prefs.myJourney?.setup?.units||'stone_lb',height:prefs.displayUnits?.height||'ft_in'}});
}
export function withUnitSettings(html){
 if(!html.includes('id="prefWeight"'))return html;
 html=html.replace(/<select id="prefWeight">[\s\S]*?<\/select>/,'<select id="prefWeight" disabled><option value="stone_lb">Stone &amp; pounds</option><option value="kg">Kilograms</option><option value="lb">Pounds</option></select>');
 html=html.replace(/<select id="prefHeight">[\s\S]*?<\/select>/,'<select id="prefHeight" disabled><option value="ft_in">Feet &amp; inches</option><option value="cm">Centimetres</option></select>');
 return html.replace('</body>','<script defer src="/assets/member-experience/unit-settings.mjs"></script></body>');
}
export const unitSettingsRuntime=String.raw`(()=>{
 const weight=document.getElementById('prefWeight'),height=document.getElementById('prefHeight');if(!weight||!height)return;
 const status=document.createElement('p');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.dataset.unitStatus='';height.closest('label').after(status);
 const button=document.createElement('button');button.type='button';button.className='btn btn-primary';button.textContent='Save units';button.disabled=true;status.before(button);
 const api=async(method='GET',body)=>{const r=await fetch('/v1/settings/units',{method,credentials:'same-origin',headers:{'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(r.status===401?'Please sign in again.':'Units could not be saved. Try again.');return r.json()};
 let saved;
 api().then(data=>{saved=data.units;weight.value=saved.weight;height.value=saved.height;weight.disabled=height.disabled=button.disabled=false}).catch(()=>{status.textContent='Your saved units could not load. Reload this page to try again.'});
 button.addEventListener('click',async()=>{button.disabled=weight.disabled=height.disabled=true;status.textContent='Saving…';try{const data=await api('PATCH',{weight:weight.value,height:height.value});saved=data.units;weight.value=saved.weight;height.value=saved.height;status.textContent='Units saved.'}catch(error){weight.value=saved.weight;height.value=saved.height;status.textContent=error.message}finally{button.disabled=weight.disabled=height.disabled=false}});
})();`;
