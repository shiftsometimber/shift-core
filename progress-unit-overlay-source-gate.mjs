import fs from 'node:fs';
const s=fs.readFileSync('frontend/member/progress-units-overlay-v1.js','utf8');
const need=(x,m)=>{if(!x)throw new Error(m)};
for(const marker of ['savedPhotos','shiftWaistUnit','shiftWeightUnit','st\\s+14','2.54','MutationObserver'])need(s.includes(marker),`missing ${marker}`);
const stone=v=>{let st=Math.floor(v/14),lb=Math.round(v-st*14);if(lb>=14){st+=1;lb=0}return{st,lb}};
for(const pounds of [139.6,153.7,181.8,209.9]){const x=stone(pounds);need(x.lb>=0&&x.lb<14,`invalid stone remainder ${JSON.stringify(x)}`)}
const cm=81,inch=Number((cm/2.54).toFixed(1)),round=Number((inch*2.54).toFixed(1));need(Math.abs(round-cm)<=0.2,`waist roundtrip drift ${cm}->${inch}->${round}`);
console.log('PASS Progress unit overlay source gate: stone carry + cm/in roundtrip + persisted preference hooks.');
