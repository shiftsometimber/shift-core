/* Native candidate ONLY. Never served by the website. No native JS bridge. */
(() => {
  'use strict';
  if (location.origin !== 'https://shiftsometimber.co.uk') return;
  const apply = () => {
    if (!document.head || !document.body) return;
    if (!document.getElementById('my-timber-native-style')) {
      const style = document.createElement('style');
      style.id = 'my-timber-native-style';
      style.textContent = '#myTimberApp .pwa-steps,#myTimberApp #pwaReminders,.my-timber-app-footer{display:none!important}';
      document.head.appendChild(style);
    }
    const box = document.getElementById('myTimberApp');
    if (!box || box.dataset.nativeCandidate === '1') return;
    box.dataset.nativeCandidate = '1';
    const title = box.querySelector('summary strong');
    if (title) title.textContent = 'My Timber on this phone';
    const subtitle = box.querySelector('summary small');
    if (subtitle) subtitle.textContent = 'Same account. Same saved progress.';
    // Preserve original DOM IDs/listeners. Do not emulate browser permissions,
    // subscribe a device, or change the existing PWA notification preferences.
    const note = document.createElement('p');
    note.id = 'native-reminder-notice';
    note.setAttribute('role', 'note');
    note.textContent = 'Test build: native check-in reminders are not connected yet. No reminders have been enabled or changed. Your installed web app remains available for its existing reminders.';
    box.appendChild(note);
  };
  apply();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply, {once:true});
  new MutationObserver(apply).observe(document.documentElement, {childList:true, subtree:true});
})();
