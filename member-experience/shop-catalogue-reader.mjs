// Read the finite public catalogue from its existing serving owners. These
// internal service calls never carry a member cookie or authorisation header.
const origin='https://shiftsometimber.co.uk';
export const shopCatalogueBindings=[
 {name:'MY_TIMBER_PUBLIC_TESTING',type:'service',service:'shift-health-nutrition-20261027',environment:'production'},
 {name:'MY_TIMBER_PUBLIC_NUTRITION',type:'service',service:'shift-health-heroes-20261029',environment:'production'},
 {name:'MY_TIMBER_PUBLIC_KIT',type:'service',service:'shift-timber-mill-presentation-20261021',environment:'production'}
];
export function shopCatalogueReader(env){return async request=>{
 const url=new URL(request.url);
 if(url.origin!==origin||request.method!=='GET'||[...request.headers.keys()].some(k=>k!=='accept'))throw Error('Invalid public catalogue read');
 const key=url.pathname==='/assets/shift-purchase-basket-v1.js'||/^\/shift-health\/testing(?:\/[a-z0-9-]{1,70})?$/.test(url.pathname)?'MY_TIMBER_PUBLIC_TESTING':url.pathname==='/shift-health/supplements-nutrition'?'MY_TIMBER_PUBLIC_NUTRITION':url.pathname==='/shop'?'MY_TIMBER_PUBLIC_KIT':null;
 if(!key||!env[key]?.fetch)throw Error('Current public catalogue owner unavailable');
 return env[key].fetch(request);
};}
