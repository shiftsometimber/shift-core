// Preview-only entry. Production wrangler configuration is deliberately unchanged.
import core from '../worker-entry-v6.js';
import {authenticateMember} from '../member-state-fast-v1.js';
import {wrapConnectedHealth} from './adapter.mjs';
export * from '../worker-entry-v6.js';
export default wrapConnectedHealth(core,authenticateMember);
