import test from 'node:test';
import {runOriginalCiAssertionsOnAdmittedContext} from '../release/ci-original-test-context-20261015.mjs';

test('all unchanged original21 CI assertions execute on their admitted actual historical Git stage after fresh current-source admission',t=>{
 t.diagnostic(JSON.stringify(runOriginalCiAssertionsOnAdmittedContext(t)));
});
