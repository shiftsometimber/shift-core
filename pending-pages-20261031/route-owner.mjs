// Route specificity excludes the optional scheme's character count.
// Exact routes take precedence over the same path with a trailing wildcard.
export function routeOwner(routes,input){
 const url=new URL(input),target=url.host+url.pathname+url.search;
 const ranked=routes.flatMap(route=>{
  const scheme=route.pattern.match(/^(https?):\/\//)?.[1];
  if(scheme&&url.protocol!==scheme+':')return [];
  const pattern=route.pattern.replace(/^https?:\/\//,'');
  const expression=pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
  if(!new RegExp('^'+expression+'$').test(target))return [];
  return [{route,literal:pattern.replaceAll('*','').length,wildcards:pattern.split('*').length-1,scheme:Number(Boolean(scheme))}];
 });
 const compare=(a,b)=>b.literal-a.literal||a.wildcards-b.wildcards||b.scheme-a.scheme;
 ranked.sort(compare);
 if(ranked.length>1&&compare(ranked[0],ranked[1])===0&&ranked[0].route.script!==ranked[1].route.script)throw Error('Ambiguous route owner '+input);
 return ranked[0]?.route;
}
