// Scoped to member HTML enhanced by entry.mjs. Public pages are unaffected.
export const memberStyles = String.raw`
body.sst-member-experience{--me-ink:#11140f;--me-paper:#e7e3da;--me-card:#f4f1e9;--me-line:#b6b8a9;--me-muted:#4c5245;background:var(--me-paper)!important;color:var(--me-ink)!important;font-family:Arial,Helvetica,sans-serif}
body.sst-member-experience [hidden]{display:none!important}
.sst-member-experience main{width:100%!important;max-width:1180px!important;margin:0 auto!important;padding:28px 24px 64px!important;box-sizing:border-box!important;overflow-wrap:anywhere;color:var(--me-ink);background:transparent!important}
.sst-member-experience main:before,.sst-member-experience main:after{display:none!important}
.sst-member-experience .member-records{padding:0!important;margin:0!important;background:transparent!important;border:0!important}
.sst-member-experience .member-records:before,.sst-member-experience .member-records:after{display:none!important}
.sst-member-experience main *{box-sizing:border-box;min-width:0}
.sst-member-experience main :is(h1,h2,h3,h4){letter-spacing:-.035em;line-height:1.12}
.sst-member-experience main p{line-height:1.6}
.sst-member-experience :is(button,a,input,select,textarea,summary):focus-visible{outline:3px solid #486331!important;outline-offset:4px!important;box-shadow:0 0 0 6px #fff!important}
.sst-member-experience main :is(button,.btn,summary){min-height:44px;white-space:normal;cursor:pointer}
.sst-member-experience main :is(button,.btn){font-family:inherit;line-height:1.35;font-weight:700!important;text-transform:none!important;letter-spacing:0!important}
.sst-member-experience main :is(button:disabled,input:disabled,textarea:disabled){opacity:.65;cursor:wait}
.sst-member-experience main :is(input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea){max-width:100%;min-height:48px;font-size:16px!important;line-height:1.4!important;border:1px solid #8a917e!important;border-radius:8px!important;background:#fff!important;color:#11140f!important;accent-color:#445438;padding:12px!important}
/* Shared controls include overlays appended to body, not just main. Explicit
   physical and logical sizes prevent legacy 100% width / 50px minimum rules
   from stretching native checkboxes (including WebKit flex sizing). */
body.sst-member-experience :is(main,dialog,[role=dialog]) input:is([type=checkbox],[type=radio]){box-sizing:border-box!important;appearance:auto!important;accent-color:#445438;width:22px!important;min-width:22px!important;max-width:22px!important;inline-size:22px!important;min-inline-size:22px!important;max-inline-size:22px!important;height:22px!important;min-height:22px!important;max-height:22px!important;block-size:22px!important;min-block-size:22px!important;max-block-size:22px!important;flex:0 0 22px!important;padding:0!important;margin:3px 0!important;box-shadow:none!important;cursor:pointer}
body.sst-member-experience :is(main,dialog,[role=dialog]) :is(button,.btn){box-sizing:border-box;max-width:100%;min-height:44px;white-space:normal;overflow-wrap:anywhere;font-family:inherit;line-height:1.4;font-weight:700;text-transform:none;letter-spacing:0;cursor:pointer}
body.sst-member-experience :is(main,dialog,[role=dialog]) :is(button:disabled,input:disabled,textarea:disabled){opacity:.6;cursor:not-allowed}
body.sst-member-experience :is(main,dialog,[role=dialog]) .actions{display:flex;flex-wrap:wrap;gap:12px;min-width:0}
body.sst-member-experience :is(main,dialog,[role=dialog]) .actions>*{margin:0!important;min-width:0}
body.sst-member-experience :is(main,dialog,[role=dialog]) .btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid #25351e!important;border-radius:8px!important;padding:12px 18px!important;font-size:15px!important;text-decoration:none!important}
body.sst-member-experience :is(main,dialog,[role=dialog]) .btn-primary{background:#25351e!important;color:#fff!important}
body.sst-member-experience :is(main,dialog,[role=dialog]) .btn-ghost{background:transparent!important;color:#25351e!important}
body.sst-member-experience :is(main,dialog,[role=dialog]) .btn-primary:hover{background:#3e5434!important}
body.sst-member-experience :is(main,dialog,[role=dialog]) .btn-ghost:hover{background:#dce2d0!important}
body.sst-member-experience :is(.remember-choice,.sf-limitation-grid label,.health-consent-check,.health-consent-check-v42n,label:has(>[data-reminder-enabled])){display:grid!important;grid-template-columns:22px minmax(0,1fr)!important;align-items:start!important;gap:12px!important;min-height:44px;line-height:1.5!important;white-space:normal;overflow-wrap:anywhere;cursor:pointer}
body.sst-member-experience :is(.mj-pills,.mj-checks) label{position:relative;min-width:0;cursor:pointer}
body.sst-member-experience :is(.mj-pills,.mj-checks) input{top:8px;left:8px}
body.sst-member-experience :is(.mj-pills,.mj-checks) span{background:#f4f1e9!important;color:#11140f!important;border-color:#8a917e!important;font-size:15px!important}
body.sst-member-experience :is(.mj-pills,.mj-checks) input:checked+span{background:#25351e!important;color:#fff!important;outline-color:#25351e!important}
body.sst-member-experience :is(.mj-pills,.mj-checks) input:focus-visible+span{outline:3px solid #486331!important;outline-offset:4px!important}
.sst-member-experience main textarea{resize:vertical}
.sst-member-experience main input::placeholder,.sst-member-experience main textarea::placeholder{color:#62675b!important;opacity:1}
.sst-member-experience .sst-member-tabs{z-index:30;overflow:visible;justify-content:flex-start;gap:22px;padding:12px max(24px,calc((100vw - 1132px)/2));background:#11140f}
.sst-member-experience .member-nav-label{font-size:12px;letter-spacing:.15em;font-weight:800;color:#c2c9b1;white-space:nowrap}
.sst-member-experience .member-nav-tools{display:flex;align-items:center;gap:4px;flex:1;min-width:0}
.sst-member-experience .sst-member-tabs a{font-size:15px!important;border-radius:6px!important;padding:10px 14px!important}
.sst-member-experience .sst-member-tabs a:is([aria-current=page],:hover,:focus-visible){background:#d5dbc6!important;color:#11140f!important}
.sst-member-experience .member-nav-more{position:relative;flex-shrink:0;color:#e7e3da;background:none;border:0;margin:0;padding:0}
.sst-member-experience .member-nav-more summary{cursor:pointer;padding:10px 8px;font-weight:700;min-height:44px}
.sst-member-experience .member-nav-more>div{position:absolute;right:0;top:100%;width:260px;max-width:calc(100vw - 32px);padding:10px;background:#11140f;border:1px solid #707762;box-shadow:0 14px 28px #05050533}
.sst-member-experience .member-nav-more a{display:block;white-space:normal}
.sst-member-experience :is(.member-side,.member-quick-nav,.my-shift-v8-mobile-nav){display:none!important}
.sst-member-experience .member-shell{display:block!important;grid-template-columns:1fr!important;padding:0!important;background:transparent!important;border:0!important}
.sst-member-experience :is(.member-main,.fit-experience-v1,.preview-member){padding:0!important;margin:0!important;border:0!important;box-shadow:none!important;background:transparent!important;color:var(--me-ink)!important;max-width:none!important}
.sst-member-experience main.preview-wrap{background:transparent!important;border:0!important;box-shadow:none!important}
.sst-member-experience .site-header nav a{color:#dddcd3!important}
.sst-member-experience .grub-v8-panel{padding:0!important;border:0!important;background:transparent!important}
.sst-member-experience .member-main:before,.sst-member-experience .v6-watermark-host:before{display:none!important}
body.sst-member-experience main#main-content{background:transparent!important;border:0!important;box-shadow:none!important}
body.sst-member-experience #main-content .member-shell{display:block!important;grid-template-columns:1fr!important;padding:0!important;background:transparent!important;border:0!important}
body.sst-member-experience #main-content .member-shell .member-side{display:none!important}
body.sst-member-experience #main-content .member-main{padding:0!important;margin:0!important;background:transparent!important;border:0!important;color:#11140f!important}
body.sst-member-experience #main-content .member-main>:is(h1,h2,p),body.sst-member-experience #main-content .member-main>h1 .accent{color:#11140f!important}
body.sst-member-experience #main-content :is(.member-shell,.member-main,.member-records,.checkin-card):before,body.sst-member-experience #main-content :is(.member-shell,.member-main,.member-records,.checkin-card):after{display:none!important}
.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival){position:relative;isolation:isolate;overflow:hidden;min-height:290px!important;margin:0 0 28px!important;padding:36px 42% 36px 32px!important;border:0!important;border-radius:16px!important;background:#11140f!important;color:#f4f1e9!important;box-shadow:none!important}
.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival):after{content:''!important;display:block!important;position:absolute;inset:0 0 0 58%;z-index:-1;opacity:1!important;background:linear-gradient(90deg,#11140f 0%,#11140f00 60%),url('/assets/home-hero-men-v32o.jpg') center/cover no-repeat;pointer-events:none}
.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival) :is(h1,h2){margin:8px 0 16px!important;font-size:clamp(34px,4.1vw,54px)!important;line-height:1.02!important;letter-spacing:-.045em!important;color:#f4f1e9!important;max-width:650px!important}
.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival) p{color:#dadfd0!important;font-size:17px!important;line-height:1.5!important;margin:0!important}
.sst-member-experience .member-tool-hero h1 .accent{font-size:inherit!important;line-height:inherit!important;color:inherit!important}
.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival) :is(.eyebrow,.sf-kicker,header>span,.mt-arrival-copy>span){font-size:11px!important;font-weight:800!important;letter-spacing:.13em!important;color:#c5cdb3!important}
.sst-member-experience .mt-arrival{display:block!important}.sst-member-experience .mt-live-mark{display:none!important}
body.sst-member-experience #panel-today{margin:0!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}
body.sst-member-experience #panel-today:before,body.sst-member-experience #panel-today:after,body.sst-member-experience #panel-today .mt-arrival:before{display:none!important}
body.sst-member-experience #panel-today .mt-dayline{background:transparent!important;color:#25351e!important;border-color:#aeb89c!important}
body.sst-member-experience #panel-today .mt-dayline :is(b,span){color:#25351e!important}
body.sst-member-experience #panel-today .mt-now{background:#dce2d0!important;color:#11140f!important;border:1px solid #aeb89c!important;border-radius:12px!important;padding:24px!important;box-shadow:none!important}
body.sst-member-experience #panel-today .mt-now :is(h3,p,small){color:#11140f!important}
body.sst-member-experience #panel-today .mt-now-action{background:#25351e!important;color:#fff!important;border-radius:8px!important}
body.sst-member-experience #panel-today .mt-real-plan{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:20px!important;padding:0!important;overflow:visible!important}
body.sst-member-experience #panel-today .mt-real-card{min-height:220px!important}
body.sst-member-experience #panel-today :is(.mt-fluid-line,.mt-why-v2){background:#f4f1e9!important;color:#11140f!important;border:1px solid #b6b8a9!important;border-radius:10px!important;padding:20px!important}
body.sst-member-experience #panel-today :is(.mt-fluid-line,.mt-why-v2) :is(small,b,p,summary,li,label,span){color:#11140f!important}
body.sst-member-experience #panel-today .mt-today-footer{background:transparent!important;color:#4c5245!important}
body.sst-member-experience #panel-today .mt-today-footer span{color:#4c5245!important}
.sst-member-experience .member-tool-hero:after{background-position:center,center 28%!important}
body.sst-member-experience #main-content .member-tool-hero h1 .accent{color:#f4f1e9!important}
.sst-member-experience :is(.grub-search,.grub-workbench,.grub-week-builder,.sf-builder,.checkin-card,.mj-setup,.mj-weekly,.tracker-card,.member-record-card){padding:28px!important;background:var(--me-card)!important;color:var(--me-ink)!important;border:1px solid var(--me-line)!important;border-radius:12px!important;box-shadow:none!important;transform:none!important}
.sst-member-experience :is(.grub-spotlight article,.grub-recipe,.sf-session,.sf-exercise,.mj-story-grid article,.mj-stat-grid article,.mt-real-card,.mt-card,.saved-item){background:var(--me-card)!important;color:var(--me-ink)!important;border:1px solid var(--me-line)!important;border-radius:12px!important;box-shadow:none!important;transform:none!important}
.sst-member-experience :is(.grub-search,.grub-workbench,.grub-week-builder,.sf-builder,.checkin-card,.mj-setup,.mj-weekly,.tracker-card,.member-record-card,.grub-spotlight article,.grub-recipe,.sf-session,.sf-exercise,.mj-story-grid article,.mj-stat-grid article,.mt-real-card,.mt-card,.saved-item):hover{background:var(--me-card)!important;color:var(--me-ink)!important;box-shadow:none!important;transform:none!important}
.sst-member-experience :is(.grub-search,.grub-workbench,.grub-week-builder,.sf-builder,.checkin-card,.mj-setup,.mj-weekly,.tracker-card,.member-record-card,.grub-spotlight article,.grub-recipe,.sf-session,.sf-exercise,.mj-story-grid article,.mj-stat-grid article,.mt-real-card,.mt-card,.saved-item) :is(h2,h3,h4,p,label,legend,strong,small,span,li){color:var(--me-ink)!important}
.sst-member-experience :is(.grub-spotlight article,.grub-recipe,.sf-session,.mj-story-grid article,.mt-real-card,.mt-card,.saved-item,.member-record-card):before{display:none!important}
.sst-member-experience .grub-v8-tabs{display:flex!important;flex-wrap:wrap;gap:6px;padding:0 0 20px!important;border:0!important;background:none!important;overflow:visible!important}
.sst-member-experience .grub-v8-tabs button{background:transparent!important;color:var(--me-ink)!important;border:1px solid #8c937e!important;border-radius:8px!important;padding:12px 18px!important;font-size:15px!important}
.sst-member-experience .grub-v8-tabs button:is(.active,:hover){background:#25351e!important;color:#fff!important;border-color:#25351e!important}
.sst-member-experience .grub-search>label{display:block;font-size:21px!important;font-weight:800!important;margin-bottom:14px!important}
.sst-member-experience .grub-search>div:first-of-type{display:flex;gap:10px}.sst-member-experience .grub-search input{flex:1}
.sst-member-experience .grub-filters{display:flex;flex-wrap:wrap;gap:8px;margin-top:16px!important}
.sst-member-experience .grub-filters button{background:#e4e8da!important;color:#25351e!important;border:1px solid #b6bea9!important;border-radius:999px!important;padding:9px 14px!important}
.sst-member-experience .grub-filters button.active{background:#25351e!important;color:#fff!important}
.sst-member-experience .grub-spotlight{gap:20px!important;margin:24px 0!important}.sst-member-experience .grub-spotlight article{padding:24px!important}
.sst-member-experience .grub-spotlight h2{font-size:27px!important}.sst-member-experience .grub-spotlight button{margin-top:8px!important}
.sst-member-experience :is(.grub-empty,.grub-panel-head,.grubStatus){color:var(--me-muted)!important;background:transparent!important}
.sst-member-experience .grub-empty{padding:24px!important;border:1px dashed #8a917e!important;border-radius:10px!important;display:grid;gap:6px}
.sst-member-experience .grub-empty :is(strong,span){color:var(--me-muted)!important}
.sst-member-experience .grub-add{display:flex;gap:10px}.sst-member-experience .grub-add input{flex:1}
.sst-member-experience :is(#grubSearchGo,#grubGenerate,#grubWeekGenerate,.grub-spotlight button,.grub-actions button,#sgAddIngredient,#shoppingForm button,.sf-build,.sf-start,.sf-review-save,#saveMood,.mj-next button,.mj-setup button[type=submit],.mj-weekly button){background:#25351e!important;color:#fff!important;border:1px solid #25351e!important;border-radius:8px!important;padding:13px 18px!important;font-size:15px!important;box-shadow:none!important}
.sst-member-experience :is(#grubSearchGo,#grubGenerate,#grubWeekGenerate,.grub-spotlight button,.grub-actions button,.sf-build,#saveMood,.mj-next button):hover{background:#3e5434!important;color:#fff!important}
.sst-member-experience .sf-builder-grid{gap:16px!important}.sst-member-experience .sf-builder label{font-size:13px!important;letter-spacing:.02em!important;font-weight:700!important}
.sst-member-experience .sf-limitations{margin-top:24px!important;border:1px solid var(--me-line)!important;border-radius:8px!important}
.sst-member-experience .sf-limitation-grid label{font-size:14px!important;letter-spacing:0!important;background:#fff!important;color:#11140f!important}
.sst-member-experience .sf-pref{margin-top:20px!important}
.sst-member-experience .sf-status{background:#dce2d0!important;color:#25351e!important;border:1px solid #aeb89c!important;padding:14px 18px!important}
.sst-member-experience .sf-builder .sf-build{margin-top:24px!important}
.sst-member-experience .sf-session :is(.sf-verdict p,.sf-verdict span){color:#f4f1e9!important}
.sst-member-experience .checkin-consent{max-width:none!important;margin:0 0 24px!important;padding:16px 20px!important;background:#dce2d0!important;color:#25351e!important;border:1px solid #aeb89c!important;font-size:14px!important}
.sst-member-experience .checkin-card h2{font-size:30px!important}.sst-member-experience .checkin-card .mood-btn{background:#fff!important;color:#11140f!important;border:1px solid #8a917e!important;border-radius:10px!important;min-height:88px!important;height:auto!important}
.sst-member-experience .checkin-card .mood-btn:is(.active,:hover){background:#25351e!important;color:#fff!important;border-color:#25351e!important}
.sst-member-experience .checkin-card .mood-btn:is(.active,:hover) span{color:#fff!important}
.sst-member-experience .checkin-note{display:block;margin:20px 0!important;font-size:15px!important;color:#11140f!important}
.sst-member-experience .checkin-note textarea{min-height:96px!important}.sst-member-experience #saveMood{width:100%}
.sst-member-experience .checkin-result{margin-top:24px!important;border:1px solid #8a917e!important;border-radius:12px!important;padding:24px!important;background:#dce2d0!important;color:#11140f!important}
.sst-member-experience .checkin-result :is(h2,p,small,strong){color:#11140f!important}
.sst-member-experience :is(.checkin-history,.checkin-safety){color:#11140f!important;background:var(--me-card)!important;border:1px solid var(--me-line)!important;padding:20px!important;border-radius:12px!important;margin-top:24px!important}
.sst-member-experience :is(.checkin-history,.checkin-safety) :is(small,strong,span,a){color:#25351e!important}
.sst-member-experience .member-action-status{font-size:14px;margin:12px 0 0!important}.sst-member-experience .member-action-status:empty{display:none}
.sst-member-experience .mj-support-strip{margin:0 0 24px!important;padding:20px!important;background:#dce2d0!important;color:#25351e!important;border:1px solid #aeb89c!important;border-radius:10px!important}
.sst-member-experience .mj-support-strip :is(p,strong,span){color:#25351e!important}
.sst-member-experience .mj-stat-grid{gap:16px!important}.sst-member-experience .mj-stat-grid article{padding:20px!important}
.sst-member-experience .mj-stat-grid strong{font-size:clamp(26px,3vw,38px)!important}
.sst-member-experience .mj-story-grid{gap:20px!important}.sst-member-experience .mj-story-grid article{padding:24px!important}
.sst-member-experience .mj-next{margin:24px 0!important;padding:24px!important;background:#dce2d0!important;color:#11140f!important;border-radius:10px!important}
.sst-member-experience .mj-next :is(h3,p){color:#11140f!important}
.sst-member-experience .mj-setup-section{margin:24px 0!important;padding:20px!important;background:#fff!important;border:1px solid var(--me-line)!important;border-radius:10px!important}
.sst-member-experience .mj-setup label{line-height:1.5!important}.sst-member-experience .mj-setup legend{font-weight:800!important;font-size:18px!important}
.sst-member-experience .mj-weekly{margin-top:28px!important}.sst-member-experience .mj-weekly header{padding:0 0 20px!important;background:transparent!important}
.sst-member-experience .mj-weekly :is(.mj-step,fieldset,.mj-reading){background:transparent!important;color:#11140f!important;border-color:var(--me-line)!important}
.sst-member-experience .mj-weekly .mj-pill span{background:#fff!important;color:#11140f!important;border-color:#8a917e!important}
.sst-member-experience .mj-weekly input:checked+span{background:#25351e!important;color:#fff!important}
.sst-member-experience .mj-weekly .mj-step-count{color:#4c5245!important}.sst-member-experience .mj-weekly label{font-size:15px!important}
.sst-member-experience .member-record-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.sst-member-experience .member-record-card{display:flex;flex-direction:column;gap:14px;text-decoration:none!important;color:#11140f!important}
.sst-member-experience .member-record-card>span{font-size:11px;letter-spacing:.12em;font-weight:800}.sst-member-experience .member-record-card h2{font-size:28px!important;margin:0!important}.sst-member-experience .member-record-card p{margin:0!important}.sst-member-experience .member-record-card strong{margin-top:auto;text-decoration:underline;text-underline-offset:4px}
.sst-member-experience .member-record-card:hover{border-color:#25351e!important;background:#e1e7d6!important}
/* One overlay surface and readable control system for consent and tool sheets. */
body.sst-member-experience :is(dialog,.mt-sheet,.wm-sort-dialog){box-sizing:border-box!important;width:min(620px,calc(100% - 32px))!important;min-width:0!important;max-width:calc(100% - 32px)!important;max-height:calc(100vh - 32px)!important;max-height:calc(100dvh - 32px)!important;margin:auto!important;padding:clamp(18px,4vw,28px)!important;overflow:auto!important;overscroll-behavior:contain;scroll-padding:20px;background:#f4f1e9!important;color:#11140f!important;border:2px solid #707762!important;border-radius:14px!important;font:16px/1.5 Arial,Helvetica,sans-serif;overflow-wrap:anywhere}
body.sst-member-experience :is(dialog,.mt-sheet,.wm-sort-dialog) *{box-sizing:border-box;min-width:0;max-width:100%}
body.sst-member-experience dialog::backdrop{background:#050505b3}
body.sst-member-experience :is(dialog,.mt-sheet,.wm-sort-dialog) :is(h2,p,label,a,small){color:#11140f!important}
body.sst-member-experience :is(dialog,.mt-sheet,.wm-sort-dialog) h2{font-size:clamp(26px,4vw,34px)!important;line-height:1.12!important;letter-spacing:-.025em!important;margin:8px 0 20px!important}
body.sst-member-experience :is(dialog,.mt-sheet,.wm-sort-dialog) p{font-size:16px!important;line-height:1.5!important;margin:0 0 18px!important}
body.sst-member-experience :is(dialog,.mt-sheet,.wm-sort-dialog) form{display:block;min-width:0;margin:0}
body.sst-member-experience .health-consent-dialog-v42n .eyebrow{font-size:11px!important;letter-spacing:.12em!important;font-weight:800!important}
body.sst-member-experience .health-consent-dialog-v42n label{font-size:16px!important;font-weight:700!important;margin:20px 0!important}
body.sst-member-experience .health-consent-dialog-v42n a{text-decoration:underline;text-underline-offset:3px}
body.sst-member-experience :is(.mt-sheet-wrap,.wm-dialog-wrap){display:grid;place-items:center;padding:0}
body.sst-member-experience .mt-sheet{position:relative;inset:auto;animation:none}
body.sst-member-experience :is(.mt-sheet,.wm-sort-dialog) header{display:flex;align-items:start;justify-content:space-between;gap:16px;background:transparent!important;padding:0!important}
body.sst-member-experience :is(.mt-sheet,.wm-sort-dialog) header button{flex:0 0 44px;width:44px;min-width:44px;min-height:44px;background:#25351e!important;color:#fff!important;border:1px solid #25351e;border-radius:8px}
body.sst-member-experience :is(.mt-sheet-grid,.mt-alternative-list,.wm-sort-grid){display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
body.sst-member-experience :is(.mt-sheet-grid,.mt-alternative-list,.wm-sort-grid) button{padding:14px!important;border:1px solid #8a917e!important;border-radius:8px!important;background:#f4f1e9!important;color:#11140f!important;text-align:left;min-height:52px;font-size:16px!important}
body.sst-member-experience :is(.mt-sheet-grid,.mt-alternative-list,.wm-sort-grid) button:is(:hover,:focus-visible,.signature){background:#25351e!important;color:#fff!important}
body.sst-member-experience .sf-visual-dialog{width:min(980px,calc(100% - 32px))!important}
body.sst-member-experience .sf-visual-dialog :is(.sf-visual-head,.sf-visual-stage){background:#f4f1e9!important}
body.sst-member-experience [role=dialog] textarea{width:100%;min-height:96px;padding:12px;border:1px solid #8a917e;border-radius:8px;background:#fff;color:#11140f;font:16px/1.4 Arial}
.sst-member-experience .preview-auth{max-width:740px;margin:12px auto!important;padding:32px!important;border-radius:16px!important;background:#11140f!important}
.sst-member-experience .preview-auth h1{color:#f4f1e9!important}.sst-member-experience .preview-auth form{gap:16px!important}
@media(max-width:900px){
 .sst-member-experience .member-nav-label{display:none}.sst-member-experience .sst-member-tabs{gap:8px;padding:10px 16px}
 .sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival){padding-right:34%!important;min-height:260px!important}.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival):after{left:68%}
 .sst-member-experience .mj-stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
}
@media(max-width:600px){
 .sst-member-experience main{padding:20px 16px 44px!important}
 .sst-member-experience .sst-member-tabs{flex-wrap:wrap;gap:4px;padding:8px 12px}.sst-member-experience .member-nav-tools{flex:1 1 100%;justify-content:space-between;gap:0}.sst-member-experience .sst-member-tabs .member-nav-tools a{padding:10px 8px!important;font-size:14px!important}.sst-member-experience .member-nav-more{margin-left:auto}.sst-member-experience .member-nav-more summary{min-height:40px;padding:8px;font-size:13px}
 .sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival){padding:24px!important;min-height:0!important;border-radius:12px!important}.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival):after{display:none!important}
 .sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival) :is(h1,h2){font-size:36px!important}.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival) p{font-size:16px!important}
 .sst-member-experience :is(.grub-search,.grub-workbench,.grub-week-builder,.sf-builder,.checkin-card,.mj-setup,.mj-weekly,.tracker-card,.member-record-card){padding:20px!important}
 .sst-member-experience .grub-search>div:first-of-type{flex-direction:column}.sst-member-experience .grub-v8-tabs{gap:6px!important}.sst-member-experience .grub-v8-tabs button{padding:10px 12px!important;font-size:14px!important}
 .sst-member-experience :is(.grub-spotlight,.member-record-grid,.mj-story-grid,.tracker-grid,.sf-builder-grid){grid-template-columns:1fr!important}
 .sst-member-experience .sf-limitation-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}.sst-member-experience .sf-limitations{padding:12px!important}
 .sst-member-experience .checkin-card .mood-row{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.sst-member-experience .checkin-card .mood-btn{min-height:64px!important}.sst-member-experience .checkin-card .mood-btn:last-child{grid-column:1/-1}
 .sst-member-experience .mj-stat-grid{gap:10px!important}.sst-member-experience .mj-stat-grid article{padding:14px!important}.sst-member-experience .mj-stat-grid strong{font-size:27px!important}
 .sst-member-experience .mj-setup-section{padding:14px!important}.sst-member-experience :is(.mj-two,.mj-three,.mj-corrections){grid-template-columns:1fr!important}
 .sst-member-experience .preview-auth{padding:24px!important}
 body.sst-member-experience :is(dialog,.mt-sheet,.wm-sort-dialog){width:calc(100% - 24px)!important;max-width:calc(100% - 24px)!important;max-height:calc(100vh - 24px)!important;max-height:calc(100dvh - 24px)!important;padding:18px!important}
 body.sst-member-experience :is(dialog,.tracker-card) .actions{display:grid;grid-template-columns:1fr}
 body.sst-member-experience :is(.mt-sheet-grid,.mt-alternative-list,.wm-sort-grid){grid-template-columns:1fr}
 body.sst-member-experience #panel-today .mt-real-plan{grid-template-columns:1fr!important}
}
@media(max-width:400px){.sst-member-experience .site-header .site-logo,.sst-member-experience .site-header .site-logo img{width:160px!important;max-width:160px!important;min-width:160px!important}.sst-member-experience .site-header .header-inner{gap:12px!important;padding-left:12px!important;padding-right:12px!important}.sst-member-experience .site-header .menu-trigger{flex:0 0 auto}}
@media(prefers-reduced-motion:reduce){.sst-member-experience *{scroll-behavior:auto!important;transition:none!important;animation:none!important}}
@media print{.sst-member-experience .sst-member-tabs,.sst-member-experience .site-header{display:none!important}.sst-member-experience main{max-width:none!important;padding:0!important}.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival){background:#fff!important;color:#111!important;min-height:0!important;padding:0!important}.sst-member-experience :is(.member-tool-hero,.mj-hero,.mt-arrival):after{display:none!important}}
`;
