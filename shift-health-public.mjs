import {healthProducts,renderHealthProduct,productStyle,hubStyle,hubMain} from './shift-health-public-content.mjs';
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const healthSlugs=Object.keys(healthProducts);
export function renderShiftHealthDocument(shell,slug=''){
  const item=healthProducts[slug];if(slug&&!item)return null;
  const path='/shift-health'+(slug?'/'+slug:''),canonical='https://shiftsometimber.co.uk'+path;
  const title=item?item.name+' | SHIFT Health':'SHIFT Health | Wider Men’s Health';
  const description=item?item.intro:'Straight-talking wider men’s health guidance from SHIFT. Choose one useful next step for energy, sleep, confidence and health.';
  if(!/<main\b[\s\S]*?<\/main>/i.test(shell))throw Error('Canonical public shell missing main');
  let html=shell.replace(/<main\b[\s\S]*?<\/main>/i,()=>'<main id="main-content" data-shift-health'+(slug?' data-product':'')+'>'+ (item?renderHealthProduct(slug):hubMain)+'</main>')
    .replace(/<title>[\s\S]*?<\/title>/gi,'')
    .replace(/<link\b(?=[^>]*\brel\s*=\s*(?:"canonical"|'canonical'|canonical(?=[\s/>])))[^>]*>/gi,'')
    .replace(/<meta\b(?=[^>]*(?:name|property)\s*=\s*["'](?:description|og:[^"']+|twitter:[^"']+)["'])[^>]*>/gi,'')
    .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<script\b[^>]*src=["'][^"']*programme[^"']*["'][^>]*>[\s\S]*?<\/script>/gi,'')
    .replace(/<body\b([^>]*)>/i,(_,attrs)=>'<body'+attrs.replace(/\sclass=(["'])(.*?)\1/i,(_,quote,classes)=>' class='+quote+classes.split(/\s+/).filter(c=>!c.startsWith('programme')).concat('shift-health-public').join(' ')+quote)+'>');
  // Use the same header, drawer, footer, consent and core styles as the accepted public shell.
  html=html.replace(/(<a\b[^>]*href=["']\/programme["'][^>]*?)\saria-current=["']page["']/gi,'$1');
  html=html.replace(/<a\b([^>]*href=["']\/shift-health["'][^>]*)>/gi,(tag,attrs)=>attrs.includes('aria-current')?tag:'<a'+attrs+' aria-current="page">');
  if(!/class=["'][^"']*skip-link/.test(html))html=html.replace(/<body[^>]*>/i,'$&<a class="skip-link" href="#main-content">Skip to main content</a>');
  const schema={'@context':'https://schema.org','@graph':[{'@type':item?'WebPage':'CollectionPage',name:title,description,url:canonical,isPartOf:{'@id':'https://shiftsometimber.co.uk/#website'}},{'@type':'Organization','@id':'https://shiftsometimber.co.uk/#organization',name:'Shift Some Timber',url:'https://shiftsometimber.co.uk/',logo:{'@type':'ImageObject',url:'https://shiftsometimber.co.uk/assets/shift-wordmark.png'}}]};
  return html.replace('</head>',`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${canonical}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:type" content="website"><meta property="og:image" content="https://shiftsometimber.co.uk/assets/og-default.jpg"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script><style data-shift-health-style>${item?productStyle:hubStyle}\n[data-shift-health]{--b:#050505;--c:#e7e3da;--g:#707762;--l:#a7af94;display:block;min-width:0}[data-product]{width:min(1160px,calc(100% - 36px));margin:auto}[data-shift-health] img{max-width:100%}[data-shift-health] .next .btn.alt{color:#050505;border-color:#050505}</style></head>`);
}
