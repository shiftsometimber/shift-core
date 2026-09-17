import {pendingSourceChangeMap} from './radar-source-review-v1.js';
import {snapshotSha} from './radar-source-snapshots-v1.js';
// Navigation edition authorised by the 17 September newsroom-repair instruction.
// These are links to existing owner-published articles, not new clinical approval,
// changes to the original release, or a claim that their source news happened today.
export const PUBLISHED_TICKER_EDITION=Object.freeze({
  "edition_id": "published-newsroom-20260917",
  "release_sha256": "29c996920c301feea97738e2bf5ff9f140278e042b8750b8938475e9266ffd5e",
  "items": [
    {
      "event_id": 276,
      "headline": "Domperidone warning strengthened for rare adrenal tumour",
      "url": "/medicine-news/domperidone-phaeochromocytoma-mhra-warning-2026",
      "article_sha256": "42fd4ed7c79e985e69f04a3c2bc7f52c984c4aeab1927fac8965f5ced2509e90",
      "source_url": "https://www.gov.uk/drug-safety-update/domperidone-new-contraindication-in-patients-with-phaeochromocytoma-due-to-the-risk-of-severe-hypertension"
    },
    {
      "event_id": 284,
      "headline": "Isotretinoin: second-prescriber rule replaced with updated safeguards",
      "url": "/medicine-news/isotretinoin-prescribing-safeguards-january-2026",
      "article_sha256": "83c55f4304afeb08544ac1ada9f2c38807c8aa670e6507bc3c7fcd14911c4398",
      "source_url": "https://www.gov.uk/drug-safety-update/isotretinoin-changes-to-prescribing-guidance-and-additional-risk-minimisation-measures"
    },
    {
      "event_id": 286,
      "headline": "Mesalazine warning follows rare intracranial-pressure reports",
      "url": "/medicine-news/mesalazine-intracranial-hypertension-mhra-warning",
      "article_sha256": "27db4aa2113fd099ae715b2392661cc909878f87014538397b7581a2cb0c8590",
      "source_url": "https://www.gov.uk/drug-safety-update/mesalazine-and-idiopathic-intracranial-hypertension"
    },
    {
      "event_id": 290,
      "headline": "RSV vaccine warning puts rare nerve condition in context",
      "url": "/medicine-news/rsv-vaccines-small-gbs-risk-mhra-context",
      "article_sha256": "bc16b79082cf7aedbb95dc49e4f6e78a59f550f2ff02892424f405e2a3feca93",
      "source_url": "https://www.gov.uk/drug-safety-update/abrysvov-pfizer-rsv-vaccine-and-arexvyv-gsk-rsv-vaccine-be-alert-to-a-small-risk-of-guillain-barre-syndrome-following-vaccination-in-older-adults"
    },
    {
      "event_id": 292,
      "headline": "Asthma alert links reliever overuse with poorer control",
      "url": "/medicine-news/asthma-reliever-overuse-mhra-reminder",
      "article_sha256": "cc1da457de115798f30010fc48e17e38e8c69951df2460e85872ae8eeeac945c",
      "source_url": "https://www.gov.uk/drug-safety-update/short-acting-beta-2-agonists-saba-salbutamol-and-terbutaline-reminder-of-the-risks-from-overuse-in-asthma-and-to-be-aware-of-changes-in-the-saba-prescribing-guidelines"
    }
  ]
});
const parse=(value,fallback)=>{try{return JSON.parse(value)}catch{return fallback}};
export async function publishedEditionItems(rows,pending=new Map()){
 const items=[];
 for(const pin of PUBLISHED_TICKER_EDITION.items){
  const row=rows.find(r=>r.id===pin.event_id);if(!row||row.status!=='published'||pending.has(row.id))continue;
  const pkg=parse(row.content_package_json,{}),evidence=parse(row.source_evidence_json,[]);
  if(pkg.headline!==pin.headline||pkg.seo?.canonical!=='https://shiftsometimber.co.uk'+pin.url||pkg.seo?.source_url!==pin.source_url||!evidence.some(e=>e.url===pin.source_url)||!pkg.destinations?.includes('medicine_news')||pkg.release_provenance?.release_sha256!==PUBLISHED_TICKER_EDITION.release_sha256||await snapshotSha(pkg.article_markdown||'')!==pin.article_sha256)continue;
  const at=pkg.seo.datePublished;if(!Number.isFinite(Date.parse(at)))continue;
  items.push({id:row.id,headline:pin.headline,url:pin.url,published_at:at,source_published_at:evidence.map(e=>e.source_date).filter(Boolean).sort().at(-1)||null});
 }
 return items;
}
export async function readPublishedTickerEdition(DB){
 try{
  const {results=[]}=await DB.prepare('SELECT * FROM radar_events WHERE id IN (276,284,286,290,292)').all();
  const pending=await pendingSourceChangeMap(DB);
  return{edition_id:PUBLISHED_TICKER_EDITION.edition_id,label:'Published in SHIFT',current_wire:false,items:await publishedEditionItems(results,pending)};
 }catch{return{edition_id:PUBLISHED_TICKER_EDITION.edition_id,label:'Published in SHIFT',current_wire:false,items:[]}}
}
