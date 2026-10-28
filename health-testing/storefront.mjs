import {rangeProducts,rangeById,esc,testPath} from './catalogue.mjs';

// SHIFT stock and prices are independent of the partner's product availability.
// No partner retail reference is a SHIFT selling price. Sales remain locked.
export const storefrontInventory=Object.freeze(Object.fromEntries(rangeProducts.map(p=>[p.id,Object.freeze({stockQuantity:0,pricePence:null,currency:'GBP',saleEnabled:false})])));
export function purchaseState(p){
 const row=storefrontInventory[p.id];
 return {...row,priceLabel:'TBC',stockLabel:p.state==='coming_soon'?'Coming soon · Out of stock':'Out of stock',canPurchase:false};
}
export function purchasePanel(p){
 const state=purchaseState(p),noteId='purchase-note-'+p.id;
 return '<form class="nft-purchase" id="purchase" data-testing-purchase method="post" action="'+testPath(p.id)+'/purchase" aria-label="Purchase '+esc(p.name)+'">'+
 '<div class="nft-purchase-heading"><div><span class="nft-purchase-label">Price</span><strong class="nft-price">TBC</strong></div><span class="nft-state">'+state.stockLabel+'</span></div>'+
 '<p class="nft-purchase-note" id="'+noteId+'">'+(p.state==='coming_soon'?'This lab test is coming soon.':'This item is currently out of stock.')+' The price and delivery details will be confirmed before ordering opens.</p>'+
 '<div class="nft-buy-controls"><div><label class="nft-purchase-label" for="quantity-'+p.id+'">Quantity</label><div class="nft-quantity"><button type="button" data-quantity-change="-1" aria-label="Decrease quantity">−</button><input id="quantity-'+p.id+'" name="quantity" type="number" inputmode="numeric" value="1" min="1" max="9" step="1" aria-describedby="'+noteId+'"><button type="button" data-quantity-change="1" aria-label="Increase quantity">+</button></div></div><button class="nft-button nft-add-to-basket" type="submit" disabled aria-describedby="'+noteId+'">Add to basket</button></div>'+
 '<div class="nft-order-meta"><span>0 in stock</span><span>Ordering unavailable</span></div><p class="nft-purchase-message" role="status" aria-live="polite"></p></form>';
}

// This closed endpoint also rejects direct/tampered requests. It creates no
// baskets, orders, reservations, payment sessions or outbound notifications.
export async function testingPurchaseRoute(request,id){
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
 if(request.method!=='POST')return Response.json({ok:false,error:'method_not_allowed'},{status:405,headers:{...headers,Allow:'POST'}});
 const p=rangeById[id];
 if(!p)return Response.json({ok:false,error:'product_not_found'},{status:404,headers});
 return Response.json({ok:false,error:'out_of_stock',productId:p.id,stockQuantity:0,pricePence:null,message:'This item is out of stock. Price is TBC. Ordering is unavailable.'},{status:409,headers});
}

export const storefrontClient=String.raw`(()=>{
 if(window.__shiftTestingStorefront)return;window.__shiftTestingStorefront=true;
 const root=()=>document.querySelector('#shift-health-range');
 function filterRange(){
  const host=root(),form=host?.querySelector('[data-testing-search]');if(!form)return;
  const query=form.elements.q.value.trim().toLocaleLowerCase('en-GB'),category=form.elements.category.value;let count=0;
  host.querySelectorAll('[data-test]').forEach(card=>{const match=(!query||card.dataset.search.includes(query))&&(category==='all'||(category==='soon'?card.dataset.productState==='coming_soon':card.dataset.productType===category));card.hidden=!match;if(match)count++;});
  host.querySelectorAll('[data-product-group]').forEach(group=>group.hidden=!Array.from(group.querySelectorAll('[data-test]')).some(card=>!card.hidden));
  host.querySelector('[data-result-count]').textContent=count+' of 20 products';
  host.querySelector('[data-testing-empty]').hidden=count!==0;
 }
 document.addEventListener('input',e=>{if(e.target.closest('[data-testing-search]'))filterRange();});
 document.addEventListener('change',e=>{if(e.target.closest('[data-testing-search]'))filterRange();});
 document.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button||!root()?.contains(button))return;
  if(button.hasAttribute('data-clear-testing')){const form=root().querySelector('[data-testing-search]');form.elements.q.value='';form.elements.category.value='all';filterRange();form.elements.q.focus();}
  if(button.hasAttribute('data-quantity-change')){const input=button.closest('.nft-quantity').querySelector('input');input.value=Math.max(1,Math.min(9,(Number(input.value)||1)+Number(button.dataset.quantityChange)));}
 });
 document.addEventListener('submit',e=>{
  if(e.target.matches('[data-testing-search]')){e.preventDefault();filterRange();}
  if(e.target.matches('[data-testing-purchase]')){e.preventDefault();e.target.querySelector('[role="status"]').textContent='This item is out of stock. Ordering is unavailable while price is TBC.';}
 });
 document.addEventListener('focusout',e=>{if(e.target.matches('[data-testing-purchase] input[name="quantity"]'))e.target.value=Math.max(1,Math.min(9,Math.round(Number(e.target.value)||1)));});
})();`;
