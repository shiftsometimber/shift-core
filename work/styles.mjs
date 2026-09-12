// Scoped workplace styles. Shared public-site card hover rules must not change
// form/report backgrounds or obscure headings inside these private screens.
export const workStyles=String.raw`
html:has(body.work-reduce-motion){scroll-behavior:auto!important}
.work-reduce-motion *{animation:none!important;transition:none!important;scroll-behavior:auto!important}
.work-large-text .work{font-size:20px!important}.work-large-text .work button{font-size:18px!important}
main.work{max-width:1160px;margin:0 auto;padding:28px 24px 56px;color:#050505;background:#e7e3da;font:16px/1.6 Arial,Helvetica,sans-serif;overflow-wrap:anywhere}
main.work h1,main.work h2,main.work h3{color:#050505;max-width:none;letter-spacing:-.025em}
main.work h1{font-size:clamp(30px,3.6vw,44px);line-height:1.1;margin:0 0 12px}
main.work h2{font-size:clamp(25px,3vw,34px);line-height:1.15;margin:0 0 16px}
main.work h3{font-size:23px;line-height:1.25;margin:0 0 12px}
main.work p{max-width:75ch;margin:0 0 16px}main.work p:last-child{margin-bottom:0}
main.work .work-subtitle{color:#45493d;margin-bottom:22px}
main.work .work-header-links{display:flex!important;flex-wrap:wrap;grid-template-columns:none!important;gap:6px 24px!important;margin:0 0 20px!important}
main.work .work-header-links a{width:auto!important;min-height:44px;display:inline-flex;align-items:center;padding:0!important;font-size:14px}
main.work .work-panel,main.work .work-panel:hover,main.work .work-panel:focus-within{position:relative;padding:28px;background:#eeeae2!important;color:#050505!important;border:1px solid #929685;margin:24px 0;box-shadow:none;transform:none}
main.work .work-panel:before,main.work .work-panel:after{display:none!important}
main.work .work-panel h2,main.work .work-panel h3,main.work .work-panel a{color:#050505!important}
main.work .work-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:10px 20px}
main.work label{display:block;margin:12px 0;font-weight:700}
main.work input[type=checkbox]{flex:0 0 20px;width:20px;min-height:20px;height:20px;margin:3px 0;accent-color:#050505}
main.work input:not([type=checkbox]),main.work textarea{box-sizing:border-box;display:block;width:100%;min-width:0;min-height:46px;padding:12px;background:#faf8f2;color:#050505;border:1px solid #707762;border-radius:2px;font:inherit}
main.work input::placeholder{color:#626657;opacity:1}main.work textarea{min-height:96px}
main.work .check{display:flex;align-items:flex-start;gap:12px;font-size:15px;line-height:1.5;margin:20px 0}
main.work button,main.work a.work-primary{min-height:46px;padding:12px 18px;margin:6px 6px 6px 0;color:#e7e3da!important;background:#050505;border:1px solid #050505;border-radius:2px;font:700 15px/1.45 Arial;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:18px;max-width:100%}
main.work button:hover,main.work a.work-primary:hover{background:#2b3024;border-color:#2b3024}
main.work button:disabled{opacity:.55;cursor:wait}
main.work button.work-secondary{background:transparent;color:#050505!important;border:1px solid #707762}
main.work button.work-secondary:hover{background:#dad7cc}
main.work a{color:#050505;text-decoration:underline;text-underline-offset:3px}
main.work table{display:table;table-layout:fixed;width:100%;border-collapse:collapse;background:transparent}
main.work th,main.work td{overflow-wrap:anywhere;text-align:left;vertical-align:top;border:1px solid #929685;padding:14px;color:#050505;background:transparent}
main.work th{font-size:14px}main.work thead th{background:#dad7cc}
main.work pre{white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}
main.work :focus-visible{outline:3px solid #707762;outline-offset:4px}
main.work details{margin-top:18px}main.work summary{cursor:pointer;font-weight:700;min-height:44px;padding:12px 0}
main.work #work-status{margin:0;min-height:0}
main.work #work-status:not(:empty){position:sticky;top:78px;z-index:10;padding:12px 16px;margin:0 0 20px;background:#d9dfce;border-left:4px solid #505c3d;color:#050505}
main.work .work-eyebrow{font-size:12px;font-weight:700;letter-spacing:.13em;line-height:1.5;margin:0 0 12px;color:#454d39}
main.work .work-cohort{padding:0;margin:0 0 28px;border:1px solid #707762;background:#eeeae2;color:#050505;overflow:hidden}
main.work .work-lead,main.work .work-welcome{display:grid;grid-template-columns:1.15fr 1fr;padding:0;margin:0;background:#050505;color:#e7e3da;align-items:stretch}
main.work .work-lead-copy,main.work .work-welcome>div{padding:clamp(24px,3.4vw,40px)}
main.work .work-lead h2,main.work .work-welcome h2{color:#e7e3da!important;font-size:clamp(27px,3.5vw,42px);line-height:1.1}
main.work .work-lead p,main.work .work-welcome p{color:#e7e3da}
main.work .work-lead .work-eyebrow,main.work .work-welcome .work-eyebrow{color:#b6bea7}
main.work .work-lead img,main.work .work-welcome img{height:100%;min-height:245px;max-height:350px;width:100%;object-fit:cover;object-position:60% center;display:block}
main.work .work-badge{display:inline-block;border:1px solid #707762;padding:5px 10px;font-size:12px;letter-spacing:.03em;color:#e7e3da}
main.work .work-cohort-body{padding:28px}
main.work .work-stats{display:grid;grid-template-columns:1fr 1fr 1.2fr;gap:20px;padding-bottom:24px;border-bottom:1px solid #b1b3a5}
main.work .work-stats span{display:block;font-size:13px;color:#4e5543;margin-bottom:5px}
main.work .work-stats strong{font-size:18px;display:block}
main.work progress{display:block;width:100%;height:7px;margin-top:12px;accent-color:#586548;border:0;background:#d1d4c7}
main.work progress::-webkit-progress-bar{background:#d1d4c7}main.work progress::-webkit-progress-value{background:#586548}
main.work .work-next{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px;padding:28px 0;align-items:center}
main.work .work-next h3{font-size:clamp(24px,2.6vw,30px)}main.work .work-next p{max-width:58ch}
main.work .work-next-actions{display:flex;align-items:stretch;flex-direction:column;min-width:185px}
main.work .work-next-actions button,main.work .work-next-actions a{margin:4px 0}
main.work .work-section-title{font-size:20px;margin:4px 0 16px}
main.work .work-tools{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:28px}
main.work a.work-tool{display:flex;position:relative;flex-direction:column;padding:18px 16px;border:1px solid #929685;background:#e7e3da;color:#050505;text-decoration:none;gap:12px;min-height:170px;transition:border-color .12s ease,background .12s ease}
main.work a.work-tool:hover,main.work a.work-tool:focus-visible{background:#d9dfce;border-color:#505c3d;color:#050505}
main.work .work-tool strong{font-size:19px;line-height:1.2}main.work .work-tool span{font-size:14px;line-height:1.5}
main.work .work-tool .work-tool-number{font-size:12px;letter-spacing:.1em;color:#555f47}
main.work .work-tool .work-tool-arrow{position:absolute;right:14px;top:12px;font-size:20px}
main.work .work-fold{border-top:1px solid #b1b3a5;margin:0;padding:4px 0}
main.work .work-fold summary{padding:14px 0;color:#050505}
main.work .work-fold summary span{font-size:13px;font-weight:400;color:#4e5543;margin-left:12px}
main.work .work-fold p{margin:10px 0 16px}
main.work .work-weeks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:0;list-style:none;margin:18px 0}
main.work .work-weeks li{padding:14px;border:1px solid #b1b3a5;background:#e7e3da;display:flex;flex-direction:column;gap:6px;font-size:13px;max-width:none;min-width:0}
main.work .work-weeks .work-week-title{font-size:16px;font-weight:700}
main.work .work-weeks .is-complete{background:#d9dfce;border-color:#707762}
main.work .work-weeks .is-current{border:2px solid #505c3d}
main.work .work-weeks button{font-size:13px;padding:8px 10px;margin:6px 0 0}
main.work .work-account{margin-top:24px;border-bottom:1px solid #b1b3a5}
main.work .work-notice{padding:20px;background:#e7e3da;border-left:3px solid #707762;margin:22px 0}
main.work .work-notice h3{font-size:20px}main.work .work-notice p{font-size:14px;line-height:1.65}
main.work .work-join{max-width:880px;margin-inline:auto!important}
main.work .work-welcome{margin:0 0 28px;border:1px solid #707762}
main.work .work-welcome-note{border-top:1px solid #707762;padding-top:16px;font-size:14px}
main.work .work-data-link{font-size:14px;margin-top:18px}
@media(max-width:800px){main.work .work-tools{grid-template-columns:repeat(2,minmax(0,1fr))}main.work .work-next{grid-template-columns:1fr;gap:8px}main.work .work-next-actions{flex-direction:row;flex-wrap:wrap;gap:8px}main.work .work-stats{grid-template-columns:1fr 1fr}main.work .work-stats>div:last-child{grid-column:1/-1}}
@media(max-width:560px){main.work{padding:20px 16px 36px}main.work .work-panel{padding:20px 16px}main.work .work-lead,main.work .work-welcome{grid-template-columns:1fr}main.work .work-lead img,main.work .work-welcome img{height:180px;min-height:0;object-position:center 38%}main.work .work-lead-copy,main.work .work-welcome>div{padding:24px 20px}main.work .work-cohort-body{padding:20px 16px}main.work .work-stats{gap:16px}main.work .work-stats strong{font-size:16px}main.work .work-tools{gap:10px}main.work a.work-tool{padding:16px 12px;min-height:182px}main.work .work-tool strong{font-size:17px}main.work .work-tool span{font-size:13px}main.work .work-next-actions{flex-direction:column}main.work .work-next-actions a,main.work .work-next-actions button{width:100%}main.work .work-weeks{grid-template-columns:1fr 1fr}main.work .work-fold summary span{display:block;margin-left:18px}main.work .work-notice{padding:16px}main.work th,main.work td{padding:10px}main.work .work-grid{grid-template-columns:1fr}}
`;
