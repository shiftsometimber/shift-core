import {hubMain} from './shift-health-public-content.mjs';
const originalGrid=hubMain.match(/<section class="wrap grid"[\s\S]*?<\/section>/)?.[0];
const card=originalGrid?.match(/<article class="card" id="testosterone">[\s\S]*?<\/article>/)?.[0];
if(!originalGrid||!card)throw Error('Expected existing Health testosterone card');
const featuredGrid=originalGrid.replace('\n'+card,'').replace(/(<section[^>]*>)/,'$1\n'+card);
export function promoteTestosteroneCard(html){
 if(!html.includes(originalGrid))throw Error('Health grid differs from approved source');
 return html.replace(originalGrid,featuredGrid);
}
// Preservation accepts only the exact existing card moved to first position.
// Every card's text, links, and all surrounding page bytes remain protected.
export function preserveHealthCardOrder(path,input){
 if(path!=='/shift-health')return input;
 const html=input.toString('utf8');
 if(html.includes(featuredGrid))return Buffer.from(html.replace(featuredGrid,originalGrid));
 if(html.includes(originalGrid))return input;
 throw Error('Health grid differs from both authorised orders');
}
