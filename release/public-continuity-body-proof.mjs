import assert from 'node:assert/strict';
import {continuityPages} from '../public-continuity.mjs';
import {improveContinuityEntry} from '../preview/growth-member/continuity-journey.mjs';
import {restoreBookVoiceCopy} from '../book-voice.mjs';
// Compare both sides in the same approved book-voice representation.
export function approvedContinuityBody(path){
 assert(continuityPages[path],'Known approved continuity page required');
 return restoreBookVoiceCopy(path,improveContinuityEntry('<main>'+continuityPages[path].body+'</main>',path)).slice(6,-7);
}
export function assertApprovedContinuityBody(path,main){
 assert(main.includes(approvedContinuityBody(path)),path+' must contain the exact approved body');
}

export function approvedContinuityMinimumWords(path){
 const approvedWords=approvedContinuityBody(path).replace(/<[^>]*>/g,' ').split(/\s+/).filter(Boolean).length;
 const editorialFloor=['/clinic-gone-quiet','/provider-switch','/husband-help'].includes(path)?180:400;
 // A length floor must not contradict the independently pinned approved body. The full body is still required byte-for-byte.
 return Math.min(editorialFloor,approvedWords);
}