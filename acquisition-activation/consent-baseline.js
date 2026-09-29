(function(){
  'use strict';
  var KEY = 'sstConsentV3';
  var bannerElement = null;

  function get(){
    try { return JSON.parse(localStorage.getItem(KEY) || 'null'); }
    catch (error) { return null; }
  }

  function apply(value){
    var normalised = {
      necessary: true,
      analytics: !!(value && value.analytics === true),
      marketing: false,
      acquisition: !!(value && value.acquisition === true && value.acquisitionVersion === 'acquisition-v1'),
      acquisitionVersion: value && value.acquisitionVersion === 'acquisition-v1' ? 'acquisition-v1' : null,
      updatedAt: (value && value.updatedAt) || new Date().toISOString()
    };
    window.sstConsent = normalised;
    if (typeof window.shiftUpdateGoogleConsent === 'function') {
      window.shiftUpdateGoogleConsent(normalised.analytics);
    }
    window.dispatchEvent(new CustomEvent('sst:analytics-consent', {detail: normalised}));
    return normalised;
  }

  function save(value){
    var normalised = {
      necessary: true,
      analytics: !!(value && value.analytics === true),
      marketing: false,
      acquisition: !!(value && value.acquisition === true && value.acquisitionVersion === 'acquisition-v1'),
      acquisitionVersion: value && value.acquisitionVersion === 'acquisition-v1' ? 'acquisition-v1' : null,
      updatedAt: (value && value.updatedAt) || new Date().toISOString()
    };
    try { localStorage.setItem(KEY, JSON.stringify(normalised)); }
    catch (error) {}
    apply(normalised);
    closeBanner();
    return normalised;
  }

  function addStyles(){
    if (document.getElementById('sstConsentStyles')) return;
    var style = document.createElement('style');
    style.id = 'sstConsentStyles';
    style.textContent =
      '.cookie-banner-v3a{position:fixed;left:18px;right:18px;bottom:18px;z-index:2147483000;background:#E7E3DA;color:#050505;border:2px solid #707762;border-radius:14px;box-shadow:0 18px 50px rgba(5,5,5,.38);padding:18px;display:flex;justify-content:space-between;gap:18px;align-items:center;font-family:inherit}' +
      '.cookie-banner-v3a strong{font-size:1.05rem}.cookie-banner-v3a p{margin:5px 0 0;max-width:720px;line-height:1.45}.cookie-actions-v3a{display:flex;gap:8px;flex-wrap:wrap;flex:0 0 auto}.cookie-actions-v3a button{min-height:44px;padding:10px 14px;border:1px solid #050505;border-radius:8px;background:#E7E3DA;color:#050505;font:inherit;font-weight:800;cursor:pointer}.cookie-actions-v3a .primary{background:#050505;color:#E7E3DA}.cookie-settings-v3a{position:fixed;left:10px;bottom:10px;z-index:2147482000;min-height:40px;padding:8px 12px;border:1px solid #707762;border-radius:999px;background:#E7E3DA;color:#050505;font:inherit;font-size:.82rem;font-weight:800;cursor:pointer;box-shadow:0 6px 18px rgba(5,5,5,.22)}' +
      '@media(max-width:700px){.cookie-banner-v3a{left:8px;right:8px;bottom:8px;display:block}.cookie-actions-v3a{margin-top:12px}.cookie-actions-v3a button{flex:1 1 140px}.cookie-settings-v3a{left:8px;bottom:8px}}';
    document.head.appendChild(style);
  }

  function closeBanner(){
    if (bannerElement) bannerElement.remove();
    bannerElement = null;
  }

  function showBanner(){
    closeBanner();
    bannerElement = document.createElement('section');
    bannerElement.className = 'cookie-banner-v3a';
    bannerElement.setAttribute('role', 'dialog');
    bannerElement.setAttribute('aria-label', 'Cookie choices');
    bannerElement.innerHTML = '<div><strong>Your privacy choices</strong><p>Necessary storage keeps the site working. SHIFT measurement remembers only your visit source for up to 30 days and links it to account creation and getting started for up to 90 days. No health answers are used. Google Analytics is optional; advertising stays off. Choose Necessary only to stop source measurement on this browser. To delete a source already linked to your account, sign in and choose Necessary only. SHIFT measurement stays with SHIFT; no account or health details are sent to advertisers.</p></div><div class="cookie-actions-v3a"><button type="button" data-consent="necessary">Necessary only</button><button type="button" data-consent="shift">SHIFT measurement only</button><button type="button" data-consent="analytics" class="primary">Accept analytics</button></div>';
    document.body.appendChild(bannerElement);
    bannerElement.querySelector('[data-consent="necessary"]').addEventListener('click', function(){
      save({necessary:true, analytics:false, marketing:false, acquisition:false});
      if(window.SSTAcquisition)window.SSTAcquisition.forget().then(function(ok){if(!ok)showForgetError()});
    });
    bannerElement.querySelector('[data-consent="shift"]').addEventListener('click', function(){
      save({necessary:true, analytics:false, marketing:false, acquisition:true, acquisitionVersion:'acquisition-v1'});
    });
    bannerElement.querySelector('[data-consent="analytics"]').addEventListener('click', function(){
      save({necessary:true, analytics:true, marketing:false, acquisition:true, acquisitionVersion:'acquisition-v1'});
    });
  }

  function showForgetError(){
    var status=document.createElement('p');status.setAttribute('role','status');
    status.textContent='Your browser choice is saved. We could not confirm deletion of account-linked source data. Sign in and choose Necessary only again to retry.';
    status.style.cssText='position:fixed;bottom:56px;left:16px;right:16px;padding:16px;background:#E7E3DA;color:#050505;z-index:2147483000';
    document.body.appendChild(status);
  }

  function addSettingsButton(){
    if (document.getElementById('sstCookieSettings')) return;
    var button = document.createElement('button');
    button.id = 'sstCookieSettings';
    button.className = 'cookie-settings-v3a';
    button.type = 'button';
    button.textContent = 'Cookie choices';
    button.addEventListener('click', showBanner);
    document.body.appendChild(button);
  }

  function start(){
    addStyles();
    var existing = get();
    if (existing) apply(existing);
    else showBanner();
    addSettingsButton();
    if (location.hash === '#cookie-choices') showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
  window.SSTConsent = {get:get, save:save, show:showBanner};
})();
