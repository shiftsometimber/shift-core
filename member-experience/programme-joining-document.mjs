import {programmeJoiningHTML} from './programme-joining-page.mjs';
import {withSessionState} from './session-state.mjs';
// Keep the normal account guard below the signed-off header on this new page.
export function programmeJoiningDocument(){
 let html=withSessionState(programmeJoiningHTML);
 const guard=html.match(/<section id="memberSessionStatus"[\s\S]*?<\/section><script src="\/assets\/member-experience\/session.mjs"><\/script>/);
 if(!guard)throw Error('Joining requires the existing member session guard.');
 html=html.replace(guard[0],'').replace('</header>','</header>'+guard[0]);
 return html.replace('</head>','<style>body[data-member-session="signed-out"] .j-account-status{display:none}</style></head>');
}
