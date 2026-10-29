// Source coverage only. Live ownership is checked against Cloudflare at release.
export function configuredWorkerRouteCovers(source,host,path){
  // Remove comments without changing quoted strings (including https:// URLs).
  let clean='',quoted=false,escaped=false;
  for(let i=0;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(quoted){clean+=c;if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
    if(c==='"'){quoted=true;clean+=c;continue;}
    if(c==='/'&&n==='/'){while(i<source.length&&source[i]!=='\n')i++;clean+='\n';continue;}
    if(c==='/'&&n==='*'){i+=2;while(i<source.length&&!(source[i]==='*'&&source[i+1]==='/'))i++;i++;continue;}
    clean+=c;
  }
  const target=host+path;
  return [...clean.matchAll(/"pattern"\s*:\s*("(?:\\.|[^"\\])*")/g)].some(match=>{
    let pattern;try{pattern=JSON.parse(match[1]).replace(/^https:\/\//,'');}catch{return false;}
    // An HTTP-only rule does not establish HTTPS coverage.
    if(pattern.startsWith('http://'))return false;
    const expression=pattern.split('*').map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*');
    return new RegExp('^'+expression+'$').test(target);
  });
}
