// Read JSONC without mistaking comments or strings for active route declarations.
export function parseRouteConfig(input) {
 let out='', quote=false, escape=false, line=false, block=false;
 for(let i=0;i<input.length;i++){
  const c=input[i],n=input[i+1];
  if(line){if(c==='\n'){line=false;out+=c;}continue;}
  if(block){if(c==='*'&&n==='/'){block=false;i++;}else if(c==='\n')out+=c;continue;}
  if(quote){out+=c;if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}
  if(c==='"'){quote=true;out+=c;continue;}
  if(c==='/'&&n==='/'){line=true;i++;continue;}
  if(c==='/'&&n==='*'){block=true;i++;continue;}
  if(c===','){let j=i+1;while(/\s/.test(input[j]||'')&&j<input.length)j++;if(input[j]===']'||input[j]==='}')continue;}
  out+=c;
 }
 if(quote||block)throw Error('invalid_route_config');
 // A trailing comma followed by a comment is removed after comment stripping.
 let clean='',inside=false,escaped=false;
 for(let i=0;i<out.length;i++){const c=out[i];if(inside){clean+=c;if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')inside=false;continue;}if(c==='"')inside=true;if(c===','){let j=i+1;while(j<out.length&&/\s/.test(out[j]))j++;if(out[j]===']'||out[j]==='}')continue;}clean+=c;}
 return JSON.parse(clean);
}
export function productionAssetRouteCovers(config,host,asset){
 if(!/^(?:www\.)?shiftsometimber\.co\.uk$/.test(host)||!/^\/[a-z0-9.-]+$/.test(asset))return false;
 const routes=parseRouteConfig(config).routes;
 if(!Array.isArray(routes))return false;
 return routes.some(route=>{const p=typeof route==='string'?route:route?.pattern;if(typeof route==='object'&&Object.hasOwn(route,'script')&&!route.script)return false;return p===host+asset+'*'||p===host+'/*';});
}
