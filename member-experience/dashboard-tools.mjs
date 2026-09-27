// Restore the two approved retained-record tools inside the current member shell.
// This never replaces the auth form, Today, Journey, public chrome or API owner.
export const dashboardToolsMarkup = String.raw`      <section class="mp-panel" id="panel-visualise" aria-labelledby="progressPictureTitle">
        <section class="member-progress-map" aria-label="Your progress explained"><h2>Progress</h2><p>Today is where you act. Come here to look back: your measurements, how life feels, and photos you choose to save.</p><h3>Choose what you want to see</h3><p><a href="/member/life-back">Life Back: personal goals, ratings and small wins →</a></p><p><a href="/member/dashboard#journey">Journey: optional measurements and weekly records →</a></p><p>A baseline is your first saved record. A trend needs repeated records over time. The Life Back score averages your own six ratings; it is not a clinical assessment.</p><p><a href="/member/dashboard#today">Back to Today →</a></p></section><p class="eyebrow">PRIVATE PROGRESS PHOTOS</p>
        <h2 id="progressPictureTitle">Progress Picture</h2>
        <p>Save a real progress photo privately, then choose whether to create clearly labelled AI illustrations. Nothing here is a prediction or clinical assessment.</p>
        <div class="mp-photo">
          <label for="photoInput">Choose a progress photo</label>
          <input accept="image/jpeg,image/png,image/webp" capture="user" id="photoInput" type="file" disabled aria-describedby="visualStatus">
          <img alt="Your selected original progress photo" id="photoPreview">
          <div id="visualConsentWrap" style="display:none">
            <div class="mp-two">
              <label>Weight units (measurement optional)<select id="photoWeightUnit"><option value="stone">Stone &amp; lb</option><option value="kg">Kilograms (kg)</option><option value="lb">Pounds (lb)</option></select></label>
              <label>Waist (optional)<span class="mp-two"><select id="photoWaist"></select><select aria-label="Waist unit" id="photoWaistUnit"><option value="cm">cm</option><option value="in">inches</option></select></span></label>
            </div>
            <div class="mp-two" id="photoWeightStoneWrap"><label>Stone<select id="photoWeightStone"></select></label><label>Pounds<select id="photoWeightPounds"></select></label></div>
            <div id="photoWeightKgWrap" style="display:none"><label>Weight in kg<select id="photoWeightKg"></select></label></div>
            <div id="photoWeightLbWrap" style="display:none"><label>Weight in pounds<select id="photoWeightLbOnly"></select></label></div>
            <label class="consent"><input id="savePhotoConsent" type="checkbox"> Save this real original photo privately to my My Timber progress record.</label>
            <button class="mp-btn secondary" id="saveOriginal" type="button">Save original as Progress Photo</button>
            <label class="consent"><input id="visualConsent" type="checkbox"> I understand generated versions are illustrative AI images, not clinical evidence or predictions.</label>
          </div>
          <div class="mp-status" id="visualStatus" role="status" aria-live="polite">Loading your photo controls…</div>
        </div>
        <h3>Weight illustrations</h3>
        <div class="mp-visual-options">
          <div class="mp-visual"><strong>+10%</strong><button class="mp-btn visual-gen" data-visual="+10" disabled type="button">Generate</button><img alt="+10 percent AI illustration" id="visualPlus10" hidden></div>
          <div class="mp-visual"><strong>−5%</strong><button class="mp-btn visual-gen" data-visual="-5" disabled type="button">Generate</button><img alt="-5 percent AI illustration" id="visualMinus5" hidden></div>
          <div class="mp-visual"><strong>−10%</strong><button class="mp-btn visual-gen" data-visual="-10" disabled type="button">Generate</button><img alt="-10 percent AI illustration" id="visualMinus10" hidden></div>
          <div class="mp-visual"><strong>−15%</strong><button class="mp-btn visual-gen" data-visual="-15" disabled type="button">Generate</button><img alt="-15 percent AI illustration" id="visualMinus15" hidden></div>
          <div class="mp-visual"><strong>−20%</strong><button class="mp-btn visual-gen" data-visual="-20" disabled type="button">Generate</button><img alt="-20 percent AI illustration" id="visualMinus20" hidden></div>
          <div class="mp-visual"><strong>−25%</strong><button class="mp-btn visual-gen" data-visual="-25" disabled type="button">Generate</button><img alt="-25 percent AI illustration" id="visualMinus25" hidden></div>
        </div>
        <h3>Saved real progress photos</h3>
        <div class="mp-output" id="savedPhotos"></div>
      </section>
      <section class="mp-panel" id="panel-plans" aria-labelledby="plansTitle">
        <p class="eyebrow">YOUR CURRENT SHIFT</p>
        <h2 id="plansTitle">My Plans</h2>
        <p>Open what you are following now, with replaced plans retained privately for context.</p>
        <div class="mp-output" id="activePlans"><p class="mp-muted">Loading your plans…</p></div>
      </section>`;

export function restoreDashboardTools(html) {
  if (!html.includes('id="previewMember"') || html.includes('id="panel-visualise"') || html.includes('id="panel-plans"')) return html;
  const anchor=/<section\b[^>]*id="panel-journey"[^>]*>[\s\S]*?<\/section>/;
  if(!anchor.test(html)) return html;
  return html.replace(anchor,match=>match+'\n'+dashboardToolsMarkup)
    .replace(/(<body\b[^>]*)(>)/,'$1 data-member-tools="v1"$2')
    .replace('</body>','<link rel="stylesheet" href="/member-plans-premium-v1.css?v=1"><link rel="stylesheet" href="/assets/member-experience/tools.css"><script defer src="/assets/member-experience/tools.mjs"></script></body>');
}

export const dashboardToolsStyles=String.raw`
body[data-member-tools="v1"] :is(#panel-visualise,#panel-plans){font-family:inherit;min-width:0}
body[data-member-tools="v1"] :is(#panel-visualise,#panel-plans) :is(button,input,select,textarea){font-family:inherit}
body[data-member-tools="v1"] #panel-visualise .mp-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:14px 0}
body[data-member-tools="v1"] #panel-visualise label{display:grid;gap:8px}
body[data-member-tools="v1"] #panel-visualise .mp-visual-options{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
body[data-member-tools="v1"] #panel-visualise .mp-visual{display:grid;gap:10px;padding:16px;background:#f4f1e9;border:1px solid #b6b8a9;border-radius:16px}
body[data-member-tools="v1"] #panel-visualise .mp-visual>strong{color:#4c5245!important}
body[data-member-tools="v1"] :is(#panel-visualise,#panel-plans) .mp-btn{min-height:48px;padding:12px 18px;border:1px solid #707762;background:#17261d;color:#e7e3da;border-radius:12px;font:inherit;cursor:pointer}
body[data-member-tools="v1"] :is(#panel-visualise,#panel-plans) :is(.mp-picture-intro,.mp-plan-manager-hero) :is(h3,p,strong,span){color:#e7e3da!important}
body[data-member-tools="v1"] #panel-visualise img{max-width:100%;height:auto}
body[data-member-tools="v1"] #panel-visualise .mp-visual img[hidden]{display:none!important}
body[data-member-tools="v1"] .mp-saved-plan-view{grid-column:1/-1;max-width:100%;padding:16px;margin-top:14px;border:1px solid #707762;border-radius:12px;background:#f4f1e9;color:#11140f}
body[data-member-tools="v1"] .mp-saved-plan-view dl{margin:8px 0}
body[data-member-tools="v1"] .mp-saved-plan-view dt{font-weight:700}
body[data-member-tools="v1"] .mp-saved-plan-view dd{margin:4px 0 12px;padding-left:12px;border-left:1px solid #b6b8a9}
body[data-member-tools="v1"] .mp-saved-plan-view ol{padding-left:22px}
body[data-member-tools="v1"] .mp-plan-history-meta{white-space:normal}
body[data-member-tools="v1"] #panel-plans :is(.mp-plan-manager-heading h3,.mp-plan-manager-heading p,.mp-plan-manager-heading .eyebrow,.mp-plan-manager-foot){color:#e7e3da!important}
body[data-member-tools="v1"] .member-tools-status{padding:12px 0;color:#4c5245;font:inherit}
@media(max-width:600px){body[data-member-tools="v1"] #panel-visualise :is(.mp-two,.mp-visual-options){grid-template-columns:1fr}}
`;

export const dashboardToolsRuntime=String.raw`(()=>{
  'use strict';
  if(document.body.dataset.memberTools!=='v1')return;
  const member=document.getElementById('previewMember');
  const scripts=['/member-product-v33d.js?v=member-tools-20260921','/member-progress-picture-premium-v1.js?v=2','/member-progress-v1.js?v=1','/member-plans-premium-v1.js?v=1'];
  let started=false;
  function isReady(){return member?.classList.contains('is-ready')&&!member.hidden;}
  function activate(name,closeMenu=true){
    if(!isReady()||!['today','journey','visualise','plans'].includes(name))return;
    const panel=document.getElementById('panel-'+name);if(!panel)return;
    document.querySelectorAll('.mp-panel').forEach(p=>p.classList.toggle('active',p===panel));
    document.querySelectorAll('.mp-tab').forEach(t=>t.classList.toggle('active',t.dataset.panel===name));
    if(closeMenu)document.querySelector('.member-nav-more')?.removeAttribute('open');
  }
  async function script(src){
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error('A saved-record tool could not load. Refresh to try again.'));document.head.appendChild(s)});
  }
  async function boot(){
    if(started||!isReady()||!window.SST_API)return;started=true;
    // Background loading must not dismiss More if the member opened it while
    // those requests were pending. An explicit destination still closes it.
    try{for(const src of scripts)await script(src);activate(location.hash.slice(1),false);}
    catch(error){for(const id of ['visualStatus','activePlans']){const el=document.getElementById(id);if(el)el.textContent=error.message;}}
  }
  document.addEventListener('click',event=>{
    const tab=event.target.closest('.sst-member-tabs a,.mp-tab[data-panel="visualise"],.mp-tab[data-panel="plans"]');
    if(!tab||!isReady())return;
    const url=new URL(tab.href,location.href);
    if(!/\/(?:member|staging\/member-connected)\/dashboard(?:\.html)?$/.test(url.pathname))return;
    const name=url.hash.slice(1)||'today';if(!['today','journey','visualise','plans'].includes(name))return;
    event.preventDefault();activate(name);
    history.replaceState(null,'','#'+name);window.dispatchEvent(new Event('hashchange'));
    document.getElementById('panel-'+name)?.scrollIntoView({block:'start'});
  });
  window.addEventListener('hashchange',()=>activate(location.hash.slice(1)));
  if(member)new MutationObserver(boot).observe(member,{attributes:true,attributeFilter:['class','hidden']});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();`;
