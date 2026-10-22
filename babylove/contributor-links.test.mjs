import test from 'node:test';
import assert from 'node:assert/strict';
import {addInternalLinks,prepareLinkPatch,internalLinkURL} from './contributor-links.mjs';
const source='https://shiftsometimber.co.uk/articles/first-health-check';
test('automatic links wrap exact existing words without replacing copy',()=>{
 const before='A health check can be a practical first step.\n\nKeep the rest unchanged.';
 const p=addInternalLinks(before,[{text:'health check',url:'/articles/health-check-guide'}],source);
 assert.equal(p.body,'A [health check](https://shiftsometimber.co.uk/articles/health-check-guide) can be a practical first step.\n\nKeep the rest unchanged.');
 for(const body of ['A health check and another health check.','A [health check](/old-link).','# A health check','`health check`','![health check](/image.png)','- A health check','A healthcare check.'])assert.throws(()=>addInternalLinks(body,[{text:'health check',url:'/articles/health-check-guide'}],source));
});
test('related additions use a fixed short line and cannot carry arbitrary new paragraphs',()=>{
 const p=prepareLinkPatch('Original wording.',{related:[{text:'A health check guide',url:'/articles/health-check-guide'}]},source);
 assert.equal(p.body,'Original wording.\n\nRelated: [A health check guide](https://shiftsometimber.co.uk/articles/health-check-guide)');
 for(const related of [[{text:'New claim\nBuy now',url:'/articles/health-check-guide'}],[{text:'A health check guide',url:'/articles/health-check-guide',body:'A rewrite'}],[{text:'One link',url:'/articles/one'},{text:'Two links',url:'/articles/two'}]])assert.throws(()=>prepareLinkPatch('Original wording.',{related},source));
});
test('link additions reject external, private, redirected-looking and encoded destinations',()=>{
 for(const u of ['https://example.com/articles/x','//example.com/x','/v1/me','/my-timber','/member/profile','/articles/../start-here','/articles/%78','/articles/x?next=y','/articles/x#fragment','/uploads/blog/x.mp4'])assert.throws(()=>internalLinkURL(u));
 assert.equal(internalLinkURL('/male-obesity'),'https://shiftsometimber.co.uk/male-obesity');
});
