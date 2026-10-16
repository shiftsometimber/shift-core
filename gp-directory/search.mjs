const nations=['England','Wales','Scotland','Northern Ireland'];
export const normaliseSearch=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
export const normalisePostcode=s=>{const p=String(s).toUpperCase().replace(/\s+/g,'');return p?p.slice(0,-3)+' '+p.slice(-3):'';};
export function validateSearch({query='',near='',nation='',limit=12}){
 if(typeof query!=='string'||query.trim().length<3||query.trim().length>80||/[\u0000-\u001f\u007f]/.test(query))throw Error('invalid_search');
 if(typeof near!=='string'||near.length>12||near&& !/^(?:GIR\s?0AA|[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/i.test(near.trim()))throw Error('invalid_postcode');
 if(nation&&!nations.includes(nation))throw Error('invalid_nation');
 return {query:normaliseSearch(query),near:normalisePostcode(near),nation,limit:Math.max(1,Math.min(50,Number(limit)||12))};
}
const safeLike=s=>s.replace(/[\\%_]/g,'\\$&');
export async function directoryVersion(DB){
 const v=await DB.prepare('SELECT v.* FROM gp_directory_active a JOIN gp_directory_versions v ON v.version=a.version WHERE a.singleton=1 AND v.complete=1').first();
 if(!v)throw Error('directory_unavailable');
 const counts=JSON.parse(v.counts_json);if(nations.some(n=>!Number.isInteger(counts[n])||counts[n]<1))throw Error('directory_incomplete');
 return {...v,counts,sources:JSON.parse(v.sources_json)};
}
export async function searchDirectory(DB,input){
 const {query,near,nation,limit}=validateSearch(input),v=await directoryVersion(DB);
 let origin=null;if(near&&!near.startsWith('BT'))origin=await DB.prepare('SELECT east,north FROM gp_directory_postcodes WHERE version=? AND postcode=?').bind(v.version,near).first();
 const terms=query.split(' ').filter(Boolean),bind=[v.version,...terms.map(s=>'%'+safeLike(s)+'%')];
 let where=terms.map(()=>"search_text LIKE ? ESCAPE '\\'").join(' AND ');if(nation){where+=' AND nation=?';bind.push(nation);}
 // Match the complete active dataset before ranking or limiting, so a distant
 // first alphabetic page cannot hide a nearer name match.
 const results=(await DB.prepare('SELECT code,nation,name,address_json,postcode,source,east,north,parent_code,entry_kind FROM gp_directory_practices WHERE version=? AND status=\'ACTIVE\' AND '+where).bind(...bind).all()).results||[];
 const ranked=results.map(r=>({...r,distanceMetres:origin&&Number.isFinite(r.east)&&Number.isFinite(r.north)?Math.hypot(r.east-origin.east,r.north-origin.north):null}));
 ranked.sort((a,b)=>origin?(a.distanceMetres??Infinity)-(b.distanceMetres??Infinity)||a.name.localeCompare(b.name):Number(normaliseSearch(b.name).startsWith(query))-Number(normaliseSearch(a.name).startsWith(query))||a.name.localeCompare(b.name));
 return {practices:ranked.slice(0,limit).map(r=>({name:r.name,code:r.parent_code||r.code,siteCode:r.code,entryKind:r.entry_kind,nation:r.nation,address:JSON.parse(r.address_json),postcode:r.postcode,source:r.source,distanceMiles:r.distanceMetres===null?null:Math.round(r.distanceMetres/1609.344*10)/10})),totalMatches:ranked.length,hasMore:ranked.length>limit,source:'NHS ODS / Public Health Scotland',coverage:'United Kingdom: England, Wales, Scotland and Northern Ireland',directoryVersion:v.version,checkedAt:v.imported_at,order:origin?'nearest_matching_practices':'name_relevance',distanceNote:near.startsWith('BT')?'Distance ordering is unavailable for Northern Ireland. All matching practices remain searchable.':origin?'Approximate straight-line distance from your postcode; choose your registered practice.':near?'That postcode could not be located. Matches are ordered by name.':'Enter a postcode to put nearer matching practices first.',registrationVerified:false};
}
