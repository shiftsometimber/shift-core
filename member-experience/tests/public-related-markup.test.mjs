import test from 'node:test';
import assert from 'node:assert/strict';
import {reconcilePublicDocument,relatedGuideGroups} from '../../public-shell-contract.mjs';
for(const [path,groups] of Object.entries(relatedGuideGroups))test('Contextual guide markup is present once despite scoped CSS: '+path,()=>{
 const shell='<html><head><title>Existing page</title></head><body><header class="site-header"></header><aside id="site-drawer"></aside><main><h1>Existing heading</h1><p>Existing content.</p></main><footer class="site-footer"></footer></body></html>';
 const first=reconcilePublicDocument(shell,path);
 assert(first.includes('<style data-related-guide-dependency>'));
 assert.equal((first.match(/<section\b[^>]*\bdata-shift-link-repair(?:\s|>|=)/g)||[]).length,1);
 for(const g of groups)for(const link of g.links)assert(first.includes('href="'+link.path+'"'),'Missing contextual destination: '+link.path);
 assert.equal(reconcilePublicDocument(first,path),first);
 assert(first.includes('<p>Existing content.</p>'));
});
