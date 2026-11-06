export function validCatalogueImage(mime,base64,alt){
 if(!['image/jpeg','image/png','image/webp'].includes(mime)||typeof alt!=='string'||!alt.trim()||alt.length>180||/[<>\u0000-\u001f\u007f]/.test(alt)||typeof base64!=='string'||!base64||base64.length>2097152||base64.length%4!==0||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))return false;
 let bytes;try{bytes=Uint8Array.from(atob(base64),x=>x.charCodeAt(0))}catch{return false}
 if(bytes.length>1572864)return false;
 if(mime==='image/jpeg')return bytes.length>=4&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(mime==='image/png')return bytes.length>=8&&[137,80,78,71,13,10,26,10].every((x,i)=>bytes[i]===x);
 return bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
}
