// Reuse only a current public index; stale published pages are ineligible evidence.
export function reusablePublicIndex(index){
 return Number(index.indexed)>=50&&Number(index.chunks)>=Number(index.indexed)&&Number(index.stale)===0&&Number(index.lifeBackFresh)>=1;
}
