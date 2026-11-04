import assert from 'node:assert/strict';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hash} from './gate-package.mjs';
export const REVIEW_SHA256='ddf6c46932785f1e7887aedd6f09bca37626173d5dd7da57ee80e7baf71597c0';
export const TEST_SHA256='77da677eec376901abebc54e3d3dfb028183c009d62ccfa98205118dd2d5a777';
export function qualifyServingHandler(region,root){
 mkdirSync(root,{recursive:true});
 const helper=readFileSync(new URL('./article-review.mjs',import.meta.url)),tests=readFileSync(new URL('./webhook.test.mjs',import.meta.url));
 assert.equal(hash(helper),REVIEW_SHA256,'Approved review source must remain exact');assert.equal(hash(tests),TEST_SHA256,'Approved handler tests must remain exact');
 const harness='import {articlePublicationReview} from "./article-review.mjs";\nconst __name=(fn,name)=>fn;\n'+region+'\nexport {babyLoveRoutes,PATH4 as PATH};\n';
 writeFileSync(root+'/webhook.mjs',harness);writeFileSync(root+'/article-review.mjs',helper);writeFileSync(root+'/webhook.test.mjs',tests);
 const log=execFileSync(process.execPath,['--test',root+'/webhook.test.mjs'],{encoding:'utf8',timeout:60000});
 writeFileSync(root+'/tests.log',log);assert(/(?:#|ℹ) fail 0/.test(log),'Compiled handler qualification must pass');
 console.log(log);return {compiledHandlerSHA256:hash(region),harnessSHA256:hash(harness),approvedReviewSHA256:REVIEW_SHA256,approvedTestSHA256:TEST_SHA256,liveDeliverySent:false,notificationsSent:false};
}
