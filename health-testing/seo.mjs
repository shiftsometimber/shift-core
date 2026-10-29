import {testingHeroKey} from './hero-media.mjs';
import {rangeProducts,rangeById,checkedOn,testPath,methodLabel} from './catalogue.mjs';
import {productMedia,imagePath} from './media.mjs';
import {contextFor} from './product-context.mjs';
import {faqItems} from './public.mjs';
const origin='https://shiftsometimber.co.uk';
const organization={'@type':'Organization','@id':origin+'/#organization',name:'Shift Some Timber Ltd',url:origin};
export function testingSEO(path){
 const p=rangeById[path.replace('/shift-health/testing/','')],url=origin+path;
 const trail=[['Home','/'],['SHIFT Health','/shift-health'],['Testing & Wellbeing','/shift-health/testing'],...(p?[[p.name,path]]:[])];
 const graph=[organization,{'@type':'BreadcrumbList','@id':url+'#breadcrumbs',itemListElement:trail.map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:origin+path}))}];
 let image=origin+imagePath(testingHeroKey);
 if(p){
  const context=contextFor(p.id),name=p.name+(['lab','home'].includes(p.type)?' '+methodLabel(p):'');image=origin+imagePath(productMedia[p.id].gallery[0]);
  graph.push({'@type':'WebPage','@id':url+'#webpage',url,name:name+' | SHIFT Health',description:context.short,inLanguage:'en-GB',dateModified:checkedOn,publisher:{'@id':organization['@id']},breadcrumb:{'@id':url+'#breadcrumbs'},mainEntity:{'@id':url+'#product'},citation:context.evidence.map(([,url])=>url)});
  // Price is TBC: no Offer, price, fabricated review or rating is emitted.
  graph.push({'@type':'Product','@id':url+'#product',name,description:context.short,url,image:productMedia[p.id].gallery.map(key=>origin+imagePath(key)),category:p.type==='lab'?'Laboratory test':p.type==='home'?'Home self-test':p.type==='supplement'?'Food supplement':'Test and wellbeing bundle',additionalProperty:[{'@type':'PropertyValue',name:'Availability',value:p.state==='coming_soon'?'Coming soon; ordering unavailable':'Out of stock; ordering unavailable'},{'@type':'PropertyValue',name:'Price',value:'To be confirmed'},{'@type':'PropertyValue',name:['home','lab'].includes(p.type)?'Sample':'Format',value:p.sample},...p.markers.map(marker=>({'@type':'PropertyValue',name:['home','lab'].includes(p.type)?'Checks':'Published product information',value:marker}))]});
  graph.push({'@type':'FAQPage','@id':url+'#questions',mainEntity:faqItems(p).map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))});
 }else graph.push({'@type':'CollectionPage','@id':url+'#webpage',url,name:'Testing & Wellbeing | SHIFT Health',inLanguage:'en-GB',dateModified:checkedOn,publisher:{'@id':organization['@id']},breadcrumb:{'@id':url+'#breadcrumbs'},mainEntity:{'@type':'ItemList',numberOfItems:rangeProducts.length,itemListElement:rangeProducts.map((p,i)=>({'@type':'ListItem',position:i+1,name:p.name,url:origin+testPath(p.id)}))}});
 return {graph:{'@context':'https://schema.org','@graph':graph},image};
}
export function testingSitemap(){return '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+['/shift-health/testing',...rangeProducts.map(p=>testPath(p.id))].map(path=>'<url><loc>'+origin+path+'</loc><lastmod>'+checkedOn+'</lastmod></url>').join('')+'</urlset>';}
