import core from './worker.js';

const html=(body,status=200)=>new Response(body,{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'}});

export async function memberCommissioningRoute(request,env,ctx){
  const u=new URL(request.url),p=u.pathname.replace(/\/+$/,'')||'/';
  if(request.method!=='GET'||p!=='/v1/shift/commissioning')return null;
  const probe=await core.fetch(new Request(new URL('/v1/me',request.url),{method:'GET',headers:request.headers}),env,ctx);
  if(!probe.ok)return probe;
  const user=(await probe.json()).user||{};
  return html(page(user));
}

function page(user){
  const name=escapeHtml([user.first_name,user.last_name].filter(Boolean).join(' ')||user.email||'Shifter');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Shift Member Commissioning</title><style>
  :root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172019;background:#eef1ec}body{margin:0}.wrap{max-width:1100px;margin:auto;padding:28px}.hero{background:#253128;color:#fff;border-radius:22px;padding:26px}.hero h1{margin:4px 0 8px;font-size:clamp(28px,5vw,46px)}.hero p{margin:0;opacity:.82}.warn{margin-top:14px;padding:12px 14px;background:#fff7dd;color:#5b4310;border-radius:12px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px;margin-top:18px}.card{background:#fff;border-radius:18px;padding:18px;box-shadow:0 3px 18px rgba(20,30,20,.07)}button{border:0;border-radius:12px;padding:11px 14px;font-weight:700;cursor:pointer;background:#253128;color:#fff}button.secondary{background:#e9eee7;color:#253128}.runall{font-size:16px;background:#d5e637;color:#172019}.row{display:flex;gap:8px;flex-wrap:wrap}.status{font-weight:700;margin-top:10px}.pass{color:#18733b}.fail{color:#a32424}.pending{color:#76600f}pre{white-space:pre-wrap;word-break:break-word;background:#111914;color:#dce7df;border-radius:14px;padding:14px;max-height:360px;overflow:auto;font-size:12px}.wide{margin-top:14px}.summary{font-size:15px;line-height:1.5}input,textarea{width:100%;box-sizing:border-box;border:1px solid #cfd7cd;border-radius:10px;padding:10px;margin:7px 0 10px;font:inherit}small{color:#657066}.tag{display:inline-block;background:#e9eee7;padding:5px 8px;border-radius:999px;margin:3px 3px 0 0;font-size:12px}</style></head><body><div class="wrap">
  <section class="hero"><small>SHIFT SOME TIMBER · INTERNAL COMMISSIONING</small><h1>Member Intelligence Check</h1><p>Signed in as ${name}. One place to test Today, Grub, Fit, hydration, Conundrum, recommendations, Knowledge Graph and Shift AI context.</p></section>
  <div class="warn"><b>Commissioning note:</b> Grub, Fit and hydration tests create active plans for this member; rerunning them safely supersedes the previous active plan of the same type. The Shift AI test creates one normal conversation turn.</div>
  <section class="card wide"><div class="row"><button id="runAll" class="runall">Run full member commissioning</button><button id="refresh" class="secondary">Refresh context only</button></div><div id="overall" class="status pending">Ready.</div><div id="summary" class="summary"></div></section>
  <div class="grid">
   ${card('context','1. Unified member context','GET /v1/shift/context')}
   ${card('today','2. Shift Today','GET /v1/shift/today')}
   ${card('grub','3. Shift Grub','POST /v1/grub/plan')}
   ${card('fit','4. Shift Fit','POST /v1/fit/plan')}
   ${card('hydration','5. Hydration','POST /v1/hydration/plan')}
   ${card('conundrum','6. Conundrum','POST /v1/grub/conundrum')}
   ${card('recommend','7. Universal recommendation','POST /v1/shift/recommend')}
   ${card('latest','8. Latest plan','GET /v1/plan/latest')}
   ${card('knowledge','9. Knowledge Graph','GET /v1/shift/knowledge/search?q=protein')}
   ${card('ai','10. Shift AI plan context','POST /v1/shift-ai/chat')}
  </div>
  <section class="card wide"><h3>Conundrum ingredients</h3><textarea id="ingredients" rows="3">chicken, eggs, yoghurt, oats, tuna, potatoes, wholemeal bread, tomatoes</textarea><small>Used only by the Conundrum test.</small></section>
  <section class="card wide"><h3>Selected result</h3><pre id="output">Nothing run yet.</pre></section>
</div><script>
const tests={};
const $=s=>document.querySelector(s);
async function call(path,opts={}){const r=await fetch(path,{credentials:'include',...opts,headers:{'Accept':'application/json','Content-Type':'application/json',...(opts.headers||{})}});let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||j.message||('HTTP '+r.status));return j}
function set(id,state,data){tests[id]={state,data};const el=$('#'+id+'Status');if(el){el.className='status '+(state==='PASS'?'pass':'fail');el.textContent=state;}if(data!==undefined)$('#output').textContent=JSON.stringify(data,null,2);renderSummary()}
function renderSummary(){const ids=['context','today','grub','fit','hydration','conundrum','recommend','latest','knowledge','ai'];const done=ids.filter(x=>tests[x]);const passed=done.filter(x=>tests[x].state==='PASS').length;$('#summary').innerHTML='<p><b>'+passed+'/'+done.length+'</b> completed checks passing.</p>'+done.map(x=>'<span class="tag">'+x+': '+tests[x].state+'</span>').join('');if(done.length===ids.length){$('#overall').className='status '+(passed===ids.length?'pass':'fail');$('#overall').textContent=passed===ids.length?'FULL MEMBER COMMISSIONING PASSED':'Commissioning completed with '+(ids.length-passed)+' failure(s)';}}
async function run(id,fn){try{const data=await fn();set(id,'PASS',data);return data}catch(e){set(id,'FAIL',{error:e.message});throw e}}
const actions={
 context:()=>run('context',()=>call('/v1/shift/context')),
 today:()=>run('today',()=>call('/v1/shift/today')),
 grub:()=>run('grub',()=>call('/v1/grub/plan',{method:'POST',body:JSON.stringify({})})),
 fit:()=>run('fit',()=>call('/v1/fit/plan',{method:'POST',body:JSON.stringify({days:['Mon','Wed','Fri','Sat'],max_minutes:30})})),
 hydration:()=>run('hydration',()=>call('/v1/hydration/plan',{method:'POST',body:JSON.stringify({activity_minutes:30,hot_weather:false})})),
 conundrum:()=>run('conundrum',()=>{const items=$('#ingredients').value.split(',').map(x=>x.trim()).filter(Boolean);return call('/v1/grub/conundrum',{method:'POST',body:JSON.stringify({items})})}),
 recommend:()=>run('recommend',()=>call('/v1/shift/recommend',{method:'POST',body:JSON.stringify({intent:'Give me the best practical food or movement option for today',max_minutes:30,protein_priority:true,candidates:[{key:'walk20',name:'20-minute brisk walk',tags:['walking'],minutes:20,base_score:50},{key:'protein_yoghurt',name:'Protein yoghurt and fruit',tags:['high_protein','quick'],minutes:5,protein_g:22,base_score:50},{key:'strength25',name:'25-minute simple strength session',tags:['strength'],minutes:25,base_score:50}]})})),
 latest:()=>run('latest',()=>call('/v1/plan/latest')),
 knowledge:()=>run('knowledge',()=>call('/v1/shift/knowledge/search?q=protein&limit=10')),
 ai:()=>run('ai',()=>call('/v1/shift-ai/chat',{method:'POST',body:JSON.stringify({message:'Commissioning check: using my active Shift Grub, Fit and hydration plans only where relevant, tell me the single most useful thing to focus on today. Keep it short.'})}))
};
for(const id of Object.keys(actions))$('#'+id+'Btn').onclick=()=>actions[id]().catch(()=>{});
$('#refresh').onclick=()=>actions.context().catch(()=>{});
$('#runAll').onclick=async()=>{tests.context=undefined;$('#overall').className='status pending';$('#overall').textContent='Running 10 checks…';$('#summary').innerHTML='';for(const id of ['context','today','grub','fit','hydration','conundrum','recommend','latest','knowledge','ai']){try{await actions[id]()}catch{}}try{const final=await call('/v1/shift/context');$('#output').textContent=JSON.stringify({commissioning:tests,final_context:final},null,2)}catch{}};
</script></body></html>`;
}
function card(id,title,sub){return `<section class="card"><h3>${title}</h3><small>${sub}</small><div class="row" style="margin-top:12px"><button id="${id}Btn">Run check</button></div><div id="${id}Status" class="status pending">Not run</div></section>`}
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
