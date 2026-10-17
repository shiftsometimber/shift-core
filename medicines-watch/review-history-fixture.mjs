// Historical receipt tests retain their original assertions against the catalogue
// as it stood before the explicit 12 October successor summary reviews.
import renewal from './reviews/2026-10-12-authorised-te8105-asc36-renewal.json' with {type:'json'};
import {programmeSummaryQueue} from './evidence-desk.mjs';
export function catalogueBeforeSuccessor(entries,time){
 return entries.map(entry=>{
  const review=renewal.programmeSummaryReviews.find(item=>item.id===entry.id);
  return review&&time<Date.parse(review.reviewedAt)?{...entry,reviewedAt:review.previousReviewedAt}:entry;
 });
}
export function programmeSummaryQueueAtReceipt(entries,time){return programmeSummaryQueue(catalogueBeforeSuccessor(entries,time),time);}
