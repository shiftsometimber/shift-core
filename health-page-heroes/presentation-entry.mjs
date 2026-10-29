import {composeHeroPages} from './health-page-heroes/runtime.mjs';
import {byPath,pages} from './health-page-heroes/heroes.mjs';
import {assets} from './health-page-heroes/media-all.mjs';
const upstream={testosterone:'BLOG',bloods:'PRESENTATION',hair:'PRESENTATION',pressure:'PRESENTATION',mental:'SUPPORT',sleep:'PRESENTATION',supplements:'NUTRITION'};
const retained={fetch(request,env){const path=new URL(request.url).pathname;const page=byPath(path)||pages.find(p=>path.startsWith(p.path));const service=page&&env[upstream[page.id]];return service?service.fetch(request):new Response('Page not found',{status:404});}};
export default composeHeroPages(retained,assets);
