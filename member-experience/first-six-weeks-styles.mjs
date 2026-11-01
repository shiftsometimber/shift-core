export const firstSixWeeksStyles=String.raw`
.mt-six,.mt-six *{box-sizing:border-box}
.mt-six{--six-black:#050505;--six-cream:#E7E3DA;--six-green:#707762;font:16px/1.5 Arial,Helvetica,sans-serif;color:var(--six-cream);min-width:0}
.mt-six[hidden],body:not([data-member-session=ready]) .mt-six{display:none!important}
.mt-six :is(h1,h2,h3,p){margin:0 0 10px;color:inherit!important;-webkit-text-fill-color:currentColor!important}
.mt-six :is(h1,h2){font-family:Impact,'Arial Narrow',Arial,sans-serif!important;font-weight:900!important;letter-spacing:-.025em!important;line-height:1.02!important}
.mt-six h1{font-size:clamp(40px,8vw,58px)!important}.mt-six h2{font-size:clamp(36px,7vw,50px)!important}.mt-six h3{font-size:21px!important;line-height:1.2!important;letter-spacing:-.02em!important}
.mt-six .six-kicker{font-size:11px!important;font-weight:800!important;letter-spacing:.15em!important;text-transform:uppercase;line-height:1.4!important}
.mt-six a,.mt-six button{font:700 15px/1.3 Arial,sans-serif!important;min-height:44px!important;touch-action:manipulation}
.mt-six a{color:inherit!important;-webkit-text-fill-color:currentColor!important}
.mt-six :is(a,button,summary):focus-visible{outline:3px solid currentColor!important;outline-offset:4px!important}
.mt-six .six-action{display:flex!important;justify-content:center;align-items:center;width:100%;padding:12px 16px!important;border:1px solid var(--six-green)!important;border-radius:8px!important;background:var(--six-green)!important;color:var(--six-cream)!important;-webkit-text-fill-color:var(--six-cream)!important;text-decoration:none!important;text-align:center;cursor:pointer}
.mt-six-invite{overflow:hidden;background:var(--six-cream)!important;color:var(--six-black)!important;border:0!important;border-radius:13px!important;padding:0!important;margin:18px 0!important;width:100%;max-width:636px}
.mt-six-invite .six-photo{display:block;width:100%;height:160px;object-fit:cover;object-position:50% 38%;border:0;border-radius:0}
.mt-six-invite .six-copy{padding:18px 20px 16px}.mt-six-invite .six-kicker{color:#4b5341!important}.mt-six-invite .six-tagline{font-size:17px!important;margin:10px 0!important}
.mt-six .six-segments{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin:13px 0 9px}.mt-six .six-segments span{height:6px;border-radius:4px;background:#cbc8bf}.mt-six .six-segments span:first-child{background:var(--six-green)}
.mt-six .six-small{font-size:13px!important;line-height:1.45!important}.mt-six .six-free{text-align:center;font-size:12px!important;margin:9px 0 0!important}
.mt-six-journey-entry{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid var(--six-green);border-radius:12px;padding:16px;margin:0 0 18px;background:var(--six-cream);color:var(--six-black);text-decoration:none}
.mt-six-journey-entry strong{display:block;font-size:23px;line-height:1.15}.mt-six-journey-entry small{display:block;margin-top:5px;font-size:14px}.mt-six-journey-entry svg{width:22px;height:22px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8}
main.mt-six-programme{max-width:636px!important;margin:0 auto!important;padding:18px 18px 32px!important;background:var(--six-black)!important}
.mt-six .six-back{display:inline-flex;align-items:center;gap:7px;min-height:44px;text-decoration:none;font-size:14px!important;margin-bottom:8px}
.mt-six .six-list{margin:22px 0 12px;padding:0;list-style:none}.mt-six .six-row{position:relative;padding:0 0 0 52px;margin:0!important;border:0!important}
.mt-six .six-row:before{content:'';position:absolute;left:20px;top:27px;bottom:-20px;width:1px;background:var(--six-green)}.mt-six .six-row:last-child:before{display:none}
.mt-six .six-number{position:absolute;top:15px;left:0;width:41px;height:41px;border:1px solid var(--six-cream);border-radius:50%;display:grid;place-items:center;font-size:14px;font-weight:700;background:var(--six-black);z-index:1}
.mt-six .six-week-link{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:82px!important;padding:16px 0!important;border-bottom:1px solid #4d5347;text-decoration:none!important;cursor:pointer}
.mt-six .six-week-link strong{display:block;font-size:18px!important;line-height:1.25!important}.mt-six .six-week-link small{display:block;font-size:14px;font-weight:400;line-height:1.4;margin-top:5px}.mt-six .six-week-link svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8}
.mt-six .six-row:first-child{background:var(--six-green);border-radius:12px;padding:16px 14px 14px 65px;margin-bottom:8px!important}.mt-six .six-row:first-child .six-number{left:13px;top:20px;background:transparent}.mt-six .six-row:first-child:before{left:33px}.mt-six .six-row:first-child .six-week-link{border:0;padding:0!important;min-height:0!important}.mt-six .six-row:first-child .six-week-link>svg{display:none}
.mt-six .six-chips{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0}.mt-six .six-chips span{display:block;padding:5px 10px;border-radius:5px;background:var(--six-cream);color:var(--six-black);font-size:12px;font-weight:700}
.mt-six .six-row:first-child .six-action{background:var(--six-cream)!important;color:var(--six-black)!important;-webkit-text-fill-color:var(--six-black)!important;border-color:var(--six-cream)!important;margin-top:12px}
.mt-six .six-reassurance{text-align:center;padding:12px 0;font-size:13px!important}.mt-six .six-note{font-size:13px!important;line-height:1.5!important;padding-top:14px;border-top:1px solid #4d5347}
.mt-six .six-week-head{padding:12px 0 16px}.mt-six .six-touchpoint{background:#161a14;border:1px solid #4d5347;border-radius:12px;padding:18px;margin:12px 0}.mt-six .six-touchpoint h2{font-family:Arial,sans-serif!important;font-size:23px!important;line-height:1.15!important;letter-spacing:-.025em!important;margin:8px 0 12px!important}.mt-six .six-touchpoint p{font-size:16px!important;line-height:1.55!important}.mt-six .six-touchpoint>a{margin-top:15px}
.mt-six .six-week-picker{display:flex;gap:6px;margin:16px 0;flex-wrap:wrap}.mt-six .six-week-picker a{flex:1;display:grid;place-items:center;min-width:38px;border:1px solid var(--six-green);border-radius:6px;text-decoration:none}.mt-six .six-week-picker a[aria-current=step]{background:var(--six-cream);color:var(--six-black)!important}
@media(min-width:800px){.mt-six-invite{display:grid;grid-template-columns:40% 1fr;max-width:none}.mt-six-invite .six-photo{height:100%;min-height:250px;object-position:50% 50%}.mt-six-invite h2{font-size:44px!important}.mt-six-invite .six-copy{padding:22px}.mt-six .six-touchpoints{display:grid;grid-template-columns:1fr 1fr;gap:12px}.mt-six .six-touchpoint{margin:0}.mt-six .six-week-picker{margin-bottom:24px}}
@media(prefers-reduced-motion:reduce){.mt-six *{scroll-behavior:auto!important}}
`;
