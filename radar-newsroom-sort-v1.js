// One comparator for server-rendered and interactive order. Never use scan or
// modification timestamps to make an already published article look newer.
export const NEWSROOM_SORTS = [['newest','Newest first'],['oldest','Oldest first'],['az','A–Z'],['za','Z–A']];
export function newsPublicationDate(row) {
  let content={};try{content=typeof row.content_package_json==='string'?JSON.parse(row.content_package_json):row.content_package_json||{}}catch{}
  // Missing publication metadata stays undated; ingestion/review is not release.
  const value=String(content.seo?.datePublished||'');
  const day=value.slice(0,10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day)return '';
  // Legacy SQLite timestamps are UTC, as are publication dates without a time.
  const iso=value.length===10?value+'T00:00:00Z':value.replace(' ','T').replace(/^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?)$/,'$1Z');
  return Number.isFinite(Date.parse(iso))?new Date(iso).toISOString():'';
}
export function compareNews(a,b,order='newest') {
  const title=String(a.title).localeCompare(String(b.title),'en-GB',{sensitivity:'base',numeric:true});
  const tie=title||String(a.id).localeCompare(String(b.id),'en-GB',{numeric:true});
  if(order==='az'||order==='za')return (order==='za'?-1:1)*title||String(a.id).localeCompare(String(b.id),'en-GB',{numeric:true});
  if(!a.date||!b.date)return (a.date?0:1)-(b.date?0:1)||tie;
  return (order==='oldest'?1:-1)*(Date.parse(a.date)-Date.parse(b.date))||tie;
}
export function newsSortKey(row) {
  let content={};try{content=typeof row.content_package_json==='string'?JSON.parse(row.content_package_json):row.content_package_json||{}}catch{}
  return {date:newsPublicationDate(row),title:content.headline||row.headline||'',id:content.seo?.slug||String(row.id)};
}
