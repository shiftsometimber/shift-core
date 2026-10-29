const css=String.raw`
html body main#main-content#main-content#main-content .shh-hero{display:block;position:relative;isolation:isolate;max-width:1180px;min-height:560px;gap:0;padding:0;margin:24px auto;border:1px solid #707762;border-radius:12px;overflow:hidden;background:#050505;color:#E7E3DA;box-sizing:border-box;float:none;clear:both;text-align:left}
html body main#main-content#main-content#main-content .shh-hero *{box-sizing:border-box}
html body main#main-content#main-content#main-content .shh-photo{display:block;position:absolute;right:0;top:0;bottom:0;width:var(--shh-photo-width);height:auto;margin:0;padding:0;overflow:hidden;border:0;background:#050505;border-radius:0}
html body main#main-content#main-content#main-content .shh-photo img{display:block;position:absolute;right:-12%;top:0;height:100%;width:auto;max-width:none;max-height:none;object-fit:contain;aspect-ratio:auto;border:0;border-radius:0;filter:none}
html body main#main-content#main-content#main-content .shh-photo:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,#050505 0%,rgba(5,5,5,.75) 3%,rgba(5,5,5,0) 13%)}
html body main#main-content#main-content#main-content .shh-copy{display:block;position:relative;z-index:2;width:57%;padding:34px 22px 32px 38px;min-height:0;background:transparent;color:#E7E3DA;text-align:left;overflow:visible}
html body main#main-content#main-content#main-content .shh-brand{font-size:15px;font-weight:700;line-height:1.3;letter-spacing:.19em;margin:0 0 24px;color:#E7E3DA;text-transform:none}
html body main#main-content#main-content#main-content .shh-eyebrow{font-size:10px;line-height:1.3;letter-spacing:.2em;margin:0 0 15px;color:#E7E3DA;text-transform:none}
html body main#main-content#main-content#main-content .shh-hero h1{display:block;font-family:inherit;font-size:clamp(38px,4vw,51px);line-height:1.03;letter-spacing:-.04em;font-weight:800;margin:0 0 20px;padding:0;color:#E7E3DA;max-width:650px;text-transform:none;text-align:left;white-space:normal;border:0;background:transparent}
html body main#main-content#main-content#main-content .shh-lede{font-size:15px;line-height:1.5;max-width:470px;margin:0 0 25px;padding:0;color:#E7E3DA;letter-spacing:0;text-align:left;background:transparent}
html body main#main-content#main-content#main-content .shh-benefits{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;max-width:375px;margin:0 0 27px;padding:0;list-style:none;color:#E7E3DA;background:transparent;border:0}
html body main#main-content#main-content#main-content .shh-benefits li{display:flex;flex-direction:column;align-items:center;gap:9px;text-align:center;font-size:12px;line-height:1.35;min-width:0;margin:0;padding:0;background:transparent;color:#E7E3DA;border:0}
html body main#main-content#main-content#main-content .shh-benefits li:before{display:none;content:none}
html body main#main-content#main-content#main-content .shh-benefits span{display:block;color:#E7E3DA;font-size:12px;font-weight:400;line-height:1.35;text-transform:none;letter-spacing:0}
html body main#main-content#main-content#main-content .shh-benefits svg{width:35px;height:35px;display:block;flex-shrink:0;color:#E7E3DA;fill:none;stroke:currentColor}
html body main#main-content#main-content#main-content a.shh-cta{display:flex;align-items:center;justify-content:center;width:fit-content;max-width:100%;min-height:54px;padding:13px 28px;border:1px solid #707762;border-radius:999px;background:#707762;color:#E7E3DA;font-size:20px;font-weight:700;line-height:1.3;text-decoration:none;text-align:center;letter-spacing:0;text-transform:none;white-space:normal;box-shadow:none}
html body main#main-content#main-content#main-content a.shh-cta:focus-visible,html body main#main-content#main-content#main-content a.shh-urgent:focus-visible{outline:3px solid #E7E3DA;outline-offset:5px}
html body main#main-content#main-content#main-content .shh-note{font-size:12px;font-weight:400;line-height:1.5;margin:13px 0 0;padding:0;color:#E7E3DA;letter-spacing:0;background:transparent}
html body main#main-content#main-content#main-content a.shh-urgent{display:block;font-size:13px;font-weight:500;line-height:1.5;margin:15px 0 0;padding:0;color:#E7E3DA;text-decoration:underline;text-transform:none;background:transparent}
html body main#main-content#main-content#main-content .productHero.shh-original-context{display:block;grid-template-columns:none;min-height:0;margin-top:20px;padding:22px 0;background:transparent;border:0;border-bottom:1px solid #707762}
html body main#main-content#main-content#main-content .productHero.shh-original-context h2{font-size:28px;line-height:1.2;margin:12px 0}
@media(max-width:1000px) and (min-width:701px){html body main#main-content#main-content#main-content .shh-copy{width:61%;padding:28px 18px 28px 26px}html body main#main-content#main-content#main-content .shh-hero h1{font-size:40px}html body main#main-content#main-content#main-content .shh-photo img{right:-15%}}
@media(max-width:700px){
html body main#main-content#main-content#main-content .shh-hero{display:flex;flex-direction:column;min-height:0;gap:0;border-radius:10px;margin:18px auto}
html body main#main-content#main-content#main-content .shh-photo{position:relative;inset:auto;width:100%;height:auto;aspect-ratio:var(--shh-photo-ratio);flex:0 0 auto;order:0}
html body main#main-content#main-content#main-content .shh-photo img{right:0;height:100%;width:auto}
html body main#main-content#main-content#main-content .shh-photo:after{background:linear-gradient(0deg,#050505,rgba(5,5,5,0) 16%)}
html body main#main-content#main-content#main-content .shh-copy{display:flex;flex-direction:column;order:1;width:100%;padding:18px 22px 26px}
html body main#main-content#main-content#main-content .shh-brand{font-size:12px;margin-bottom:17px}
html body main#main-content#main-content#main-content .shh-eyebrow{font-size:9px;margin-bottom:13px}
html body main#main-content#main-content#main-content .shh-hero h1{font-size:clamp(28px,8vw,36px);line-height:1.05;margin-bottom:18px}
html body main#main-content#main-content#main-content .shh-lede{font-size:14px;line-height:1.5;margin-bottom:22px}
html body main#main-content#main-content#main-content .shh-benefits{gap:10px;margin-bottom:24px;width:100%}
html body main#main-content#main-content#main-content .shh-benefits li,html body main#main-content#main-content#main-content .shh-benefits span{font-size:10px;line-height:1.4;gap:8px}
html body main#main-content#main-content#main-content .shh-benefits svg{width:29px;height:29px}
html body main#main-content#main-content#main-content a.shh-cta{width:100%;font-size:20px;min-height:52px;padding:12px 14px}
html body main#main-content#main-content#main-content .shh-note{font-size:11px;margin-top:11px}
html body main#main-content#main-content#main-content a.shh-urgent{font-size:13px;margin:0 0 18px;order:-1}
}
`;
export const heroStyle=css.replace(/([a-z-]+):([^;{}]+)(?=[;}])/g,(_,key,value)=>key+':'+value.trim()+' !important');
