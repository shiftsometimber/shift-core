// My Timber member presentation: preserves the authorised PR1392 behaviour.
// 24 October: Matt approved black/ash-green/cream continuity and compact actions.
// Existing account runtimes remain responsible for every saved action.
const scope='html body[data-member-design="20261001"]:is(#approved-member-design,[data-member-design]):is(#approved-member-palette,[data-member-design]):is(#approved-member-layout,[data-member-design])[data-member-experience-ui="20261015"]:is(#approved-member-experience,[data-member-experience-ui])';
const rule=(selector,body)=>selector.split('|').map(s=>scope+' '+s).join(',')+'{'+body.split(';').filter(Boolean).map(s=>s+'!important').join(';')+'}\n';
const nativeScope=scope.replace(/^html /,'html[data-my-timber-native-shell] ');
export const appExperienceStyles=scope+'{background:#050505!important;color:#e7e3da!important;margin:0!important;padding-bottom:calc(94px + env(safe-area-inset-bottom))!important}\n'+
scope+'[data-app-panel="1"]{padding:0!important;margin:0!important;background:#050505!important}\n'+
scope+'[data-app-panel="1"] main{padding:0!important;margin:0!important}\n'+
rule('main','background:#050505;color:#e7e3da;max-width:1040px;margin:0 auto;padding:20px 20px 36px;min-width:0;box-sizing:border-box')+
rule('main :is(h1,h2,h3,h4,p,li,label,legend,small,strong,b,span,summary)','color:#e7e3da;-webkit-text-fill-color:#e7e3da;font-family:Arial,Helvetica,sans-serif')+
rule('main :is(h1,h2,h3,h4)','font-weight:800;letter-spacing:-.035em')+
rule('main p','line-height:1.5')+
rule('main :is(a,button,summary,input,select,textarea)','scroll-margin-top:90px;scroll-margin-bottom:calc(94px + env(safe-area-inset-bottom))')+
rule('main a','color:#e7e3da;-webkit-text-fill-color:#e7e3da;text-underline-offset:4px')+
rule('main :is(button,.button,.btn,.mp-btn)','box-sizing:border-box;min-height:44px;max-width:100%;font:700 15px/1.3 Arial,Helvetica,sans-serif;padding:8px 12px;border:1px solid #707762;border-radius:9px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('main :is(input,select,textarea)','box-sizing:border-box;min-height:44px;max-width:100%;font:400 16px/1.4 Arial,Helvetica,sans-serif;padding:10px 12px;border:1px solid #707762;border-radius:9px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;color-scheme:dark')+
rule('main :is(input,textarea)::placeholder','color:#e7e3da;opacity:.8;-webkit-text-fill-color:#e7e3da')+
rule('main :is(input[type="checkbox"],input[type="radio"])','accent-color:#707762;min-height:22px;width:22px;height:22px;flex:none')+
rule('main :is(button,a,summary,select,input,textarea):focus-visible','outline:3px solid #e7e3da;outline-offset:3px')+
rule('#todayBrand','position:sticky;top:0;z-index:44;min-height:58px;padding:6px max(16px,calc((100vw - 1000px)/2));padding-top:max(6px,env(safe-area-inset-top));box-sizing:border-box;background:#050505;color:#e7e3da;border-bottom:1px solid #707762')+
rule('#todayBrand>a','color:#e7e3da;-webkit-text-fill-color:#e7e3da;min-height:44px;font:800 16px/1 Arial,Helvetica,sans-serif;letter-spacing:.12em')+
rule('#todayBrand .member-design-mark','width:28px;height:28px')+
rule('#todayBrand .member-design-account','background:#050505;color:#e7e3da;border-color:#707762')+
rule('#todayBrand .member-design-menu','display:flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;width:44px;padding:10px;box-sizing:border-box;border:1px solid #707762;border-radius:8px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;cursor:pointer')+
rule('#todayBrand .member-design-menu svg','width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8')+
rule('#todayBrand .member-section-name','display:none')+
rule('#appBottomNav','z-index:60;background:#050505;border-top:1px solid #707762;gap:3px;padding:6px max(8px,calc((100vw - 1000px)/2)) max(8px,env(safe-area-inset-bottom));box-shadow:none')+
rule('#appBottomNav :is(a,button)','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;min-height:50px;padding:4px 2px;border:0;border-radius:0;font-size:11px')+
rule('#appBottomNav [aria-current="page"]|#appBottomNav button[aria-expanded="true"]','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;box-shadow:inset 0 -3px #707762')+
rule('#appBottomNav :is(a,button):focus-visible|#todayBrand :is(a,button):focus-visible','outline:2px solid #e7e3da;outline-offset:2px')+
rule('.member-quick-nav.mp-tabs|.app-today-shortcuts|nav.sst-member-tabs|#sst-footer-c|footer|.app-footer-details|#memberUtilities|#myTimberApp|#pwaInstallBanner','display:none')+
rule('.mp-panel','border:0;padding:0;background:transparent;color:#e7e3da')+
rule('main :is(.member-tool-hero,.mj-hero,.mt-arrival,.member-fit-intro)|#todayActions.app-today-v3 .member-today-intro|#memberJourneyHeader','position:relative;isolation:isolate;background:#707762;color:#e7e3da;border:0;border-radius:0;min-height:0;padding:16px 18px;margin:0 0 18px;display:block;overflow:hidden')+
rule('main :is(.member-tool-hero,.mj-hero,.mt-arrival,.member-fit-intro):after|#todayActions.app-today-v3 .member-today-intro:after|#memberJourneyHeader:after','content:none;display:none;background:none')+
rule('main :is(.member-tool-hero,.mj-hero,.mt-arrival,.member-fit-intro) :is(h1,h2)|.member-today-intro h1|#memberJourneyHeader h1','color:#e7e3da;-webkit-text-fill-color:#e7e3da;font:800 clamp(28px,5vw,38px)/1.08 Arial,Helvetica,sans-serif;letter-spacing:-.045em;margin:0;max-width:none')+
rule('main :is(.member-tool-hero,.mj-hero,.mt-arrival,.member-fit-intro)>:is(p,span)|.member-today-prompt|#memberJourneyHeader p','color:#050505;-webkit-text-fill-color:#050505;font:700 19px/1.3 Arial,Helvetica,sans-serif;margin:8px 0 0')+
rule('main :is(.member-tool-hero,.mj-hero,.mt-arrival,.member-fit-intro) :is(h1,h2)>span','font:inherit;color:inherit;-webkit-text-fill-color:currentColor')+
rule('.member-tool-hero>.eyebrow|.member-tool-hero>.sf-kicker|.member-today-date|.member-today-intro>a','display:none')+
rule('#panel-today>:is(h2,.eyebrow,.mp-muted,.preview-note)|#todayActions.app-today-v3 .mtm-hero|#todayActions .today-week-start','display:none')+
rule('#todayActions.app-today-v3','color:#e7e3da')+
rule('#todayActions.app-today-v3 .mtm-care','display:block;background:#050505;color:#e7e3da;border:0;padding:0;margin:0 0 12px')+
rule('#todayActions .mtm-care h2','font-size:13px;letter-spacing:.14em;line-height:1.4;margin:12px 0 10px;text-transform:uppercase')+
rule('#todayActions .mtm-care>.mtm-section-head|#todayActions .mtm-care>p:not(.mtm-latest)|#todayActions .mtm-care-links','display:none')+
rule('#todayActions .mtm-feelings','display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px')+
rule('#todayActions .mtm-feelings :is(a,button)','min-width:0;min-height:46px;padding:8px 5px;margin:0;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;border:1px solid #707762;border-radius:9px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;font:700 14px/1.3 Arial,Helvetica,sans-serif;text-decoration:none')+
rule('#todayActions .mtm-feelings [aria-pressed="true"]','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('#todayActions .mtm-feelings span','font-size:16px')+
rule('#todayActions .mtm-latest','font-size:13px;line-height:1.45;margin:10px 0')+
rule('.member-daily-actions','display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:8px;margin:14px 0 18px')+
rule('.member-daily-actions :is(a,button)','display:flex;align-items:center;justify-content:center;gap:10px;min-height:44px;box-sizing:border-box;padding:9px 10px;border:1px solid #707762;border-radius:9px;font:700 15px/1.3 Arial,Helvetica,sans-serif;text-decoration:none;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;cursor:pointer')+
rule('.member-daily-actions button[data-mt-quick-log]','font-size:19px;line-height:1.2;background:#707762;color:#050505;-webkit-text-fill-color:#050505')+
rule('.member-daily-actions p','grid-column:1/-1;font:400 13px/1.4 Arial,Helvetica,sans-serif;margin:0')+
rule('#todayActions.app-today-v3 .mtm-next','background:#050505;color:#e7e3da;border:0;border-top:1px solid #707762;border-bottom:1px solid #707762;border-radius:0;padding:12px 0;margin:0 0 14px;min-height:0;height:auto;gap:8px')+
rule('#todayActions.app-today-v3 .mtm-next :is(h3,p,a,span,small,strong)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('#todayActions.app-today-v3 .mtm-next .mt-now-action','margin:12px 0 0;display:flex;justify-content:center;align-items:center;width:100%;box-sizing:border-box;min-height:44px;font:700 19px/1.2 Arial,Helvetica,sans-serif;padding:9px 12px;border-radius:9px;background:#707762;color:#050505;-webkit-text-fill-color:#050505')+
rule('#todayActions.app-today-v3 .mtm-next .mt-now','min-height:0;height:auto;padding:0;gap:8px')+
rule('#todayActions.app-today-v3 .mtm-next h3','font-size:23px;line-height:1.2;margin:8px 0')+
rule('#todayActions.app-today-v3 .mtm-next p','font-size:15px;margin:8px 0')+
rule('#todayActions.app-today-v3 .today-layout','display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:14px;align-items:start')+
rule('#todayActions.app-today-v3 .today-layout>*','min-width:0;width:100%;box-sizing:border-box')+
rule('#todayActions.app-today-v3 :is(.today-meal,.today-movement,.today-life,.today-focus,.today-support,.member-coaching-details)','background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:12px;padding:16px;margin:0')+
rule('#todayActions.app-today-v3 .today-meal','order:0;grid-column:1;grid-row:1/3;display:grid;grid-template-columns:42% minmax(0,1fr);padding:0;overflow:hidden;gap:0')+
rule('#todayActions.app-today-v3 .today-meal-visual','aspect-ratio:1;min-height:150px;position:relative;margin:0;background:#050505')+
rule('.today-meal-visual button.sst-image-open','position:absolute;inset:0;height:100%;width:100%;max-height:none;padding:0;border:0;border-radius:0')+
rule('.today-meal-visual button.sst-image-open img|#todayActions .today-meal-visual img','position:static;width:100%;height:100%;max-height:none;object-fit:cover')+
rule('#todayActions .today-meal-copy','padding:14px')+
rule('#todayActions .today-meal h3','font-size:24px;line-height:1.1;margin:0 0 8px;color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('#todayActions .today-meal :is(.today-meal-meta,.today-eyebrow,.today-meal-copy p,.today-meal-copy small)','color:#e7e3da;-webkit-text-fill-color:#e7e3da;font-size:13px')+
rule('#todayActions .today-meal-action','display:flex;justify-content:center;align-items:center;font:700 19px/1.2 Arial,Helvetica,sans-serif;min-height:44px;padding:8px 10px;background:#707762;color:#050505;-webkit-text-fill-color:#050505;border:0;border-radius:8px')+
rule('#todayActions .today-movement','grid-column:2;grid-row:1;order:1')+
rule('#todayActions .today-life','grid-column:2;grid-row:2;order:2')+
rule('#todayActions .today-movement :is(h3,p,a)|#todayActions .today-life :is(strong,p,span)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('#todayActions .mtm-week','grid-column:1/-1;background:#050505;color:#e7e3da;border:0;border-top:1px solid #707762;border-radius:0;padding:16px 0;margin-top:8px')+
rule('#todayActions .mtm-week :is(p,h2,h3,span,b,a)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('#todayActions .mtm-days b','background:#050505;color:#e7e3da;border:1px solid #707762')+
rule('#todayActions .mtm-days b.is-logged','background:#e7e3da;color:#050505')+
rule('#todayActions .today-support|.member-coaching-details','margin:18px 0')+
rule('.member-coaching-details>summary|.today-support>summary|.member-food-guide>summary','min-height:44px;cursor:pointer;font-weight:700;padding:10px 0;box-sizing:border-box')+
rule('.member-coaching-primary>summary|.member-next-secondary','display:none')+
rule('#shiftCoach','margin:0;background:transparent;color:#e7e3da;border:0;padding:12px 0')+
rule('.app-tool-frame','background:#050505;color-scheme:dark')+
rule('.app-tool-loading','color:#e7e3da')+
rule('.grub-v8-tabs','display:flex;flex-wrap:wrap;gap:8px;border-top:1px solid #707762;border-bottom:1px solid #707762;padding:10px 0;margin:20px 0;background:#050505')+
rule('.grub-v8-tabs button','flex:1 1 90px;min-height:44px;padding:8px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;border:1px solid #707762;border-radius:9px')+
rule('.grub-v8-tabs button[aria-selected="true"]','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('.grub-v8-tabs [data-grub-tab="fridge"]','flex:1 1 100%;text-decoration:underline')+
rule('.grub-account','font-size:13px;background:#050505;color:#e7e3da;border:0;padding:8px 0')+
rule('#grubRecommendation','margin:14px 0 24px')+
rule('#grubRecommendation>.eyebrow','display:none')+
rule('#grubRecommendation .grub-recipe','background:#050505;color:#e7e3da;border:0;border-radius:0;padding:0;display:flex;flex-direction:column')+
rule('#grubRecommendation .grub-meta span','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('#grubRecommendation .grub-recipe :is(h3,h4,p,span,small,strong,summary,li,label)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('#grubRecommendation .grub-recipe .grub-meta span','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('#grubRecommendation .grub-food-image','order:-1;margin:0 0 14px;border-radius:14px;overflow:hidden;width:100%')+
rule('#grubRecommendation .grub-food-image img','display:block;max-height:none;height:auto;width:100%;aspect-ratio:1.5;object-fit:cover;border-radius:14px')+
rule('#grubRecommendation .grub-food-image figcaption','font-size:12px;padding:6px 0;background:#050505;color:#e7e3da')+
rule('#grubRecommendation .grub-recipe>h3','font-size:30px;line-height:1.1;margin:0 0 10px')+
rule('#grubRecommendation .grub-pick-primary','gap:8px;display:flex;flex-wrap:wrap;margin:10px 0')+
rule('#grubRecommendation [data-food-pick]|#grubRecommendation .grub-pick-shopping|.member-meal-view','font:700 19px/1.2 Arial,Helvetica,sans-serif;background:#707762;color:#050505;-webkit-text-fill-color:#050505;border:1px solid #707762;border-radius:9px;padding:9px 12px;min-height:44px;box-sizing:border-box;text-align:center;text-decoration:none')+
rule('#grubRecommendation [data-food-next]','font:700 15px/1.3 Arial,Helvetica,sans-serif;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;border:1px solid #707762;border-radius:9px;padding:8px 12px;min-height:44px')+
rule('#grubRecommendation .grub-pick-save-note','font-size:13px;line-height:1.5;margin:8px 0 14px')+
rule('#grubRecommendation :is(.grub-pick-options,.grub-recipe-detail,.app-refine-recipe,.grub-effort-picker,.grub-repeat)','border:0;border-top:1px solid #707762;margin:14px 0;padding:8px 0;background:#050505;color:#e7e3da')+
rule('#grubRecommendation :is(summary,button,select):focus-visible','outline:3px solid #e7e3da;outline-offset:3px')+
rule('#grubRecommendation :is(summary,.grub-repeat-row)','min-height:44px;box-sizing:border-box;padding:10px 0')+
rule('#grubRecommendation :is(.grub-pick-adjust,.grub-effort) button','background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;border-color:#707762')+
rule('#grubRecommendation :is(.grub-pick-adjust,.grub-effort) button[aria-pressed="true"]','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('.member-grub-browse','border-top:1px solid #707762;padding-top:12px;margin:18px 0')+
rule('.member-grub-browse>summary','min-height:44px;cursor:pointer;font-size:16px;font-weight:700;padding:10px 0')+
rule('.grub-search','background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:12px;padding:16px;margin:12px 0')+
rule('.grub-search>h2|.member-discovery-label','display:none')+
rule('.member-grub-categories','display:flex;flex-wrap:nowrap;gap:8px;overflow-x:auto;padding:4px 0 8px')+
rule('.member-grub-categories button','flex:0 0 auto;min-height:44px')+
rule('.grub-discovery-options','display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px')+
rule('.grub-discovery-options label','display:grid;gap:6px;min-width:0;font-size:13px;font-weight:700')+
rule('.grub-discovery-options select','width:100%;font-size:16px')+
rule('#grubDiscoverResults','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px')+
rule('#grubDiscoverResults>.grub-result-message|#grubDiscoverResults>.grub-empty|#grubDiscoverResults>.grub-pagination','grid-column:1/-1')+
rule('#grubDiscoverResults>article','margin:0;background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:12px;padding:0 0 16px;overflow:hidden;min-width:0')+
rule('#grubDiscoverResults>article>:not(figure)','margin-left:14px;margin-right:14px')+
rule('#grubDiscoverResults .grub-food-image','margin:0 0 12px;width:100%')+
rule('#grubDiscoverResults .grub-food-image img','width:100%;height:auto;aspect-ratio:1.5;object-fit:cover')+
rule('#grubDiscoverResults h3','font-size:23px;line-height:1.2')+
rule('.grub-pagination|.grub-actions','display:flex;flex-wrap:wrap;gap:8px;align-items:center')+
rule('.member-fit-suggestion','background:#050505;color:#e7e3da;margin:14px 0 22px;padding:0')+
rule('.member-fit-suggestion figure','margin:0 0 14px;background:#050505;border-radius:14px;overflow:hidden')+
rule('.member-fit-suggestion img','display:block;width:100%;height:auto;max-height:440px;object-fit:contain')+
rule('.member-fit-suggestion figcaption','font-size:12px;margin:6px 0')+
rule('.member-fit-suggestion h2','font-size:30px;line-height:1.1;margin:10px 0')+
rule('.member-fit-suggestion>button','width:100%;font-size:19px;line-height:1.2;background:#707762;color:#050505;-webkit-text-fill-color:#050505;min-height:44px;padding:9px 12px')+
rule('.sf-builder','background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:12px;padding:16px;margin:18px 0')+
rule('.sf-builder-grid','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px')+
rule('.sf-builder-grid>label','min-width:0')+
rule('.sf-builder label','font-size:14px;line-height:1.4')+
rule('.sf-builder select','width:100%;height:44px;min-height:44px;appearance:none;-webkit-appearance:none;line-height:22px;padding:10px 36px 10px 12px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;background-image:url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20stroke%3D%22%23E7E3DA%22%20stroke-width%3D%221.5%22%3E%3Cpath%20d%3D%22m3%206%205%205%205-5%22%2F%3E%3C%2Fsvg%3E");background-position:right 12px center;background-size:14px;background-repeat:no-repeat')+
rule('.sf-builder .fit-days-field|.sf-ring|.sf-session .sf-current-step','display:none')+
rule('.member-fit-preferences>summary|.member-session-guidance>summary','min-height:44px;padding:10px 0;font-weight:700;cursor:pointer')+
rule('.member-fit-preferences','margin:10px 0')+
rule('.sf-build|.sf-start|.sf-session.active [data-sf-complete="done"]','background:#707762;color:#050505;-webkit-text-fill-color:#050505;min-height:44px;border-radius:9px;font:700 19px/1.2 Arial,Helvetica,sans-serif;padding:9px 12px')+
rule('.sf-session','background:#050505;color:#e7e3da;border:0;border-top:1px solid #707762;border-radius:0;padding:18px 0;margin-top:18px')+
rule('.sf-session-head h3','font:800 28px/1.15 Arial,Helvetica,sans-serif;letter-spacing:-.035em')+
rule('.sf-session.active','display:flex;flex-direction:column;gap:0')+
rule('.sf-session.active .sf-number','display:none')+
rule('.sf-session.active [data-sf-start]|.sf-session:not(.active) .member-session-pause|.sf-session[data-session-finished="true"] .member-session-pause','display:none')+
rule('.sf-session.active .member-session-guidance','order:10;margin-top:16px;border-top:1px solid #707762')+
rule('.sf-session.active .sf-exercises','order:1')+
rule('.sf-session.active .sf-next','order:11')+
rule('.sf-session.active .sf-debrief','order:12')+
rule('.sf-session:not(.active) .sf-exercises','display:none')+
rule('.sf-session[data-exercise-overview="true"] .sf-exercises','display:block')+
rule('.sf-session.active:not([data-exercise-overview="true"]) .sf-exercise:not([data-current-exercise="true"])','display:none')+
rule('.sf-session.active .sf-exercise[data-current-exercise="true"]','display:flex;flex-direction:column;align-items:stretch;border:0;padding:0;margin-top:14px')+
rule('.sf-exercise-art','width:100%;max-width:100%;height:auto;max-height:none;padding:0;background:#050505')+
rule('.sf-exercise-art img','width:100%;max-width:100%;height:auto;max-height:none;object-fit:contain;border-radius:12px')+
rule('.sf-exercise-art button.sst-image-open','height:auto;max-height:none;overflow:visible;aspect-ratio:auto;padding:0;border:0;background:transparent')+
rule('.sf-exercise-main h4','font-size:26px;line-height:1.2;margin:14px 0 10px')+
rule('.sf-metrics span|.grub-meta span','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505;border:0;border-radius:5px;padding:4px 7px;font-size:13px;line-height:1.3')+
rule('.sf-exercise-actions|.sf-completion|.member-rest-control','display:flex;flex-wrap:wrap;gap:8px;align-items:center')+
rule('.member-rest-control','margin-top:14px')+
rule('.member-rest-control output','font-size:20px;font-variant-numeric:tabular-nums;font-weight:700')+
rule('.member-session-progress','margin:12px 0 18px;padding:0;background:#050505;color:#e7e3da')+
rule('.member-session-progress p','font-size:14px;margin:6px 0')+
rule('.member-session-progress progress','width:100%;height:8px;accent-color:#707762')+
rule('.member-session-pause','margin-left:auto;min-height:44px')+
rule('#memberJourneyTabs','display:flex;flex-wrap:wrap;gap:8px;max-width:100%;margin:0 auto 18px;border:0')+
rule('#memberJourneyTabs button','font:700 14px/1.3 Arial,Helvetica,sans-serif;min-height:44px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;border:1px solid #707762;border-radius:9px;padding:8px 10px')+
rule('#memberJourneyTabs button[aria-selected="true"]','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('#memberJourneyTabs[hidden]|#memberJourneyChrome[hidden]','display:none')+
rule('.shift-chart-range-buttons','display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 16px')+
rule('.shift-chart-range-buttons button','min-height:44px;padding:8px 10px;font-size:14px;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;border:1px solid #707762;border-radius:8px')+
rule('.shift-chart-range-buttons button[aria-pressed="true"]','background:#e7e3da;color:#050505;-webkit-text-fill-color:#050505')+
rule('.member-journey-entry:empty','display:none')+
rule('#shiftProgressStory:has(.shift-progress-chart)>.shift-progress-intro','display:none')+
rule('.member-journey-entry','padding:16px 0;border-bottom:1px solid #707762;margin-bottom:18px')+
rule('.member-journey-entry h2','font:800 28px/1.2 Arial,Helvetica,sans-serif;margin:0 0 14px')+
rule('.member-journey-entry table','width:100%;table-layout:fixed;border-collapse:collapse')+
rule('.member-journey-entry th|.member-journey-entry td','font-size:14px;padding:8px 6px;text-align:left;overflow-wrap:anywhere;border-bottom:1px solid #707762')+
rule('.member-journey-entry a','display:inline-flex;align-items:center;min-height:44px;margin:6px 8px 6px 0;padding:8px 12px;background:#050505;border:1px solid #707762;border-radius:9px;color:#e7e3da')+
rule('#shiftProgressStory|#fitOutput|main .sf-today|main .grub-quick-wins','background:#050505;color:#e7e3da;border:0;border-radius:0;padding:0;box-shadow:none')+
rule('.shift-progress-chart','border:0;padding:0;background:#050505;color:#e7e3da;display:flex;flex-direction:column;gap:10px;margin:0')+
rule('.shift-progress-chart>h3','display:none')+
rule('.shift-chart-controls','order:2')+
rule('.shift-chart-view','order:0')+
rule('.shift-chart-range-buttons','order:-2')+
rule('.shift-chart-custom-dates','order:-1')+
rule('.shift-chart-latest strong','font-size:clamp(34px,8vw,58px);line-height:1.1;font-weight:800;color:#e7e3da')+
rule('.shift-chart-period-summary','margin:8px 0 16px;padding:12px 0;border-top:1px solid #707762;border-bottom:1px solid #707762;font-size:13px;line-height:1.4')+
rule('.shift-chart-period-summary p','font-size:13px;line-height:1.4;margin:4px 0')+
rule('.shift-chart-period-summary strong','font-size:23px;line-height:1.2')+
rule('.shift-chart-svg :is(text,tspan)|.shift-chart-svg .shift-chart-dot','fill:#e7e3da')+
rule('.shift-chart-svg .shift-chart-hit','fill:transparent')+
rule('.shift-chart-svg [stroke]:not([stroke="none"])','stroke:#707762')+
rule('.shift-chart-controls','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px')+
rule('.shift-chart-controls label','display:grid;gap:6px;min-width:0')+
rule('.shift-chart-custom-dates input|.shift-chart-custom-dates button','width:100%;min-width:0;box-sizing:border-box;min-height:44px;font:inherit;background:#050505;color:#e7e3da;-webkit-text-fill-color:#e7e3da;border:1px solid #707762;padding:10px;border-radius:9px')+
rule('.shift-pattern-sources label','display:flex;align-items:center;gap:10px;min-height:44px')+
rule('#memberJourneyPhotos','border-top:1px solid #707762;padding:16px 0;margin-top:20px')+
rule('#memberJourneyPhotos>summary','min-height:44px;padding:10px 0;font-weight:700')+
rule('main :is(.mj-setup,.mj-weekly,.mj-next,.mj-setup-section,.mj-error,.mj-stat-grid article,.mj-story-grid article,.checkin-card,.checkin-safety,.member-record-card,.member-order,.area-card,.timeline-card,.trend-panel,.win,.checkin-history,.mtm-week,.shift-progress-story,.shift-pattern-panel,.sf-programme,.sf-program,.sf-output,.mp-output,.sf-week,.sf-exercise,.grub-quick-actions,.shift-progress-intro,.shift-progress-metric,.shift-progress-milestones,.mp-picture-intro,.mp-picture-trust,.sf-exercise-purpose,.sf-limitations,.sf-difficulty,.sf-current-step,.sf-next,.sf-coach,.sf-debrief,.md-panel,.md-section,.app-screen-details,.app-refine-detail,.app-settings-section,.app-account-details)','background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:12px;padding:16px;box-shadow:none')+
rule('main :is(.md-section,.md-panel)','padding:12px 0')+
rule('main [data-account-deleted]','background:#050505;color:#e7e3da;border:1px solid #707762;border-radius:12px;padding:20px')+
rule('main [data-account-deleted] :is(p,h2,h3,a)','color:#e7e3da;-webkit-text-fill-color:#e7e3da')+
rule('.shift-progress-score','display:none')+
rule('#deviceHealth','background:#050505;color:#e7e3da;border:1px solid #707762;scroll-margin-top:90px')+
rule('.device-connection-summary','display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0')+
rule('.device-connection-summary>div','padding:14px;border:1px solid #707762;border-radius:12px')+
rule('.device-connection-summary strong|.device-connection-summary span','display:block')+
rule('.member-food-guide','margin:24px 0')+
rule('a.member-skip-link','position:fixed;left:-10000px;top:8px;z-index:100;padding:12px;background:#e7e3da;color:#050505')+
rule('a.member-skip-link:focus','left:8px')+
nativeScope+' #todayBrand[data-member-design-header]{position:fixed!important;inset:0 0 auto!important;z-index:1000!important;width:100%!important;transform:none!important}\n'+
nativeScope+' #appBottomNav{position:fixed!important;inset:auto 0 0!important;z-index:1000!important;width:100%!important;transform:none!important}\n'+
scope+'[data-member-fit-active="true"] :is(.member-fit-intro,.sf-builder,.sf-week,#fitStatus:not(.error)){display:none!important}\n'+
scope+'[data-member-fit-active="true"] details:has(.sf-builder),'+scope+'[data-member-fit-active="true"] #fitOutput .sf-session:not(.active){display:none!important}\n'+
scope+'[data-member-journey-view] #panel-visualise>.member-progress-map{display:none!important}\n'+
scope+'[data-member-journey-view="felt"] #shiftProgressStory>:not(.shift-pattern-panel),'+scope+'[data-member-journey-view="week"] #shiftProgressStory>:not(.shift-pattern-panel){display:none!important}\n'+
scope+'[data-member-journey-view="felt"] #memberJourneyPhotos,'+scope+'[data-member-journey-view="week"] #memberJourneyPhotos{display:none!important}\n'+
`#memberMoreDialog{position:fixed;inset:auto 0 0;margin:0 auto;width:100%;max-width:640px;max-height:calc(100dvh - 40px);box-sizing:border-box;border:1px solid #707762;border-radius:18px 18px 0 0;padding:20px 20px max(20px,env(safe-area-inset-bottom));overflow:auto;background:#050505;color:#e7e3da;font:16px/1.5 Arial,Helvetica,sans-serif}#memberMoreDialog::backdrop{background:#050505}#memberMoreDialog header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:12px}#memberMoreDialog h2{margin:0;font-size:28px}#memberMoreDialog :is(a,button){min-height:44px;box-sizing:border-box;font:inherit;border:1px solid #707762;border-radius:9px;color:#e7e3da;background:#050505;text-align:left;padding:10px 12px;text-decoration:none}#memberMoreDialog nav{display:grid;gap:8px}#memberMoreDialog h3{font-size:13px;color:#e7e3da;margin:18px 0 8px;letter-spacing:.08em}#memberMoreDialog :is(a,button):focus-visible{outline:3px solid #e7e3da;outline-offset:2px}#memberMoreUtilities{display:flex;flex-wrap:wrap;gap:8px}#memberMoreUtilities :is(#sstCookieSettings,#askTimberLaunch){position:static!important;inset:auto!important;transform:none!important;box-shadow:none!important;color:#e7e3da!important;background:#050505!important;max-width:100%!important}#memberMoreUtilities #askTimberLaunch{display:none!important}`+
'@media(min-width:800px){'+rule('#grubRecommendation .grub-food-image img','height:300px;max-height:300px;width:100%;object-fit:cover;object-position:center')+'}\n'+
'@media(max-width:640px){'+rule('main','padding:16px 14px 28px')+rule('#todayActions.app-today-v3 .today-layout','display:flex;flex-direction:column;gap:12px')+rule('#todayActions.app-today-v3 .today-layout>*','width:100%;box-sizing:border-box')+rule('#todayActions.app-today-v3 .today-meal','display:grid;grid-template-columns:42% minmax(0,1fr)')+rule('#grubDiscoverResults','grid-template-columns:1fr')+rule('.grub-discovery-options','grid-template-columns:1fr 1fr')+rule('.grub-discovery-options label:last-child','grid-column:1/-1')+rule('#todayActions.app-today-v3 .today-meal h3','font-size:23px')+rule('.sf-builder-grid','grid-template-columns:repeat(2,minmax(0,1fr))')+'}\n'+
'@media(max-width:360px){'+rule('#todayActions .mtm-feelings :is(a,button)','font-size:12px')+rule('.member-daily-actions','grid-template-columns:1fr 1fr')+rule('.member-daily-actions button[data-mt-quick-log]','font-size:19px')+rule('.grub-discovery-options','grid-template-columns:1fr')+'}\n'+
'@media(prefers-reduced-motion:no-preference){'+rule('#appBottomNav :is(a,button)','transition:box-shadow .15s ease')+'}\n';

export const appExperienceClient=String.raw`(()=>{
 'use strict';
 if(document.body.dataset.memberDesign!=='20261001')return;
 const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
 const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
 const text=(n,v)=>{if(n&&n.textContent!==v)n.textContent=v};
 const link=(label,href)=>{const a=node('a','',label);a.href=href;const tool=/^\/member\/(grub|fit|life-back)(?:[?#]|$)/.exec(href);if(tool)a.dataset.appOpen=tool[1];return a};
 let queued=false,more,returnFocus,weekLoadVersion=0;
 const utilityHomes=new Map();
 const memberReady=()=>{
  const session=document.body.dataset.memberSession;
  if(session!==undefined)return session==='ready'&&(document.body.dataset.memberPage!=='dashboard'||!!$('#previewMember.is-ready:not([hidden])'));
  if(document.body.dataset.memberPage==='life-back'){const view=$('#journeyView'),main=$('#main'),error=$('#accountError');return !!view&&!view.hidden&&main?.getAttribute('aria-busy')==='false'&&!!error&&error.hidden;}
  return false;
 };
 function moveUtility(n,host){if(!n||!host||n.parentElement===host)return;if(!utilityHomes.has(n)){const home=document.createComment('My Timber utility origin');n.before(home);utilityHomes.set(n,home);}host.append(n);}
 function suspend(){
  clearWeek();returnFocus=null;if(more?.open)more.close();
  for(const [n,home]of utilityHomes){if(home.isConnected)home.replaceWith(n);}utilityHomes.clear();
  more?.remove();more=undefined;delete document.body.dataset.memberExperienceUi;delete document.body.dataset.memberJourneyView;delete document.body.dataset.appMore;
 }

 async function recordedWeek(host){
  const version=++weekLoadVersion,status=node('p','','Loading your recorded week…');status.setAttribute('role','status');host.append(status);
  const valid=()=>version===weekLoadVersion&&memberReady()&&document.body.dataset.memberExperienceUi==='20261015'&&host.isConnected&&!document.hidden&&document.body.dataset.memberJourneyView==='week';
  try{
   if(!window.SST_HEALTH_CONSENT?.status||!await window.SST_HEALTH_CONSENT.status())throw Error('Review optional health tracking in Settings before viewing your recorded week.');
   if(!valid())return;if(!window.SST_API?.getMe||!window.SST_API?.getProgressSummary)throw Error('Your records are still loading. Reopen My week to try again.');
   const before=await window.SST_API.getMe(),owner=before.user?.id??before.id;if(owner===undefined)throw Error('Please sign in again to view your private records.');
   if(!valid())return;const result=await window.SST_API.getProgressSummary();if(!valid())return;const after=await window.SST_API.getMe();if(!valid())return;
   if(String(after.user?.id??after.id)!==String(owner))throw Error('Your account changed. Reopen My week before viewing records.');
   const data=result.progress||result,to=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/London'}),from=new Date(Date.parse(to+'T12:00:00Z')-6*86400000).toISOString().slice(0,10),table=node('table'),head=node('thead'),tr=node('tr');
   for(const label of ['Measure','First recorded','Latest recorded'])tr.append(node('th','',label));head.append(tr);table.append(head);const rows=node('tbody');let count=0;const days=new Set();
   const value=(metric,n)=>metric.key==='weight'&&data.units==='stone_lb'?Math.floor(Math.round(n/.45359237)/14)+' st '+Math.round(n/.45359237)%14+' lb':Number(n.toFixed(1))+' '+(metric.unit||'');
   for(const metric of data.metrics||[]){if(!['weight','waist','systolic','diastolic'].includes(metric.key))continue;
    const entries=(metric.series||[]).filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.on||'')&&r.on>=from&&r.on<=to&&typeof r.value==='number'&&Number.isFinite(r.value)).sort((a,b)=>a.on.localeCompare(b.on));if(!entries.length)continue;
    entries.forEach(r=>days.add(r.on));count++;const row=node('tr');for(const text of [metric.label,value(metric,entries[0].value),value(metric,entries.at(-1).value)])row.append(node('td','',text));rows.append(row);
   }
   status.textContent=from+' to '+to+' · '+days.size+' of 7 days with measurements. Other days are unrecorded.';
   if(count){table.append(rows);host.append(table);}else host.append(node('p','','No measurements recorded in this week. Earlier records remain available in Journey.'));
   if(data.historyMayBeLimited)host.append(node('p','','The available-history limit was reached; some records may be omitted.'));
  }catch(error){if(valid())status.textContent=error.status===401?'Please sign in again to view your private records.':error.message||'Your week could not load. Saved records have not changed.';}
 }
 function mountMore(){
  if(document.body.dataset.appPanel==='1')return;if($('#memberMoreDialog')){more=$('#memberMoreDialog');return;}
  more=node('dialog');more.id='memberMoreDialog';more.setAttribute('aria-labelledby','memberMoreTitle');
  const header=node('header'),title=node('h2','','More');title.id='memberMoreTitle';const close=node('button','','Close');close.type='button';close.onclick=()=>more.close();header.append(title,close);more.append(header);
  const sections=[['Your account',[['Account & settings','/member/settings'],['Connected health','/member/settings#deviceHealth'],['My Orders','/member/orders'],['Saved & records','/member/saved']]],['Your journey',[['Life Back · goals & wins','/member/life-back'],['Measurements & weekly records','/member/dashboard#journey'],['Progress photos','/member/dashboard#visualise'],['My Plans','/member/dashboard#plans']]],['Help',[['Ask Timber','/member/ask-timber'],['Help using My Timber','/help'],['Contact SHIFT','/contact'],['Privacy information','/privacy']]]];
  for(const [heading,items]of sections){more.append(node('h3','',heading));const nav=node('nav');nav.setAttribute('aria-label',heading);items.forEach(([label,href])=>nav.append(link(label,href)));more.append(nav)}
  const existing=all('.sst-member-tabs a').find(a=>new URL(a.href).pathname==='/member/treatment');if(existing)more.querySelector('nav').append(link('My Treatment',existing.getAttribute('href')));
  const logout=$('.member-nav-logout-form');if(logout)moveUtility(logout,more);
  more.append(node('h3','','Privacy choices'));const utilities=node('div');utilities.id='memberMoreUtilities';more.append(utilities);more.append(node('h3','','Accessibility'));const accessibility=node('div');accessibility.id='memberAccessibility';more.append(accessibility);document.body.append(more);
  all('#appMore,[data-mt-more]').forEach(trigger=>trigger.setAttribute('aria-controls',more.id));
  more.addEventListener('close',()=>{all('#appMore,[data-mt-more]').forEach(trigger=>trigger.setAttribute('aria-expanded','false'));delete document.body.dataset.appMore;returnFocus?.focus({preventScroll:true})});
  more.addEventListener('click',e=>{const a=e.target.closest('a');if(a)more.close();if(e.target.closest('#sstCookieSettings')){returnFocus=null;more.close();requestAnimationFrame(()=>document.querySelector('.cookie-banner-v3a button')?.focus())}if(e.target===more){const r=more.getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom)more.close()}});
 }
 function dailyActions(owner,anchor){
  if(!owner||!anchor)return null;
  let row=owner.querySelector(':scope>.member-daily-actions');
  if(!row){row=node('nav','member-daily-actions');row.setAttribute('aria-label','Your day and support');const log=node('button','','Log your day');log.type='button';log.dataset.mtQuickLog='true';log.setAttribute('aria-haspopup','dialog');const ask=link('Ask Timber','/member/ask-timber');row.append(log,ask,node('p','','Log what matters today. As much or as little as you like.'));}
  if(anchor.nextElementSibling!==row)anchor.after(row);return row;
 }
 function today(){
  const root=$('#todayActions.app-today-v3');if(!root)return;
  if(!root.querySelector('.member-today-intro')){const intro=node('section','member-today-intro'),copy=node('div');copy.append(node('p','member-today-date',new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/London',weekday:'long',day:'numeric',month:'long'}).format(new Date())),node('h1','','Your day. Your pace.'));intro.append(copy);root.prepend(intro)}
  const intro=root.querySelector('.member-today-intro');text(intro.querySelector('h1'),'Your day. Your pace.');if(!intro.querySelector('.member-today-prompt'))intro.querySelector('div')?.append(node('p','member-today-prompt','One useful thing is enough.'));
  // Move the canonical, already-bound controls. Do not translate a feeling into
  // a numeric mood value or replace the actual check-in/help event handlers.
  const care=root.querySelector('.mtm-care');
  if(care){const disclosure=care.closest('details#optional-checkin');if(intro.nextElementSibling!==care)intro.after(care);if(disclosure){disclosure.removeAttribute('id');care.id='optional-checkin';if(disclosure.children.length===1)disclosure.remove();}}
  const knownWrap=root.querySelector('.today-meal[data-recipe-id="industrial-v3-wrap-classic-chicken"] .today-meal-meta');if(knownWrap)text(knownWrap,knownWrap.textContent.replace(/\b8 min\b(?! prep)/,'8 min prep'));
  const actions=dailyActions(root,care||intro),next=root.querySelector('.mtm-next');
  if(next&&actions&&actions.nextElementSibling!==next)actions.after(next);
  const support=root.querySelector('.today-support');if(!support)return;
  const coach=$('#shiftCoach');if(coach&&!coach.closest('.member-coaching-details')){const d=node('details','member-coaching-details');d.append(node('summary','','Coaching & support'));support.before(d);d.append(coach)}
  if(coach){const details=coach.closest('.member-coaching-details'),enabled=$('#panel-today')?.hasAttribute('data-shift-coach-enabled');if(details){if(details.classList.contains('member-coaching-primary')!==enabled)details.classList.toggle('member-coaching-primary',enabled);if(enabled){if(!details.open)details.open=true;if(next&&next.nextElementSibling!==details)next.after(details)}else if(details.nextElementSibling!==support)support.before(details)}if(next&&next.classList.contains('member-next-secondary')!==enabled)next.classList.toggle('member-next-secondary',enabled)}
  for(const selector of ['#sstTodayContext','#sstTreatmentJourney','#sstFiveLoops','#myHealthPlanV2','#wholeManNextShift']){const n=$(selector);if(n&&!support.contains(n))support.append(n)}
 }
 function pageActions(){
  const page=document.body.dataset.memberPage;if(page==='dashboard')return;
  const main=$('main'),heading=main?.querySelector('h1');
  if(!main||!heading)return;
  const hero=heading.closest('.member-tool-hero,[data-member-hero]')||heading.closest('.member-fit-intro,.sf-hero')||heading.parentElement;
  dailyActions(hero.parentElement,hero);
 }
 function grub(){
  if(document.body.dataset.memberPage!=='grub')return;
  const heading=$('main h1');if(heading){text(heading,'Tonight, sorted.');const p=heading.nextElementSibling;if(p?.tagName==='P')text(p,'Good food. Less thinking.');}
  $('#grubSearch')?.setAttribute('aria-label','Find a recipe');
  const nav=$('.grub-v8-tabs');if(nav&&!nav.dataset.approvedOrder){nav.dataset.approvedOrder='true';for(const key of ['discover','saved','week','shoplist','fridge']){const b=nav.querySelector('[data-grub-tab="'+key+'"]');if(b)nav.append(b);}}
  const categories=all('[data-filter]');if(categories.length&&categories.every(b=>b.parentElement===categories[0].parentElement)&&!categories[0].parentElement.classList.contains('member-grub-categories'))categories[0].parentElement.classList.add('member-grub-categories');
  const recommendation=$('#grubRecommendation');
  // A genuine, account-backed suggestion is the first food action. Keep the
  // recommendation's handlers and eligibility/ingredient information intact.
  if(recommendation?.closest('.member-meal-suggestion')){const old=recommendation.closest('.member-meal-suggestion');old.before(recommendation);old.remove();}
  if(recommendation&&nav&&recommendation.nextElementSibling!==nav)nav.before(recommendation);
  const recipe=recommendation?.querySelector('article'),image=recipe?.querySelector('.grub-food-image'),detail=recipe?.querySelector('.grub-recipe-detail');
  const knownWrap=recipe?.querySelector('[data-food-pick="industrial-v3-wrap-classic-chicken"],[data-recipe-id="industrial-v3-wrap-classic-chicken"]');if(knownWrap){for(const chip of recipe.querySelectorAll('.grub-meta span'))if(chip.textContent.trim()==='8 min')text(chip,'8 min prep');for(const p of recipe.querySelectorAll('.grub-recipe-detail>p'))if(/^Preparation: 8 min .*Total ready-to-eat time: 8 min\.$/.test(p.textContent))text(p,'8 min prep; allow extra time if warming. Use cooked chicken and follow the method.');}
  if(recipe&&image&&recipe.firstElementChild!==image)recipe.prepend(image);
  if(recipe&&detail&&!recipe.querySelector('.member-meal-view')){const button=node('button','member-meal-view','Show me this meal');button.type='button';button.dataset.memberRecipeOpen='true';button.setAttribute('aria-expanded',String(detail.open));if(!detail.id)detail.id='memberSuggestedMealDetails';button.setAttribute('aria-controls',detail.id);button.onclick=()=>{detail.open=!detail.open;button.setAttribute('aria-expanded',String(detail.open));if(detail.open){for(let parent=detail.parentElement;parent&&parent!==recipe;parent=parent.parentElement)if(parent.tagName==='DETAILS'&&!parent.open)parent.open=true;const summary=detail.querySelector('summary');summary?.focus({preventScroll:true});summary?.scrollIntoView({block:'nearest',behavior:'instant'});}};const primary=recipe.querySelector('.grub-pick-ingredients')||recipe.querySelector('.grub-pick-primary');if(primary)primary.before(button);else recipe.append(button);detail.addEventListener('toggle',()=>{const expanded=String(detail.open);if(button.getAttribute('aria-expanded')!==expanded)button.setAttribute('aria-expanded',expanded);text(button,detail.open?'Hide meal details':'Show me this meal');});}
  const effort=recommendation?.querySelector(':scope>.grub-effort-picker');if(recipe&&effort&&recipe.nextElementSibling!==effort)recipe.after(effort);const view=recipe?.querySelector('.member-meal-view'),ingredients=recipe?.querySelector('.grub-pick-ingredients');if(view&&ingredients&&view.nextElementSibling!==ingredients)ingredients.before(view);
  const search=$('.grub-search'),results=$('#grubDiscoverResults');
  if(search&&results&&!search.closest('.member-grub-browse')){const parent=search.parentElement,panel=search.closest('[data-grub-panel]');if(panel&&panel===results.closest('[data-grub-panel]')&&parent&&parent.contains(results)){const browse=node('details','member-grub-browse');browse.append(node('summary','','Browse all recipes'));search.before(browse);browse.append(search);const resultsOwner=results.closest('[data-grub-panel]')===parent?results:results.closest('.grub-results')||results;if(!browse.contains(resultsOwner))browse.append(resultsOwner);}}
 }
 function fit(){
  const heading=document.body.dataset.memberPage==='fit'?$('main h1'):null;if(heading){text(heading,'A little movement.');const intro=heading.closest('.member-tool-hero,[data-member-hero]')||heading.parentElement;if(!intro.classList.contains('member-fit-intro'))intro.classList.add('member-fit-intro');const p=heading.nextElementSibling;if(p?.tagName==='P')text(p,'At your pace. On your terms.');}
  const main=document.body.dataset.memberPage==='fit'?$('main'):null;
  if(main){
   const session=main.querySelector('#fitOutput .sf-session'),source=session?.querySelector('.sf-exercise-art img');let suggestion=main.querySelector('.member-fit-suggestion');
   if(!session||session.classList.contains('active')||!source?.getAttribute('src')?.startsWith('/')){if(suggestion)suggestion.remove();}
   else if(!suggestion||suggestion._memberSource!==session){
    suggestion?.remove();suggestion=node('section','member-fit-suggestion');suggestion._memberSource=session;suggestion.setAttribute('aria-label','Your saved movement suggestion');
    const visual=node('figure'),img=source.cloneNode();img.loading='eager';img.decoding='async';visual.append(img);const caption=source.closest('figure')?.querySelector('figcaption');if(caption)visual.append(caption.cloneNode(true));
    const title=node('h2','',session.querySelector('.sf-session-head h3')?.textContent||'Your saved session'),copy=node('p','','Your saved session. Review it before you start.'),review=node('button','','See this session');review.type='button';
    review.onclick=()=>{const overview=session.querySelector('[data-exercise-overview]');if(session.dataset.exerciseOverview!=='true')overview?.click();session.scrollIntoView({block:'start',behavior:'instant'});const heading=session.querySelector('h3');if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true});}};
    suggestion.append(visual,title,copy,review);const hero=main.querySelector('.member-fit-intro')?.closest('.member-tool-hero,[data-member-hero]')||main.querySelector('.member-fit-intro'),actions=hero?.nextElementSibling?.classList.contains('member-daily-actions')?hero.nextElementSibling:null;(actions||hero||main.firstElementChild)?.after(suggestion);
   }
  }

  if(document.body.dataset.memberPage==='fit'){const active=!!$('.sf-session.active:not([data-session-finished="true"])');if(document.body.dataset.memberFitActive!==String(active))document.body.dataset.memberFitActive=String(active);}
  const builder=$('.sf-builder');if(builder){builder.dataset.experienceReady='true';const detail=builder.closest('details');if(detail&&!detail.dataset.memberExperienceSetup)detail.dataset.memberExperienceSetup='true'}
  const limits=builder?.querySelector('.sf-limitations');if(limits&&!limits.closest('.member-fit-preferences')){const details=node('details','member-fit-preferences');details.append(node('summary','','Movement preferences & notes'));limits.before(details);details.append(limits);const notes=builder.querySelector('.sf-pref');if(notes)details.append(notes);}
  all('#fitOutput .sf-session').forEach(session=>{
   let guidance=session.querySelector('.member-session-guidance');if(!guidance){guidance=node('details','member-session-guidance');guidance.append(node('summary','','Session options & guidance'));session.append(guidance);for(const selector of ['.sf-coach','.sf-difficulty']){const section=session.querySelector(selector);if(section)guidance.append(section);}}
   const active=session.classList.contains('active');if(guidance.dataset.active!==String(active)){guidance.dataset.active=String(active);guidance.open=!active;}
   const cards=[...session.querySelectorAll('.sf-exercise')];if(!cards.length)return;
   const done=cards.filter(c=>c.dataset.completion==='done').length,skipped=cards.filter(c=>c.dataset.completion==='skipped').length,first=cards.find(c=>!['done','skipped'].includes(c.dataset.completion));
   let box=session.querySelector('.member-session-progress');if(!box){box=node('div','member-session-progress');const p=node('p'),progress=node('progress'),overview=node('button','','View exercise list'),pause=node('button','member-session-pause','Pause session');pause.type='button';pause.dataset.pauseSession='true';progress.setAttribute('aria-label','Saved session progress');overview.type='button';overview.dataset.exerciseOverview='toggle';overview.setAttribute('aria-expanded','false');box.append(p,progress,overview,pause);session.querySelector('.sf-session-head')?.after(box)}
   if(session.dataset.sessionFinished!==String(!first))session.dataset.sessionFinished=String(!first);box.querySelector('p').setAttribute('role','status');
   text(box.querySelector('p'),(first?'Exercise '+(cards.indexOf(first)+1)+' of '+cards.length:'Session finished')+' · '+done+' completed'+(skipped?' · '+skipped+' skipped':''));const progress=box.querySelector('progress');if(progress.max!==cards.length)progress.max=cards.length;if(progress.value!==done+skipped)progress.value=done+skipped;
   cards.forEach(card=>{const current=card===first;if(card.dataset.currentExercise!==String(current))card.dataset.currentExercise=String(current);const h=card.querySelector('h4');if(h&&!h.dataset.originalTitle){h.dataset.originalTitle=h.textContent;text(h,h.textContent.replace(/\s+[—–]\s+.+$/,''))}
    const rest=Number(card.querySelector('[data-sf-metrics]')?.textContent.match(/(\d+)\s*SEC REST/i)?.[1]||card.dataset.baseRest||0);
    if(!card.querySelector('.member-rest-control')&&rest){const control=node('div','member-rest-control'),b=node('button','','Start rest · '+rest+' sec'),out=node('output');b.type='button';b.dataset.restSeconds=String(rest);control.append(b,out);card.querySelector('.sf-exercise-main')?.append(control)}
    const restButton=card.querySelector('[data-rest-seconds]');if(restButton&&!restButton.dataset.restUntil&&restButton.dataset.restSeconds!==String(rest)){restButton.dataset.restSeconds=String(rest);text(restButton,'Start rest · '+rest+' sec')}
   });
   const start=session.querySelector('[data-sf-start]');if(start&&!start.disabled&&!session.classList.contains('active'))text(start,done+skipped?'Resume session →':'Start session →');
  });
 }
 function journey(){
  if(document.hidden||document.body.dataset.memberPage!=='dashboard'||!$('#previewMember.is-ready'))return;
  const panels=$('#panel-journey'),progress=$('#panel-visualise');if(!panels||!progress)return;
  for(const a of all('#appBottomNav a'))if(a.textContent.trim()==='Journey'&&new URL(a.href).hash==='#journey')a.setAttribute('href','/member/dashboard#visualise');
  const url=new URL(location.href),active=['#journey','#visualise'].includes(url.hash);
  let chrome=$('#memberJourneyChrome');
  if(!chrome){chrome=node('div');chrome.id='memberJourneyChrome';const band=node('header');band.id='memberJourneyHeader';band.append(node('h1','','Your progress. In your hands.'),node('p','','Your readings. Your everyday wins.'));chrome.append(band);dailyActions(chrome,band);panels.parentElement.insertBefore(chrome,panels);}
  if(chrome.hidden===active)chrome.hidden=!active;
  let nav=$('#memberJourneyTabs');
  if(!nav){
   nav=node('nav');nav.id='memberJourneyTabs';nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Your Journey');
   for(const [key,label]of [['journey','Progress'],['week','Week'],['log','Readings'],['felt','How I felt']]){
    const button=node('button','',label);button.type='button';button.dataset.journeyView=key;button.setAttribute('role','tab');button.setAttribute('aria-controls',key==='log'?'panel-journey':'panel-visualise');
    button.onclick=()=>{const oldURL=location.href,next=new URL(location.href);next.searchParams.set('journeyView',key);const panel=key==='log'?'journey':'visualise';$('.mp-tab[data-panel="'+panel+'"]')?.click();next.hash=panel;history.pushState(null,'',next.pathname+next.search+next.hash);dispatchEvent(new HashChangeEvent('hashchange',{oldURL,newURL:location.href}));journey();};nav.append(button);
   }
   panels.parentElement.insertBefore(nav,panels);
  }
  nav.hidden=!active;if(!active){delete document.body.dataset.memberJourneyView;all('.mp-panel').forEach(panel=>{const hidden=!panel.classList.contains('active');if(panel.hidden!==hidden)panel.hidden=hidden;});return;}
  const requested=url.searchParams.get('journeyView'),key=url.hash==='#journey'?'log':['journey','week','felt'].includes(requested)?requested:'journey';
  const selectedPanel=key==='log'?panels:progress;all('.mp-panel').forEach(panel=>{const selected=panel===selectedPanel;if(panel.classList.contains('active')!==selected)panel.classList.toggle('active',selected);if(panel.hidden===selected)panel.hidden=!selected;});
  if(document.body.dataset.memberJourneyView!==key)document.body.dataset.memberJourneyView=key;
  nav.querySelectorAll('button').forEach(b=>{const selected=b.dataset.journeyView===key;if(b.getAttribute('aria-selected')!==String(selected))b.setAttribute('aria-selected',String(selected));});
  let entry=$('#memberJourneyEntry');if(!entry){entry=node('section','member-journey-entry');entry.id='memberJourneyEntry';progress.prepend(entry);}
  let photos=$('#memberJourneyPhotos');if(!photos){photos=node('details');photos.id='memberJourneyPhotos';photos.append(node('summary','','Progress photos & other records'));progress.append(photos);}
  for(const child of [...progress.children])if(![entry,photos,$('#shiftProgressStory')].includes(child)&&child.tagName!=='STYLE'){if(child.classList.contains('member-progress-map')){child.hidden=true;continue;}photos.append(child);}
  if(progress.firstElementChild!==entry)progress.prepend(entry);
  if(entry.dataset.view!==key){entry.dataset.view=key;entry.replaceChildren();
   if(key==='felt'){entry.append(node('h2','','How I felt'),node('p','','Review symptoms and medication taken across the dates you choose.'),link('Log how I felt','/member/treatment?entry=symptoms'),link('Choose dates & see entries','/member/treatment?view=timeline'));}
   if(key==='week'){entry.append(node('h2','','My week'),node('p','','Review your saved check-ins and treatment weeks. Missing days remain unknown.'),link('Weekly check-in','/member/dashboard#journey'),link('Symptoms & medication timeline','/member/treatment?view=timeline'));recordedWeek(entry);}
  }
  let medication=$('#memberMedicationTaken');if(!medication){medication=node('section','member-journey-entry');medication.id='memberMedicationTaken';medication.append(node('h2','','Medication taken'),link('Record a jab','/member/treatment?entry=dose'),link('Record an oral tablet','/member/treatment?entry=tablet'),node('p','','Use your saved treatment record. Record only medication you actually took.'));panels.prepend(medication);}
  // Canonical readers/forms retain all writes. The weekly read uses fresh account
  // checks on both sides and never persists health information in browser storage.
 }
 function refresh(){
  if(!memberReady()){suspend();return;}if(document.body.dataset.memberExperienceUi!=='20261015')document.body.dataset.memberExperienceUi='20261015';
  if(document.body.dataset.accountDeleted==='1'){if(more?.open)more.close();return;}
  mountMore();today();grub();pageActions();fit();journey();
  all('a').filter(a=>/^Skip to (main )?content$/i.test(a.textContent.trim())).forEach((a,i)=>{if(!a.classList.contains('member-skip-link'))a.classList.add('member-skip-link');if(i>0&&!a.hidden)a.hidden=true});
  const guide=$('aside[aria-label="Food guide"]');if(guide&&!guide.closest('.member-food-guide')){const detail=node('details','member-food-guide');detail.append(node('summary','','Food guide & practical swaps'));$('main')?.append(detail);detail.append(guide)}

  const tool=document.body.dataset.appTool,hash=location.hash||'#today',page=document.body.dataset.memberPage;
  const name=page==='dashboard'?(tool&&tool!=='today'?({grub:'Grub',fit:'Fit','life-back':'Journey'}[tool]||'Today'):hash==='#today'?'Today':hash==='#journey'?'Journey':hash==='#visualise'?'Progress':hash==='#plans'?'My Plans':'Today'):({'life-back':'Journey','check-in':'Check-in',grub:'Grub',fit:'Fit',settings:'Settings',orders:'My Orders','ask-timber':'Ask Timber',saved:'Saved',plans:'My Plans'}[page]||'My Timber');
  const brand=$('#todayBrand>a>span');if(brand){let label=brand.querySelector('.member-section-name');if(!label){label=node('span','member-section-name');brand.append(label)}text(label,name)}
  if(more){const utilities=$('#memberMoreUtilities');all('#sstCookieSettings,#askTimberLaunch').forEach(n=>{moveUtility(n,utilities)});const accessibility=$('#a11yControls'),host=$('#memberAccessibility');moveUtility(accessibility,host)}
  all('#appBottomNav a').forEach(a=>{const u=new URL(a.href),key=u.pathname.split('/').pop(),selected=key==='dashboard'?(['#journey','#visualise'].includes(u.hash)?['Journey','Progress','My Plans'].includes(name):name==='Today'):key===name.toLowerCase();if(selected){if(a.getAttribute('aria-current')!=='page')a.setAttribute('aria-current','page')}else if(a.hasAttribute('aria-current'))a.removeAttribute('aria-current')});
  const target=location.hash&&document.getElementById(location.hash.slice(1));if(target){for(let p=target.parentElement;p;p=p.parentElement)if(p.tagName==='DETAILS'&&!p.open)p.open=true}
 }
 const schedule=()=>{if(!queued){queued=true;requestAnimationFrame(()=>{queued=false;refresh()})}};
 function revealEditingControl(){
  if(!memberReady())return;
  let owner=document,field=document.activeElement,offset=0;
  try{
   if(field?.tagName==='IFRAME'){const frame=field,inside=frame.contentDocument?.activeElement;if(inside){field=inside;offset=frame.getBoundingClientRect().top;}}
   else if(window.frameElement&&parent.document.body.dataset.memberExperienceUi==='20261015'){owner=parent.document;offset=window.frameElement.getBoundingClientRect().top;}
  }catch{}
  if(!field?.matches('input,textarea,select,[contenteditable="true"]')||field.matches('[type="hidden"],[type="checkbox"],[type="radio"],[type="range"],[type="file"],[type="button"],[type="submit"]')||field.closest('dialog[open]'))return;
  const win=owner.defaultView,viewport=win.visualViewport,header=owner.querySelector('#todayBrand'),nav=owner.querySelector('#appBottomNav'),r=field.getBoundingClientRect();
  const top=Math.max(header?.getBoundingClientRect().bottom||0,viewport?.offsetTop||0)+12;
  const bottom=Math.min(nav?.getBoundingClientRect().top||win.innerHeight,(viewport?.offsetTop||0)+(viewport?.height||win.innerHeight))-12;
  if(r.top+offset<top||r.bottom+offset>bottom)field.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});
 }
 const scheduleEditingControl=()=>requestAnimationFrame(revealEditingControl);
 document.addEventListener('focusin',scheduleEditingControl);
 addEventListener('resize',scheduleEditingControl,{passive:true});
 window.visualViewport?.addEventListener('resize',scheduleEditingControl,{passive:true});
 document.addEventListener('click',e=>{
  if(!memberReady())return;
  const navToday=e.target.closest?.('#appBottomNav a');if(navToday&&document.body.dataset.memberPage==='dashboard'){const target=new URL(navToday.href);if(target.pathname==='/member/dashboard'&&target.hash==='#today'&&!target.searchParams.get('tool')){$('.mp-tab[data-panel="today"]')?.click();schedule();}}
  const trigger=e.target.closest?.('#appMore,[data-mt-more]');if(trigger&&more){e.preventDefault();returnFocus=trigger;if(!more.open)more.showModal();all('#appMore,[data-mt-more]').forEach(t=>t.setAttribute('aria-expanded','true'))}
  const toggle=e.target.closest?.('button[data-exercise-overview="toggle"]');if(toggle){const s=toggle.closest('.sf-session'),open=s.dataset.exerciseOverview!=='true';s.dataset.exerciseOverview=String(open);toggle.setAttribute('aria-expanded',String(open));text(toggle,open?'Return to current exercise':'View exercise list')}
  const pause=e.target.closest?.('[data-pause-session]');if(pause){const session=pause.closest('.sf-session');session.classList.remove('active');session.dataset.exerciseOverview='false';const overview=session.querySelector('[data-exercise-overview]');overview.setAttribute('aria-expanded','false');text(overview,'View exercise list');session.querySelector('[data-sf-start]')?.focus({preventScroll:true})}
  const rest=e.target.closest?.('[data-rest-seconds]');if(rest){const output=rest.nextElementSibling,seconds=Number(rest.dataset.restSeconds);if(rest.dataset.restUntil){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');text(output,'');return}rest.dataset.restUntil=String(Date.now()+seconds*1000);text(rest,'Cancel rest');const tick=()=>{if(!rest.isConnected||!rest.dataset.restUntil)return false;const remaining=Math.max(0,Math.ceil((Number(rest.dataset.restUntil)-Date.now())/1000));text(output,remaining?Math.floor(remaining/60)+':'+String(remaining%60).padStart(2,'0'):'Rest finished');if(!remaining){delete rest.dataset.restUntil;text(rest,'Start rest · '+seconds+' sec');output.setAttribute('role','status');return false}return true};tick();const timer=setInterval(()=>{if(!tick())clearInterval(timer)},250)}
 });
 function boot(){refresh();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-completion','data-app-tool','data-member-session','class','hidden','aria-busy']})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 document.addEventListener('sst:today-rendered',schedule);addEventListener('hashchange',schedule);addEventListener('popstate',schedule);
 function clearWeek(){++weekLoadVersion;const entry=$('#memberJourneyEntry');if(entry?.dataset.view==='week'){entry.replaceChildren();delete entry.dataset.view;}}addEventListener('pagehide',clearWeek);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearWeek();else schedule();});
})();`;

