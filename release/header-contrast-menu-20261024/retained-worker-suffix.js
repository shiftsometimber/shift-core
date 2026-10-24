
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