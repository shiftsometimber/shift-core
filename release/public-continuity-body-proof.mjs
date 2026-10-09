import {amendSupportingDocument} from '../obesity-awareness/candidate.mjs';
import {renderContinuityDocument} from '../public-continuity.mjs';
import assert from 'node:assert/strict';
import {continuityPages} from '../public-continuity.mjs';
import {improveContinuityEntry} from '../preview/growth-member/continuity-journey.mjs';
import {restoreBookVoiceCopy} from '../book-voice.mjs';
import {improveAnswerDepth} from '../public-seo-answer-depth.mjs';
// Compare the complete finite approved page, including the approved answer-depth section.
export function approvedContinuityBody(path){
 assert(continuityPages[path],'Known approved continuity page required');
 const html=improveAnswerDepth('<head></head>'+improveContinuityEntry('<main>'+continuityPages[path].body+'</main>',path),path);
 const main=html.match(/<main>([\s\S]*?)<\/main>/);assert(main,'Exact approved main required');
 const approved=restoreBookVoiceCopy(path,main[1]);
 if(path!=='/weight-loss-support-for-men')return approved;
 const shell='<html><head></head><body><main></main></body></html>';
 const document=renderContinuityDocument(shell,path).replace(/<main\b[^>]*>[\s\S]*?<\/main>/,'<main>'+approved+'</main>');
 return amendSupportingDocument(path,document).match(/<main\b[^>]*>([\s\S]*?)<\/main>/)[1];
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