import {NEWS_DISCOVERY_SOURCES as DISCOVERY_SOURCES} from './radar-discovery-sources-v1.js';

// Only the seven existing Google RSS discovery sources can use this transport.
// Snapshots remain unverified leads. They never approve or publish an event.
export const SNAPSHOT_MAX_AGE_MS=45*60*1000;
export const SNAPSHOT_SCHEMA=`CREATE TABLE IF NOT EXISTS radar_source_snapshots(source_id TEXT PRIMARY KEY,source_url TEXT NOT NULL,fetched_at TEXT NOT NULL,items_json TEXT NOT NULL,items_sha256 TEXT NOT NULL,document_sha256 TEXT NOT NULL,workflow_sha TEXT NOT NULL)`;
export const snapshotSource=source=>DISCOVERY_SOURCES.some(s=>s.id===source.id&&s.url===source.url&&s.url.startsWith('https://news.google.com/rss/search?'))&&source.adapter==='feed'&&Number(source.tier)===4&&(source.eventType||source.event_type)==='news_discovery';
export async function snapshotSha(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))].map(n=>n.toString(16).padStart(2,'0')).join('')}
export async function validateSourceSnapshot(source,row,now=Date.now()){
 if(!snapshotSource(source)||!row||row.source_id!==source.id||row.source_url!==source.url)return null;
 const at=Date.parse(row.fetched_at),age=now-at;
 if(!Number.isFinite(at)||age< -60000||age>SNAPSHOT_MAX_AGE_MS||!/^[a-f0-9]{40}$/.test(row.workflow_sha||'')||!/^[a-f0-9]{64}$/.test(row.document_sha256||''))return null;
 if(typeof row.items_json!=='string'||new TextEncoder().encode(row.items_json).length>75000||await snapshotSha(row.items_json)!==row.items_sha256)return null;
 let items;try{items=JSON.parse(row.items_json)}catch{return null}
 if(!Array.isArray(items)||items.length>40||items.some(x=>!x||typeof x.title!=='string'||!x.title.trim()||typeof x.url!=='string'||!/^https?:\/\//.test(x.url)||x.source!==source.id||x.event_type!=='news_discovery'||x.regulator!==source.authority||x.region!==source.region))return null;
 return{items,transport:'scheduled_collector',fetched_at:row.fetched_at,document_sha256:row.document_sha256,workflow_sha:row.workflow_sha};
}
export async function readSourceSnapshot(DB,source,now=Date.now()){
 if(!snapshotSource(source))return null;
 try{return await validateSourceSnapshot(source,await DB.prepare('SELECT * FROM radar_source_snapshots WHERE source_id=?').bind(source.id).first(),now)}catch{return null}
}
