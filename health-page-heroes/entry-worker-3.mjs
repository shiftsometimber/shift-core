import retained from "./worker.js";
import {composeHeroPages} from "./health-page-heroes/runtime.mjs";
import {assets} from "./health-page-heroes/media-worker-3.mjs";
export default composeHeroPages(retained,assets);
