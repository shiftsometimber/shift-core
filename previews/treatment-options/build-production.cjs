const fs=require('node:fs'),path=require('node:path');
const base=__dirname;let source=fs.readFileSync(path.join(base,'page.mjs'),'utf8');
function replace(from,to){if(!source.includes(from))throw Error('Approved source changed: '+from);source=source.replace(from,to);}
replace("import {catalogue} from './catalogue.mjs';\n",'');
replace('export const products=[...catalogue.products]','export function catalogueProducts(catalogue){return [...catalogue.products]');
replace("pricePence-b.pricePence)}));","pricePence-b.pricePence)}));}");
replace('export function catalogueMain(url){','export function catalogueMain(url,products){');
replace('export function mainFor(url){','export function mainFor(url,products){');
replace('catalogueMain(url),product','catalogueMain(url,products),product');
fs.writeFileSync(path.join(base,'production-page.mjs'),source);
const worker=fs.readFileSync(path.join(base,'worker.mjs'),'utf8'),ticker=worker.split('\n').find(x=>x.startsWith('export const ticker='));
if(!ticker)throw Error('Approved ticker not found');fs.writeFileSync(path.join(base,'production-ticker.mjs'),ticker+'\n');
