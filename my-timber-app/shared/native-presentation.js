/* Native app presentation ONLY. Never served by the website. No native JS bridge. */
(() => {
  'use strict';
  if (location.origin !== 'https://shiftsometimber.co.uk') return;
  if (typeof window !== 'undefined') {
    if (window.top !== window || window.__SST_NATIVE_PRESENTATION__) return;
    window.__SST_NATIVE_PRESENTATION__ = true;
  }
  let header, navigation;
  const set = (node, name, value) => {
    if (node.style.getPropertyValue(name) !== value || node.style.getPropertyPriority(name) !== 'important') {
      node.style.setProperty(name, value, 'important');
    }
  };
  const measure = () => {
    if (!header?.isConnected || !navigation?.isConnected) return;
    const root = document.documentElement;
    set(root, '--my-timber-native-header-height', Math.ceil(header.getBoundingClientRect().height) + 'px');
    set(root, '--my-timber-native-nav-height', Math.ceil(navigation.getBoundingClientRect().height) + 'px');
  };
  const sizes = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  const apply = () => {
    if (!document.head || !document.body) return;
    if (!document.getElementById('my-timber-native-style')) {
      const style = document.createElement('style');
      style.id = 'my-timber-native-style';
      // Only the complete top-level member shell receives the fixed bars.
      style.textContent = [
        '#myTimberApp,.my-timber-app-footer,#pwaReminderFirstRun,#pwaReminderSettings{display:none!important}',
        'html[data-my-timber-native-shell] #todayBrand[data-member-design-header]{position:fixed!important;inset:0 0 auto!important;z-index:1000!important;width:100%!important;box-sizing:border-box!important;transform:none!important}',
        'html[data-my-timber-native-shell] #appBottomNav{position:fixed!important;inset:auto 0 0!important;z-index:1000!important;width:100%!important;box-sizing:border-box!important;transform:none!important}',
        'html[data-my-timber-native-shell] body>header.site-header,html[data-my-timber-native-shell] #sst-footer-c,html[data-my-timber-native-shell] body>footer,html[data-my-timber-native-shell] .app-footer-details:has(footer){display:none!important}',
        'html[data-my-timber-native-shell] nav.sst-member-tabs{position:fixed!important;inset:var(--my-timber-native-header-height,68px) 0 auto!important;z-index:1001!important;max-height:calc(100dvh - var(--my-timber-native-header-height,68px) - var(--my-timber-native-nav-height,70px))!important;overflow-y:auto!important;overscroll-behavior:contain!important}',
        'html[data-my-timber-native-shell]{scroll-padding-top:calc(var(--my-timber-native-header-height,68px) + 12px);scroll-padding-bottom:calc(var(--my-timber-native-nav-height,70px) + 12px)}',
        'html[data-my-timber-native-shell] main :is(a,button,input,select,textarea,summary,[tabindex]){scroll-margin-top:calc(var(--my-timber-native-header-height,68px) + 12px);scroll-margin-bottom:calc(var(--my-timber-native-nav-height,70px) + 12px)}',
        '@media print{html[data-my-timber-native-shell] #todayBrand,html[data-my-timber-native-shell] #appBottomNav{display:none!important}}'
      ].join('\n');
      document.head.appendChild(style);
    }
    const box = document.getElementById('myTimberApp');
    if (box) box.dataset.nativeCandidate = '1';
    if (!/^\/member\//.test(location.pathname || '') ||
        !document.body.hasAttribute?.('data-member-design') ||
        document.body.dataset.appPanel === '1') return;
    const nextHeader = document.querySelector('#todayBrand[data-member-design-header]');
    const nextNavigation = document.getElementById('appBottomNav');
    if (!nextHeader || !nextNavigation || !document.querySelector('main')) return;
    if (nextHeader !== header || nextNavigation !== navigation) {
      sizes?.disconnect();
      header = nextHeader;
      navigation = nextNavigation;
      sizes?.observe(header);
      sizes?.observe(navigation);
    }
    const menu = document.querySelector('nav.sst-member-tabs');
    if (menu) {
      set(menu, 'position', 'fixed');
      set(menu, 'inset', 'var(--my-timber-native-header-height,68px) 0 auto');
      set(menu, 'z-index', '1001');
      set(menu, 'max-height', 'calc(100dvh - var(--my-timber-native-header-height,68px) - var(--my-timber-native-nav-height,70px))');
      set(menu, 'overflow-y', 'auto');
      set(menu, 'overscroll-behavior', 'contain');
    }
    document.documentElement.setAttribute('data-my-timber-native-shell', '1');
    // Reserve the actual bars, including safe-area padding. Inline priority
    // beats the hosted member theme's scoped padding without altering that site.
    set(document.body, 'padding-top', 'var(--my-timber-native-header-height,68px)');
    set(document.body, 'padding-bottom', 'calc(var(--my-timber-native-nav-height,70px) + 16px)');
    measure();
  };
  const revealFocus = () => {
    if (!header?.isConnected || !navigation?.isConnected) return;
    const field = document.activeElement;
    if (!field?.matches('input,textarea,select,[contenteditable="true"]')) return;
    const rect = field.getBoundingClientRect();
    if (rect.top < header.getBoundingClientRect().bottom + 12 || rect.bottom > navigation.getBoundingClientRect().top - 12) {
      field.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
    }
  };
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  new MutationObserver(apply).observe(document.documentElement, {childList:true, subtree:true});
  if (typeof window !== 'undefined') {
    const resized = () => {measure();requestAnimationFrame(revealFocus);};
    window.addEventListener('resize', resized, {passive:true});
    window.visualViewport?.addEventListener('resize', resized, {passive:true});
    document.addEventListener('focusin', () => requestAnimationFrame(revealFocus));
  }
})();
