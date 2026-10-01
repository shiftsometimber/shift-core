import {boundary} from './safety.mjs';
export function unsentBrief(state,message){
 const check=boundary(message);
 return{...check,status:'not_sent',recipient:null,deliveryConfirmed:false,summary:message,facts:state.facts.filter(f=>f.confirmed&&!f.inferred).map(f=>({key:f.key,value:f.value})),notice:'Not sent — nobody has received this. Check and edit this summary before sharing it yourself.'};
}
