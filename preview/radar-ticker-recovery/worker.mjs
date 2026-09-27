import navigationPreview from '../public-navigation/worker.mjs';
import {PUBLISHED_TICKER_EDITION} from '../../radar-published-ticker-v1.js';
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname==='/v1/radar/ticker'&&request.method==='GET'){
  // Read-only presentation preview. Production additionally checks the article
  // hash, source-review queue, live status and original release provenance.
  return Response.json({ok:true,current:false,status:'RED',items:[],published_edition:{edition_id:PUBLISHED_TICKER_EDITION.edition_id,label:'Published in SHIFT',current_wire:false,items:PUBLISHED_TICKER_EDITION.items.map(x=>({id:x.event_id,headline:x.headline,url:x.url,published_at:'2026-09-16'}))}},{headers:{'X-Robots-Tag':'noindex, nofollow','Cache-Control':'no-store'}});
 }
 return navigationPreview.fetch(request);
}};
