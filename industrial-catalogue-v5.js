import {buildIndustrialCatalogue as buildV4} from './industrial-catalogue-v4.js';
function familyOf(id){const s=String(id);for(const f of ['protein-pot','dessert-pot','work-snack-box','big-feed-dessert'])if(s.includes(`industrial-v4-${f}-`))return f;return null}
const FAMILY={
 'protein-pot':{ingredient:{amount:'20g',item:'toasted oat crunch'},step:'Top with the measured oat crunch so this remains a spoonable protein pot rather than a snack box.'},
 'dessert-pot':{ingredient:{amount:'40g',item:'0% Greek yoghurt'},step:'Swirl the measured yoghurt through at the end for a thicker dessert-style finish.'},
 'work-snack-box':{ingredient:{amount:'2 / 20g',item:'wholegrain crackers'},step:'Pack the crackers separately so they stay crisp; eat them alongside the chilled pot.'},
 'big-feed-dessert':{ingredient:{amount:'15g',item:'dark chocolate, chopped'},step:'Finish with the measured chopped dark chocolate; this is the deliberate treat element, not an accidental free-pour.'}
};
export function buildIndustrialCatalogue(){const c=buildV4();const recipes=c.recipes.map(r=>{const f=familyOf(r.id);if(!f)return r;const d=FAMILY[f];return{...r,ingredients:[...r.ingredients,d.ingredient],method:[...r.method,d.step],family_identity:f};});return{...c,recipes,metrics:{...c.metrics,grubAuthored:recipes.length,totalWithOriginalStructured:{grub:recipes.length+32,fit:c.exercises.length+32}}}}
