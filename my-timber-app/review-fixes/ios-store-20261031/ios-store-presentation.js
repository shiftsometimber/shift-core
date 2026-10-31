/* iOS-only bundled presentation policy. Never include in Android or the PWA. */
(() => {
  'use strict';
  if (location.origin !== 'https://shiftsometimber.co.uk' || window.top !== window) return;
  if (window.__SST_IOS_STORE_PRESENTATION__) return;
  window.__SST_IOS_STORE_PRESENTATION__ = true;

  const phoneQuestion = 'Can I use it on my phone?';
  const oldPhoneAnswerPrefix = 'Yes. Use My Timber in your browser, add the web app to your home screen';
  const phoneAnswer = 'Yes. Use your My Timber account in this iPhone app or in your browser. Your saved progress stays with your account.';
  const apply = () => {
    // This public welcome section offers app installation; an installed iOS app
    // needs neither another platform's store nor its own 'coming soon' card.
    document.querySelectorAll('.mtw-apps').forEach(section => section.remove());
    document.querySelectorAll('.mtw-faqs details').forEach(detail => {
      const question = detail.querySelector('summary');
      const answer = detail.querySelector('p');
      if (question?.textContent.trim() === phoneQuestion && answer?.textContent.trim().startsWith(oldPhoneAnswerPrefix)) {
        answer.textContent = phoneAnswer;
      }
    });
    // Member notes, form fields and other user content are never rewritten.
  };
  // The document exists before <html> at document-start. Observing it avoids a
  // race when the live welcome shell is inserted or replaced after sign-out.
  new MutationObserver(apply).observe(document, {childList: true, subtree: true, characterData: true});
  apply();
})();
