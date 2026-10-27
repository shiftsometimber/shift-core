import {gateV6Owner} from './support-release-gate.mjs';
import {wrapSupportService} from './support-release.mjs';

// The normal Core build retains the same privately qualified support handlers.
// Release flags and the two existing independent owners remain authoritative.
export function composeMyTimberSupport(original){
 return gateV6Owner(original,wrapSupportService(original));
}
