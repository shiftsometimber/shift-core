// Three bounded accuracy repairs against the pinned Pages source. No amounts,
// purchase gates, intended services or navigation are changed.
export function repairTreatmentCentre(html){
 return html.replace('Retatrutide, CagriSema, Orforglipron, Amycretin, MariTide and the next generation of weight-management treatments.','Retatrutide, CagriSema, Amycretin, MariTide and the next generation of weight-management treatments.')
 .replace('Use the free Health MOT to organise your current picture and identify sensible priorities.','Explore the SHIFT Health MOT home blood test and what it covers.')
 .replace('>Take the Health MOT</a>','>Explore the Health MOT</a>');
}
export function repairTreatmentOrderController(source){
 const anchor='    const {label,price}=selection();';
 const marker='    // Selected pack and receipt share the current selection (WR07).';
 if(source.includes(marker))return source;
 const repair=`${marker}
    const priceHeading=$('.op-price small');if(priceHeading)priceHeading.textContent=item.fixedDose?'PACK PRICE':'MONTHLY PRICE';
    const receipt=$('[data-receipt-list]');
    if(item.fixedDose&&receipt){
      receipt.replaceChildren();
      for(const text of [item.form+' matches the format selected for comparison.',label+' is your selected pack size.','The inclusive pack price is visible before clinical assessment.']){const li=document.createElement('li');li.textContent=text;receipt.appendChild(li)}
    }`;
 return source.replace(anchor,anchor+'\n'+repair).replace('<dt>Live monthly price</dt>',"<dt>${other.fixedDose?'Live pack price':'Live monthly price'}</dt>");
}
export async function repairPromiseResponse(response,request){
 const path=new URL(request.url).pathname;
 if(request.method!=='GET'||!response.ok)return response;
 const html=['/treatment-centre','/treatment-centre.html'].includes(path);
 const script=path==='/treatment-order-prototype-v1.js';
 if(!html&&!script)return response;
 const source=await response.text(),body=html?repairTreatmentCentre(source):repairTreatmentOrderController(source);
 const headers=new Headers(response.headers);for(const name of ['Content-Length','ETag','Last-Modified'])headers.delete(name);
 headers.set('Cache-Control','no-store');headers.set('X-Shift-Accuracy-Repair','v1');
 return new Response(body,{status:response.status,headers});
}
