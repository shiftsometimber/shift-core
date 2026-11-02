// Only fixed data resources extracted at build time enter this module.
// Strings are immutable; parsed objects remain separate and mutable.
const primitiveStrings=new Map();
function retainedString(value){
 const retained=primitiveStrings.get(value);
 if(retained!==undefined)return retained;
 primitiveStrings.set(value,value);return value;
}
export function parseStaticData(text){
 const root=JSON.parse(text);
 if(typeof root==='string')return retainedString(root);
 if(root===null||typeof root!=='object')return root;
 const pending=[root];
 while(pending.length){
  const object=pending.pop();
  for(const key in object){
   if(!Object.hasOwn(object,key))continue;
   const value=object[key];
   if(typeof value==='string')object[key]=retainedString(value);
   else if(value!==null&&typeof value==='object')pending.push(value);
  }
 }
 return root;
}
