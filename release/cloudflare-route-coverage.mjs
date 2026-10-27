// Planned route coverage only; this does not certify provider deployment.
export function parseRouteConfig(text){
 let clean='',quote=false,escape=false,state='normal';
 for(let i=0;i<text.length;i++){const c=text[i],next=text[i+1];if(state==='line'){if(c==='\n'){clean+='\n';state='normal';}continue;}if(state==='block'){if(c==='*'&&next==='/'){i++;clean+=' ';state='normal';}else if(c==='\n')clean+='\n';continue;}if(quote){clean+=c;if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}if(c==='"'){quote=true;clean+=c;}else if(c==='/'&&next==='/'){state='line';i++;}else if(c==='/'&&next==='*'){state='block';i++;}else clean+=c;}
 let json='';quote=false;escape=false;for(let i=0;i<clean.length;i++){const c=clean[i];if(quote){json+=c;if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quote=false;continue;}if(c==='"')quote=true;if(c===','){let j=i+1;while(/\s/.test(clean[j]||'')&&j<clean.length)j++;if(clean[j]===']'||clean[j]==='}')continue;}json+=c;}return JSON.parse(json);
}
export function plannedCoreRouteCovers(text,host,path){
 const config=parseRouteConfig(text);if(config.name!=='shift-core'||!Array.isArray(config.routes)||!path.startsWith('/'))return false;
 const escape=s=>s.replace(/[.*+?^$(){}|[\]\\]/g,'\\$&');
 const matching=config.routes.filter(row=>{const pattern=typeof row==='string'?row:row?.pattern;if(typeof pattern!=='string')return false;const target=pattern.includes('://')?'https://'+host+path:host+path;return new RegExp('^'+pattern.split('*').map(escape).join('.*')+'$').test(target);});
 // A matching explicit exclusion or different owner must never be hidden by a
 // broad wildcard. The canonical configuration currently has no such override.
 if(matching.some(row=>typeof row==='object'&&Object.hasOwn(row,'script')&&row.script!==config.name))return false;
 return matching.length>0;
}
