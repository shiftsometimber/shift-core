export function exportAccount(state,{now=new Date().toISOString()}={}){
 const {operations,serviceEvents,...record}=structuredClone(state);
 return {format:'shift-programme-export',version:1,exportedAt:now,record};
}
