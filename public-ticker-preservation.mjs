// The only response-body change in r3 is these two exact ticker version tokens.
// Keep hashing the rest of each page, including all header and article markup.
export function preserveTickerVersion(input){
 const before='public-news-20260917-r2',after='public-news-20260917-r3';
 let html=input.toString('utf8');if(!Buffer.from(html).equals(input))return input;
 const attr=`data-shift-news-ticker="${before}"`,script=`src="/assets/public-news-ticker-v1.js?v=${before}"`;
 const a=html.split(attr).length-1,s=html.split(script).length-1;
 if(!a&&!s)return input;
 if(a!==1||s!==1)throw Error('Unexpected old ticker version markers');
 html=html.replace(attr,`data-shift-news-ticker="${after}"`).replace(script,`src="/assets/public-news-ticker-v1.js?v=${after}"`);
 return Buffer.from(html);
}
