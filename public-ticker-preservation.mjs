import {tickerStyles,tickerVersion} from './public-navigation-policy.mjs';
// Only the exact prior ticker stylesheet and its three version tokens may change.
// Header, content, links and every other style remain in the preservation hash.
export const previousTickerStyles = ".medicine-ticker-v138:not([data-shift-news-ticker]){display:none!important}\n#shift-public-news{box-sizing:border-box;display:grid!important;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:16px;width:100%;max-width:100%;overflow:hidden;background:#707762;color:#050505;border-block:1px solid #050505;padding:10px max(18px,4vw);font:700 14px/1.45 Arial,sans-serif}\n#shift-public-news a{color:#050505;text-decoration:none}#shift-public-news a:hover,#shift-public-news a:focus-visible{text-decoration:underline}#shift-public-news a:focus-visible,#shift-public-news button:focus-visible{outline:2px solid #050505;outline-offset:3px}\n#shift-public-news .shift-news-label{font-weight:900;white-space:nowrap}#shift-public-news .shift-news-window{min-width:0;overflow:hidden}#shift-public-news .shift-news-track{display:flex;width:max-content;max-width:none}#shift-public-news .shift-news-copy{display:flex;align-items:center;gap:24px;white-space:nowrap;padding-right:24px;flex-shrink:0}\n#shift-public-news:not([data-ready]) .shift-news-track{width:auto}#shift-public-news:not([data-ready]) .shift-news-copy{flex:1;min-width:0;max-width:100%;padding:0;white-space:normal;flex-wrap:wrap;gap:8px 18px}\n#shift-public-news[data-ready] .shift-news-track{animation:shiftPublicNews 90s linear infinite}#shift-public-news:hover .shift-news-track,#shift-public-news:focus-within .shift-news-track,#shift-public-news[data-paused] .shift-news-track{animation-play-state:paused}\n#shift-public-news .shift-news-pause{font:inherit;cursor:pointer;border:1px solid #050505;border-radius:4px;padding:4px 8px;background:#e7e3da;color:#050505}#shift-public-news [hidden]{display:none!important}\n@keyframes shiftPublicNews{to{transform:translateX(-50%)}}\n@media(max-width:560px){#shift-public-news{grid-template-columns:minmax(0,1fr) auto;gap:6px 12px}#shift-public-news .shift-news-label{grid-column:1}#shift-public-news .shift-news-pause{grid-column:2;grid-row:1}#shift-public-news .shift-news-window{grid-column:1/-1}}\n@media(prefers-reduced-motion:reduce){#shift-public-news .shift-news-track{animation:none!important;width:auto}#shift-public-news .shift-news-copy{white-space:normal;flex-wrap:wrap}#shift-public-news .shift-news-copy[aria-hidden]{display:none}#shift-public-news .shift-news-pause{display:none}}";
export function preserveTickerVersion(input){
 let html=input.toString('utf8');if(!Buffer.from(html).equals(input))return input;
 for(const before of ['public-news-20260917-r2','public-news-20260917-r3']){
  const attr=`data-shift-news-ticker="${before}"`,wire=`data-shift-ai-full-wire="${before}"`,script=`src="/assets/public-news-ticker-v1.js?v=${before}"`;
  const a=html.split(attr).length-1,w=html.split(wire).length-1,s=html.split(script).length-1;
  if(!a&&!w&&!s)continue;
  if(a!==1||w!==1||s!==1)throw Error('Unexpected old ticker version markers');
  const style='<style data-shift-public-news>'+previousTickerStyles+'</style>';
  if(html.split(style).length-1!==1)throw Error('Unexpected prior ticker stylesheet');
  const control="<button type=\"button\" class=\"shift-news-pause\" aria-label=\"Pause news ticker\" aria-pressed=\"false\" hidden>Pause</button>";
  if(html.split(control).length-1!==1)throw Error('Unexpected prior ticker control');
  html=html.replace(control,'').replace(style,'<style data-shift-public-news>'+tickerStyles+'</style>')
   .replace(attr,`data-shift-news-ticker="${tickerVersion}"`)
   .replace(wire,`data-shift-ai-full-wire="${tickerVersion}"`)
   .replace(script,`src="/assets/public-news-ticker-v1.js?v=${tickerVersion}"`);
 }
 return Buffer.from(html);
}
