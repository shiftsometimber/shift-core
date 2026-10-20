/* Owner-approved sitewide footer links, 20 October 2026. */
(()=>{'use strict';
 if(window.__shiftFooterSocialV1)return;
 window.__shiftFooterSocialV1=true;
 const links=[['Instagram','https://www.instagram.com/shiftsometimber'],['Facebook','https://www.facebook.com/ShiftSomeTimber'],['X','https://x.com/ShiftSomeTimber'],['YouTube','https://www.youtube.com/@ShiftSomeTimber']];
 function install(){
  const footer=document.getElementById('sst-footer-c');
  const host=footer&&footer.querySelector('.fc-legal-inner');
  if(!host||host.querySelector('[data-shift-footer-social]'))return;
  if(!document.getElementById('shift-footer-social-style')){
   const style=document.createElement('style');style.id='shift-footer-social-style';
   style.textContent='html body #sst-footer-c .footer-social-links{flex:1 0 100%;display:flex!important;align-items:center;flex-wrap:wrap;gap:8px 18px;margin:0!important;padding:0 0 14px!important;border-bottom:1px solid #050505!important}html body #sst-footer-c .footer-social-links strong{font-weight:700!important;margin-right:6px}html body #sst-footer-c .footer-social-links a{display:inline-flex!important;align-items:center;min-height:44px;margin:0!important;padding:4px 0!important;color:#050505!important;-webkit-text-fill-color:#050505!important;text-decoration:underline;text-underline-offset:3px}html body #sst-footer-c .footer-social-links a:focus-visible{outline:3px solid #050505!important;outline-offset:4px!important}@media(max-width:640px){html body #sst-footer-c .footer-social-links{column-gap:20px}html body #sst-footer-c .footer-social-links strong{flex-basis:100%}}';
   document.head.append(style);
  }
  const nav=document.createElement('nav');nav.className='footer-social-links';nav.dataset.shiftFooterSocial='20261020';nav.setAttribute('aria-label','Follow SHIFT');
  const title=document.createElement('strong');title.textContent='Follow SHIFT';nav.append(title);
  for(const[label,url]of links){const a=document.createElement('a');a.textContent=label;a.href=url;a.target='_blank';a.rel='noopener noreferrer';nav.append(a);}
  host.prepend(nav);
 }
 const start=()=>{install();new MutationObserver(install).observe(document.body,{childList:true,subtree:true});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
