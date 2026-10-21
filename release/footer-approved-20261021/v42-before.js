(()=>{const qaWidth=Number(new URLSearchParams(location.search).get("qa-width"));if(qaWidth&&qaWidth<=1000)document.documentElement.classList.add("qa-tablet");if(qaWidth&&qaWidth<=650)document.documentElement.classList.add("qa-mobile");const trigger=document.querySelector('.menu-trigger'),drawer=document.querySelector('.site-drawer'),close=document.querySelector('.drawer-close'),backdrop=document.querySelector('.drawer-backdrop');if(trigger&&drawer){let previous;const focusable=()=>[...drawer.querySelectorAll('a,button,[tabindex]:not([tabindex="-1"])')].filter(x=>!x.disabled);function open(){previous=document.activeElement;drawer.hidden=false;backdrop.hidden=false;document.body.classList.add('drawer-open');trigger.setAttribute('aria-expanded','true');close.focus()}function shut(){drawer.hidden=true;backdrop.hidden=true;document.body.classList.remove('drawer-open');trigger.setAttribute('aria-expanded','false');(previous||trigger).focus()}trigger.addEventListener('click',open);close.addEventListener('click',shut);backdrop.addEventListener('click',shut);drawer.addEventListener('click',e=>{if(e.target.closest('a'))shut()});document.addEventListener('keydown',e=>{if(drawer.hidden)return;if(e.key==='Escape')shut();if(e.key==='Tab'){const all=focusable(),first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}})}document.getElementById('toggleLargeText')?.addEventListener('click',()=>document.documentElement.classList.toggle('large-text'));document.getElementById('toggleMotion')?.addEventListener('click',()=>document.documentElement.classList.toggle('reduce-motion'))})();

(()=>{if(!document.getElementById('publicFeedbackStyles')){const l=document.createElement('link');l.id='publicFeedbackStyles';l.rel='stylesheet';l.href='/assets/public-feedback-v1.css?v=price-period-20261018-1314bdafe846';document.head.append(l)}if(!document.getElementById('publicFeedbackClient')){const s=document.createElement('script');s.id='publicFeedbackClient';s.src='/assets/public-feedback-v1.js?v=price-period-20261018-1314bdafe846';s.defer=true;document.head.append(s)}})();

/* Owner-approved Follow SHIFT footer, 20 October 2026. */
(()=>{if(document.getElementById('shiftFooterSocialClient'))return;const s=document.createElement('script');s.id='shiftFooterSocialClient';s.src='/assets/footer-social-links-v1.js?v=20261020';s.defer=true;document.head.append(s)})();

;(()=>{const add=()=>{for(const nav of document.querySelectorAll('.site-drawer[data-header-v2] nav')){if(nav.querySelector('a[href="/shift-newsroom"]'))continue;const next=nav.querySelector('a[href="/shop"]');if(!next)continue;const link=document.createElement('a');link.href='/shift-newsroom';link.textContent='SHIFT Newsroom';next.before(link)}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add()})();;(()=>{const add=()=>(function restoreCalculatorsMenu(document2, pathname) {
  const path = String(pathname).replace(/\/+$/, "").replace(/\.html$/, "") || "/";
  if (/^\/(?:member(?:\/|$)|v1(?:\/|$)|hq(?:\/|$)|api(?:\/|$)|staging(?:\/|$))/.test(path)) return;
  for (const nav of document2.querySelectorAll(".site-drawer[data-header-v2] nav")) {
    if (nav.querySelector('a[href="/tools"]')) continue;
    const contact = nav.querySelector('a[href="/contact"]');
    if (!contact) continue;
    const link2 = document2.createElement("a");
    link2.href = "/tools";
    link2.textContent = "Calculators & Tools";
    if (path === "/tools" || path.startsWith("/tools/")) link2.setAttribute("aria-current", "page");
    contact.before(link2);
  }
  for (const section3 of document2.querySelectorAll("footer.site-footer .footer-grid section")) {
    if (section3.querySelector("h2")?.textContent.trim() !== "Explore") continue;
    if (section3.querySelector('a[href="/tools"]')) continue;
    const ask = section3.querySelector('a[href="/ask-timber"]');
    if (!ask) continue;
    const link2 = document2.createElement("a");
    link2.href = "/tools";
    link2.textContent = "Calculators & Tools";
    if (path === "/tools" || path.startsWith("/tools/")) link2.setAttribute("aria-current", "page");
    ask.after(link2);
  }
})(document,location.pathname);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',add,{once:true});else add()})();
;(()=>{const rename=()=>{const ask=document.getElementById('askTimberLaunch');if(ask&&/^Ask Shift$/i.test((ask.textContent||'').trim()))ask.textContent='Ask Timber'};const run=()=>{rename();new MutationObserver(rename).observe(document.body,{childList:true,subtree:true});if(!document.getElementById('sstMobileFloatSafe')){const s=document.createElement('style');s.id='sstMobileFloatSafe';s.textContent='@media(max-width:560px){body{padding-bottom:max(76px,env(safe-area-inset-bottom))}.ask-timber-launch{bottom:calc(10px + env(safe-area-inset-bottom))!important}.cookie-settings-fab,.cookie-choices,[class*=cookie][style*=fixed]{bottom:calc(8px + env(safe-area-inset-bottom))!important}}';document.head.appendChild(s)}};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run()})();