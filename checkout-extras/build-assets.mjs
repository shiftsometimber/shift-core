import fs from 'node:fs';
const here=new URL('./',import.meta.url);
for(const [source,destination,name] of [[new URL('live-support.js',here),new URL('live-support.mjs',here),'liveSupportClient'],[new URL('client.js',here),new URL('client.mjs',here),'extrasClient'],[new URL('../health-nutrition/hq-client.js',here),new URL('../health-nutrition/hq-client.mjs',here),'hqClient']]){
 const expected='export const '+name+'='+JSON.stringify(fs.readFileSync(source,'utf8'))+';\n';
 if(process.argv.includes('--check')){const current=await import(destination.href+'?check='+Date.now());if(current[name]!==fs.readFileSync(source,'utf8'))throw Error('Stale generated browser module: '+destination.pathname);}
 else fs.writeFileSync(destination,expected);
}
const {purchaseBasketAsset}=await import('../public-purchase-basket.mjs');
fs.writeFileSync(new URL('basket-asset.js',here),await purchaseBasketAsset(new Request('https://shiftsometimber.co.uk/assets/shift-purchase-basket-v1.js')).text());
