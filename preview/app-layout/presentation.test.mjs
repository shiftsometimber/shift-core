import test from 'node:test';import assert from 'node:assert/strict';
import {appPresentation,appClient} from './presentation.mjs';
const before='<html><body data-member-chrome="v1"><main><form action="/v1/check-ins"><input name="mood"><button>Save</button></form></main></body></html>';
test('public routes and unknown member templates are untouched',()=>{for(const path of ['/','/programme','/help','/member/unknown'])assert.equal(appPresentation(before,path),before);assert.equal(appPresentation('<body>unknown</body>','/member/dashboard'),'<body>unknown</body>')});
test('presentation preserves forms, source and scripts without copied state or write calls',()=>{const after=appPresentation(before,'/member/dashboard');assert(after.includes('<main><form action="/v1/check-ins"><input name="mood"><button>Save</button></form></main>'));assert.equal(appPresentation(after,'/member/dashboard'),after);assert.doesNotMatch(appClient,/localStorage|sessionStorage|innerHTML/);assert.match(after,/Arial,Helvetica,sans-serif/)});

test('Today reads the existing private workspace without writes or persisted browser state',()=>{assert.match(appClient,/fetch\('\/v1\/grub\/workspace',\{credentials:'same-origin',cache:'no-store',signal:controller.signal\}\)/);assert.doesNotMatch(appClient,/method:\s*['"](?:POST|PUT|DELETE|PATCH)['"]/)});
