import {programmeHTML} from '../programme/screen.mjs';
import {workClientSource} from './client.mjs';
import {workStyles} from './styles.mjs';
export const workCSS=workStyles;
export const workJS=workClientSource;
export function workHTML(mode){
 const title=mode==='hq'?'SHIFT for Work · HQ':mode==='employer'?'Your employer reports':'Your workplace programme';
 const main=`<main class="work"><h1>${title}</h1><p class="work-subtitle">${mode==='member'?'Your own goals. A shared start. Support that fits around work.':mode==='employer'?'A clear view of the programme, with employee privacy protected.':'Set up programmes, manage access and review reporting.'}</p><nav class="work-header-links" aria-label="Workplace navigation"><a href="/member/dashboard">My Timber</a><a href="/member/work">My workplace programme</a>${mode==='hq'?'<a href="/hq/catalogue-controls">HQ catalogue</a>':''}${mode==='employer'?'<a href="/employer/work">Employer reports</a>':''}</nav><p id="work-status" role="status" aria-live="polite"></p><div id="work-app" data-mode="${mode}"><p>Opening your private workspace…</p></div></main>`;
 return programmeHTML.replace(/<title>.*?<\/title>/,`<title>${title}</title>`).replace('/assets/programme-v1/programme.css','/assets/work/work.css').replace('/assets/programme-v1/programme.mjs','/assets/work/work.mjs').replace(/<main\b.*?<\/main>/s,main);
}
