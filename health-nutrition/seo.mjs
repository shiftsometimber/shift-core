import {productEditorial} from './editorial.mjs';

const origin='https://shiftsometimber.co.uk';
const rangePath='/shift-health/supplements-nutrition';
const productURL=id=>origin+rangePath+'?product='+encodeURIComponent(id);

// Metadata describes the visible educational guide. It is not a sale offer.
const searchCopy={
 whey:{title:'Applied Nutrition Critical Whey: Guide & Uses | SHIFT',description:'Understand Applied Nutrition Critical Whey: its role as a protein drink, milk allergy information, everyday use and comparison with clear whey. Proposed range.'},
 clear:{title:'Applied Nutrition Clear Whey: Milk, Uses & FAQs | SHIFT',description:'Is clear whey dairy-free? Understand Applied Nutrition Clear Whey, its milk ingredients, everyday use and how it compares with a milky protein shake.'},
 creatine:{title:'Applied Nutrition Creatine: Uses & Exercise Guide | SHIFT',description:'Understand Applied Nutrition creatine: the specific exercise benefit, daily creatine amount, water-weight changes and how it differs from protein powder.'},
 skill:{title:'Skill Nutrition Micronised Creatine: Guide | SHIFT',description:'Understand Skill Nutrition micronised creatine: exercise context, powder versus creatine amounts, water-weight changes and comparison with unflavoured creatine.'},
 sticks:{title:'Bodyfuel Hydration Sticks: Guide & Uses | SHIFT',description:'Explore Bodyfuel Hydration Sticks: their portable drink-mix format, comparison with tablets, what to check and when your usual drinks may be enough.'},
 tablets:{title:'Bodyfuel Hydration Tablets: Guide & Uses | SHIFT',description:'Explore Bodyfuel Hydration Tablets: how the dissolving format fits your day, pack quantities, label checks and comparison with hydration sticks.'},
 crunch:{title:'Applied Nutrition Protein Crunch Bars: Guide | SHIFT',description:'Explore Applied Nutrition Protein Crunch Bars: snack use, allergy checks and comparison with Chunky Protein Bars. Understand the whole bar before choosing.'},
 chunky:{title:'BioTechUSA Chunky Protein Bars: Guide | SHIFT',description:'Explore BioTechUSA Chunky Protein Bars: ingredients to check, collagen, snack use and comparison with Protein Crunch Bars. Proposed range; ordering is closed.'}
};

export function productSearchMetadata(product){
 return productEditorial(product)?searchCopy[product.id]:null;
}

export function pageStructuredData(path,query,view,products){
 const product=products.find(p=>p.id===query.get('product'));
 const guide=product&&productEditorial(product);
 const canonical=origin+path+(product?'?product='+encodeURIComponent(product.id):'');
 const isRange=path===rangePath;
 const image=origin+'/shift-health/assets/'+(product?encodeURIComponent(product.id):path==='/shift-health'?'family-park':'nutrition-kitchen')+'.webp';
 const page={
  '@type':product?'WebPage':'CollectionPage',
  '@id':canonical+'#webpage',url:canonical,name:view.title,description:view.description,
  inLanguage:'en-GB',image,
  publisher:{'@type':'Organization',name:'Shift Some Timber Ltd',url:origin+'/'},
  ...(product?{about:{'@type':'Thing',name:product.brand+' '+product.name}}:{}),
  ...(guide?{citation:guide.sources.map(source=>source.url)}:{})
 };
 const graph=[page];
 if(isRange){
  const crumbs=[['SHIFT Health',origin+'/shift-health'],['Supplements & Nutrition',origin+rangePath]];
  if(product)crumbs.push([product.name,canonical]);
  const breadcrumb={'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:crumbs.map(([name,item],index)=>({'@type':'ListItem',position:index+1,name,item}))};
  page.breadcrumb={'@id':breadcrumb['@id']};graph.push(breadcrumb);
  if(!product){
   const list={'@type':'ItemList','@id':canonical+'#range',numberOfItems:products.length,itemListElement:products.map((p,index)=>({'@type':'ListItem',position:index+1,name:p.name,url:productURL(p.id)}))};
   page.mainEntity={'@id':list['@id']};graph.push(list);
  }
 }
 // Exact variants, prices and sales are not verified. Do not manufacture an
 // Offer, rating, Review or incomplete Product rich-result claim. Visible FAQs
 // remain helpful HTML; no FAQ rich-result eligibility is asserted.
 return {'@context':'https://schema.org','@graph':graph};
}
