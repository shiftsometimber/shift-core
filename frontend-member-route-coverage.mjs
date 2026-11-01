import assert from 'node:assert/strict';

const HOSTS=['shiftsometimber.co.uk','www.shiftsometimber.co.uk'];

// Match the current configuration format without treating comments, variables
// or quoted URL punctuation as routing declarations. This follows the same
// JSONC tokenisation used by scripts/cloudflare-route-capacity.py.
export function parseRouteConfig(source){
  const stringsOrComments=/"(?:\\.|[^"\\])*"|\/\/[^\n]*|\/\*[\s\S]*?\*\//g;
  const stringsOrTrailingCommas=/"(?:\\.|[^"\\])*"|,\s*(?=[}\]])/g;
  const clean=source.replace(stringsOrComments,token=>token.startsWith('"')?token:' ')
    .replace(stringsOrTrailingCommas,token=>token.startsWith('"')?token:'');
  return JSON.parse(clean);
}

function declaredCoreRoutes(config){
  if(config.name!=='shift-core')return [];
  assert(!(config.route&&config.routes),'Ambiguous route and routes declarations');
  const rows=config.routes??(config.route?[config.route]:[]);
  assert(Array.isArray(rows),'Worker routes must be an array');
  return rows.map(input=>{
    const row=typeof input==='string'?{pattern:input}:input;
    assert(row&&typeof row==='object'&&typeof row.pattern==='string','Invalid Worker route');
    // Wrangler declares routes for this Worker only. Owner overrides/disabled
    // exceptions are not evidence that Core handles a request; fail closed.
    assert(!Object.hasOwn(row,'script')&&!Object.hasOwn(row,'enabled'),'Unexpected route ownership override');
    if(row.custom_domain===true)return null;
    if(row.zone_name)assert.equal(row.zone_name.toLowerCase(),'shiftsometimber.co.uk','Route belongs to another zone');
    const match=row.pattern.match(/^(?:(https?):\/\/)?([a-z0-9.-]+)(\/[^?#]*)?$/i);
    assert(match,'Unsupported route pattern; inspect before accepting coverage');
    const path=match[3]||'/',wildcard=path.endsWith('*'),literal=wildcard?path.slice(0,-1):path;
    assert(!literal.includes('*'),'Unsupported infix route wildcard');
    return {scheme:match[1]?.toLowerCase(),host:match[2].toLowerCase(),literal,wildcard};
  }).filter(Boolean);
}

export function coversCanonicalMemberRoute(config,path){
  assert(/^\/[^?#]+$/.test(path),'A literal member path is required');
  const routes=declaredCoreRoutes(config);
  // Cloudflare matches the entire URL, including the query string. A plain
  // exact-path route is insufficient for the versioned JS/CSS clients.
  // https://developers.cloudflare.com/workers/configuration/routing/routes/
  return HOSTS.every(host=>['','?v=member-source-proof'].every(query=>routes.some(route=>
    route.host===host&&(!route.scheme||route.scheme==='https')&&
    (route.wildcard?(path+query).startsWith(route.literal):path+query===route.literal)
  )));
}
