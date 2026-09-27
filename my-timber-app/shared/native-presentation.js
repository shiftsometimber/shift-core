/* Native app presentation ONLY. Never served by the website. No native JS bridge. */
(() => {
  'use strict';
  if (location.origin !== 'https://shiftsometimber.co.uk') return;
  const apply = () => {
    if (!document.head || !document.body) return;
    if (!document.getElementById('my-timber-native-style')) {
      const style = document.createElement('style');
      style.id = 'my-timber-native-style';
      // The installed native app must not advertise installing the PWA or expose
      // browser-push controls that WKWebView/Android WebView cannot honour.
      style.textContent = '#myTimberApp,.my-timber-app-footer,#pwaReminderFirstRun,#pwaReminderSettings{display:none!important}';
      document.head.appendChild(style);
    }
    const box = document.getElementById('myTimberApp');
    if (box) box.dataset.nativeCandidate = '1';
  };
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  new MutationObserver(apply).observe(document.documentElement, {childList:true, subtree:true});
})();
