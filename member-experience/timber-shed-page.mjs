// Authenticated My Timber companion. No community publishing and no health-record reads.
export const timberShedPage=String.raw`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><title>The Timber Shed | My Timber</title>
<style>
:root{color-scheme:dark;--black:#050505;--cream:#E7E3DA;--ash:#707762;--card:#181b17;--line:#434b3d}
*{box-sizing:border-box}body{margin:0;background:var(--black);color:var(--cream);font:16px/1.55 Arial,Helvetica,sans-serif}
a{color:inherit}button{font:inherit;cursor:pointer}button:disabled{cursor:not-allowed;opacity:.5}button:focus-visible,a:focus-visible{outline:3px solid #c1d0b6;outline-offset:3px}
.shell{width:min(1180px,calc(100% - 36px));margin:auto}.top{padding:18px 0;display:flex;align-items:center;justify-content:space-between;gap:15px;border-bottom:1px solid var(--line)}
.brand{font-weight:900;font-size:20px;letter-spacing:-.04em;text-decoration:none}.brand em{font-style:normal;color:#9cab8f}.back{font-size:13px;text-decoration:none;border:1px solid var(--line);padding:9px 13px;border-radius:6px}
.eyebrow{color:#b1bca9;font-weight:800;letter-spacing:.19em;font-size:12px}.hero{padding:65px 0 48px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1.2fr .8fr;gap:42px;align-items:center}
h1{font:900 clamp(70px,9vw,130px)/.86 Impact,'Arial Narrow',Arial,sans-serif;letter-spacing:-.035em;margin:22px 0 27px}h1 span{color:#a2b197}.hero p{max-width:540px;font-size:20px;color:#d2d8ce}.hero aside{padding:28px;background:#1d261c;border:1px solid #52634e;border-radius:14px;font-size:24px;font-weight:800;line-height:1.25}
.hero aside small{display:block;font:400 14px/1.5 Arial,sans-serif;margin-top:15px;color:#c9d4c3}
.section{padding:36px 0;border-bottom:1px solid var(--line)}h2{font:900 clamp(32px,4vw,54px)/1 Impact,'Arial Narrow',Arial,sans-serif;margin:5px 0 12px}.lead{max-width:700px;color:#cbd1c8}
.privacy{padding:20px;border:1px solid #70826a;background:#1d281b;border-radius:12px}.privacy strong{color:#d9ead1}
.controls{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:20px 0}.btn{background:#a7b59c;color:#050505;border:1px solid #a7b59c;border-radius:6px;padding:12px 17px;font-weight:800}.btn.secondary{background:transparent;color:var(--cream);border-color:#8e9d85}
#status{font-size:14px;color:#d2ddca;min-height:20px}#progress{font-weight:800}
.week-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin-top:26px}
.week{border:1px solid var(--line);background:var(--card);border-radius:13px;padding:22px}.week h3{font-size:25px;margin:8px 0}.week p{color:#cbd1c8;font-size:14px}
.activity{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:1px solid #374032}.activity span{font-size:14px}.activity button{border:1px solid #7d8a74;background:transparent;color:var(--cream);border-radius:5px;padding:7px 10px;font-size:12px;min-width:80px}
.activity button[data-done=true]{background:#a7b59c;color:#050505}
.footer{padding:28px 0;color:#a8b5a4;font-size:13px}
@media(max-width:750px){.hero{grid-template-columns:1fr;padding:42px 0;gap:10px}.hero aside{font-size:21px}.week-grid{grid-template-columns:1fr}.top .brand{font-size:16px}}
</style></head><body>
<div class="shell"><header class="top"><a class="brand" href="/member/dashboard">SHIFT <em>SOME</em> TIMBER</a><a class="back" href="/member/dashboard">← Back to My Timber</a></header>
<section class="hero"><div><div class="eyebrow">MY TIMBER / PRIVATE SUPPORT</div><h1>THE<br><span>TIMBER</span><br>SHED.</h1><p>Good company. Practical support. No judgement. Small steps that fit real life, whether or not you're receiving treatment.</p></div><aside>YOUR PROGRESS IS YOURS.<small>There is no public profile, member feed or posting. Your weight, treatment, mood and health records are never copied into The Timber Shed.</small></aside></section>
<section class="section"><div class="eyebrow">YOUR CHOICE</div><h2>Private by design.</h2><p class="lead">You can follow the six-week programme without saving anything. If you choose to save activity ticks, they're linked to your My Timber login and visible only in your private account. You can clear them at any time.</p>
<div class="privacy"><strong>No health records are read, shared or published.</strong><p>We only save a programme activity ID, whether you completed it and optional simple feedback if you opt in. No names, measurements, medical notes or community posts.</p></div>
<div class="controls"><button class="btn" id="enable" disabled>Save my private progress</button><button class="btn secondary" id="clear" disabled>Clear my saved progress</button><span id="progress">Not saving</span></div><p id="status" role="status" aria-live="polite">Checking your My Timber session…</p></section>
<section class="section"><div class="eyebrow">FOUNDING PROGRAMME</div><h2>Six weeks. One step at a time.</h2><p class="lead">The programme is non-clinical and optional. No weight-loss competitions, no dose instructions and no pressure to buy. Medical concerns should go to your treating clinician.</p><div class="week-grid" id="weeks"></div></section>
<footer class="footer">THE TIMBER SHED · MY TIMBER · PRIVATE ACCOUNT EXPERIENCE · NOT A CLINIC OR EMERGENCY SERVICE. If you're in immediate danger call 999. For urgent NHS advice call 111.</footer></div>
<script src="/assets/member-experience/timber-shed.mjs" defer></script></body></html>`;
export const timberShedClient=String.raw`(()=>{'use strict';
const weeks=[
 ['Finding your feet',['Choose one small thing','Check how your week feels','A conversation worth having','What worked this week?']],
 ['Food without the noise',['Make a simple meal plan','Notice what fits your day','Eat without a competition','Keep one useful habit']],
 ['Moving in your own way',['Choose movement you enjoy','Make a ten-minute window','Find what gets in the way','Notice your own progress']],
 ['Sleep and energy',['Choose a realistic bedtime step','Take a proper break','Look after your routine','Reflect without judging']],
 ['Confidence and connection',['Do something for yourself','Check in with someone','Ask for help if you need it','Celebrate a small win']],
 ['Keeping it going',['Choose what you will keep','Make a difficult-day plan','Find ongoing support','Your next small step']]
];
const root=document.getElementById('weeks'),status=document.getElementById('status'),enable=document.getElementById('enable'),clear=document.getElementById('clear'),progress=document.getElementById('progress');
let state={enabled:false,revision:0,activities:{}},ready=false;
const say=msg=>{status.textContent=msg};
const id=(w,d)=>'w'+(w+1)+'-'+['start','midweek','talk','reflect'][d];
function render(){root.replaceChildren();let count=0;weeks.forEach(([name,items],w)=>{const box=document.createElement('article');box.className='week';const kicker=document.createElement('div');kicker.className='eyebrow';kicker.textContent='WEEK '+(w+1);const title=document.createElement('h3');title.textContent=name;box.append(kicker,title);items.forEach((label,d)=>{const key=id(w,d),done=state.activities[key]?.status==='done';if(done)count++;const row=document.createElement('div');row.className='activity';const span=document.createElement('span');span.textContent=label;const button=document.createElement('button');button.type='button';button.textContent=done?'Completed ✓':'Mark done';button.dataset.done=String(done);button.disabled=!ready||!state.enabled;button.addEventListener('click',()=>save({action:'activity',revision:state.revision,activityId:key,status:done?'not-done':'done'}));row.append(span,button);box.append(row)});root.append(box)});progress.textContent=state.enabled?count+' of 24 steps saved privately':'Not saving';enable.disabled=!ready||state.enabled;clear.disabled=!ready||!state.enabled}
async function request(body){const options={credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'}};if(body){options.method='POST';options.body=JSON.stringify(body)}const response=await fetch('/v1/timber-shed/private-progress',options);const data=await response.json();if(!response.ok)throw Error(data.error==='authentication_required'||data.error==='session_expired'?'Please sign in to My Timber first.':data.error==='revision_conflict'?'Your progress changed. Refresh this page.':'Progress is unavailable. Please try again.');return data}
async function save(body){enable.disabled=true;clear.disabled=true;try{state=await request(body);say(body.action==='disable'?'Your saved Timber Shed progress has been cleared.':'Saved privately to your My Timber account.')}catch(e){say(e.message)}finally{render()}}
enable.addEventListener('click',()=>save({action:'enable',revision:state.revision}));clear.addEventListener('click',()=>save({action:'disable',revision:state.revision}));
render();request().then(data=>{state=data;ready=true;say('Connected to your private My Timber account. Nothing is shared with other members.');render()}).catch(e=>{say(e.message);render()});
})();`;
