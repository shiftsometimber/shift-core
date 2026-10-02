import {MEMBER_DESIGN_PATHS,validateMemberDesignSource} from './member-design-scope.mjs';
import {FOOTER_PATHS,FOOTER_RUNTIME_PATHS,historicalFooterRef,validateFooterSource} from './footer-scope.mjs';
import {validateHomeBanner} from './home-banner-scope.mjs';
import {MEMBER_FOCUS_APPROVED,MEMBER_FOCUS_PATHS,validateMemberFocus} from './member-focus-scope.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
export const PWA_DISMISS_APPROVED='fbbc8e592549f48280e32009edcbb73d1dd42669';
export const PWA_DISMISS_PATHS=['my-timber-pwa/ui.mjs','my-timber-pwa/presentation.mjs','my-timber-pwa/pwa.test.mjs','my-timber-pwa/preservation.mjs','my-timber-pwa/preservation.test.mjs','preview/pwa-dismiss/verify.cjs','.github/workflows/pwa-dismiss-preview.yml'];
export const APP_BASE='8c6902c8e0c6a53863282c6c4378f82ec1a70f6f';
export const APP_APPROVED=MEMBER_FOCUS_APPROVED;
export const APP_HASHES=JSON.parse(readFileSync(new URL('./app-manifest.json',import.meta.url))).sha256;
export const APP_PATHS=new Set([...Object.keys(APP_HASHES),'release/app-manifest.json','release/app-scope.mjs','release/growth-scope.mjs','medicines-watch/reviews/2026-10-01-authorised-broader-discovery.json','medicines-watch/reviews/2026-10-01-synt101-mad-correction.json','medicines-watch/reviews/2026-10-02-authorised-international-omissions.json','medicines-watch/reviews/2026-10-02-authorised-expanded-discovery.json','medicines-watch/reviews/2026-10-02-authorised-ubt251.json',...FOOTER_PATHS,...MEMBER_DESIGN_PATHS,'release/member-design-scope.mjs','tests/member-design-release.test.mjs','.github/workflows/member-design-release-proof.yml']);
export function validateAppSource(){
 const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
 git('merge-base','--is-ancestor',APP_BASE,'HEAD');
 validateFooterSource();
 validateMemberDesignSource();
 validateHomeBanner();
 for(const p of PWA_DISMISS_PATHS)assert.equal(git('rev-parse','HEAD:'+p),git('rev-parse',PWA_DISMISS_APPROVED+':'+p),'Reviewed PWA install dismissal drift: '+p);
 validateMemberFocus((ref,path)=>git('rev-parse',ref+':'+path));
 const changed=git('diff','--name-only',APP_BASE,'HEAD').split('\n').filter(Boolean);
 assert(changed.every(p=>APP_PATHS.has(p)),'Unapproved files in app release: '+changed.filter(p=>!APP_PATHS.has(p)).join(','));
 for(const [p,sha]of Object.entries(APP_HASHES))assert.equal(createHash('sha256').update(execFileSync('git',['show',historicalFooterRef('HEAD',p)+':'+p])).digest('hex'),sha,'App release drift: '+p);
 for(const p of ['presentation.mjs','screens.mjs','tabs.mjs','refinement.mjs','verify.cjs'])assert.equal(git('rev-parse',historicalFooterRef('HEAD','preview/app-layout/'+p)+':preview/app-layout/'+p),git('rev-parse',APP_APPROVED+':preview/app-layout/'+p),'Approved app design changed: '+p);
 assert.equal(git('diff',APP_BASE,'HEAD','--','wrangler.jsonc','worker-entry-v6.js','member-experience','my-timber-pwa','migrations',':(exclude)member-experience/public-preservation.mjs',':(exclude)member-experience/verify-production-member.mjs',...[...FOOTER_RUNTIME_PATHS].map(p=>':(exclude)'+p),...PWA_DISMISS_PATHS.map(p=>':(exclude)'+p),...MEMBER_FOCUS_PATHS.map(p=>':(exclude)'+p)),'','Protected runtime, data and PWA source changed');
}


