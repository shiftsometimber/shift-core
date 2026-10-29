import retained from "./testing-production-entry.mjs";
import {composeHeroPages} from "./health-page-heroes/runtime.mjs";
import {assets} from "./health-page-heroes/media-worker-2.mjs";
export default composeHeroPages(retained,assets);
