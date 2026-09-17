export const path='/shift-health/testosterone-energy';
export const related=['/shift-health','/shift-health/sleep-apnoea','/shift-health/erectile-dysfunction'];
export function render(shell,content,css){
 if(!/<main\b[\s\S]*?<\/main>/i.test(shell))throw Error('Health shell missing main');
 const title='Testosterone & Energy: Assessment, TRT & Fertility | SHIFT Health';
 let html=shell.replace(/<main\b[\s\S]*?<\/main>/i,()=>'<main id="main-content" class="th">'+content+'</main>')
 .replace(/<title>[\s\S]*?<\/title>/gi,'<title>'+title+'</title>')
 .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|og:title|og:description|twitter:title|twitter:description)["'][^>]*>/gi,'')
 .replace(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi,'')
 .replace(/<body([^>]*)>/i,'<body$1><div class="th-preview">PREVIEW FOR MATT · Information hub · Clinical service not live</div>');
 const description='Understand testosterone assessment, TRT, fertility and monitoring. Clear next steps for persistent symptoms. SHIFT does not prescribe; testing is not bookable.';
 const canonical='https://shiftsometimber.co.uk'+path;
 html=html.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi,'');
 return html.replace('</head>',`<link rel="canonical" href="${canonical}"><meta name="description" content="${description}"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="robots" content="noindex,nofollow"><style>${css}</style><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'WebPage',name:title,description,url:canonical,inLanguage:'en-GB'})}</script></head>`);
}
export function addRelated(html,pathname){
 if(!related.includes(pathname)||html.includes('data-testosterone-link'))return html;
 // Energy already routes to this hub. Preserve that existing card and add only the requested bridge.
 const text=pathname==='/shift-health'?'Persistent energy, sleep or sex-drive concerns?':'Could testosterone be part of the picture?';
 return html.replace('</main>',`<section data-testosterone-link style="max-width:1108px;margin:32px auto;padding:25px;border:1px solid #707762;border-radius:20px;color:#e7e3da;background:#050505"><h2>${text}</h2><p>Understand assessment, fertility and follow-up without assuming a diagnosis.</p><a style="color:inherit" href="${path}">Explore Testosterone &amp; Energy →</a></section></main>`);
}
