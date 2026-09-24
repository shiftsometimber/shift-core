// Integration seam: uses the EXISTING member cookie/session, never a parallel account system.
// Deliberately NOT registered in the production Worker until the release gates pass.
import {authenticateMember} from '../member-state-fast-v1.js';
import {createConnectedHealthRoutes} from './routes.mjs';
export const connectedHealthRoutes=createConnectedHealthRoutes(authenticateMember);
export {eraseAccountData,exportData} from './store.mjs';
