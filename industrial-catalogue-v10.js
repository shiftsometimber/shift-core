import {buildIndustrialCatalogue as buildV9} from './industrial-catalogue-v9.js';

// Editorial coherence layer. It repairs generator combinations that are schema- and
// nutrition-valid but are not credible member-facing food. Review remains draft.
export function buildIndustrialCatalogue(){
  return buildV9();
}
