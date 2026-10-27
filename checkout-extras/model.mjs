// All amounts are integer GBP pence. Draft HQ prices are never sale prices.
export class BasketError extends Error { constructor(code,message,status=409){super(message);this.code=code;this.status=status;} }
export function selection(value=[]){
 if(!Array.isArray(value)||value.length>20)throw new BasketError('invalid_basket','Choose up to 20 different extras.',400);
 const seen=new Set();
 return value.map(line=>{
  if(!line||typeof line!=='object'||!/^[-a-z0-9]{1,80}$/.test(line.id)||seen.has(line.id)||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>10||!Number.isSafeInteger(line.revision)||line.revision<1)throw new BasketError('invalid_basket','Check the selected packs and quantities.',400);
  seen.add(line.id);return {id:line.id,quantity:line.quantity,revision:line.revision};
 }).sort((a,b)=>a.id.localeCompare(b.id));
}
const pence=n=>Number.isSafeInteger(n)&&n>=0&&n<=10000000;
export function sellable(offer,enabled,at=Date.now()){
 return enabled&&offer?.active===1&&offer.labels_verified===1&&offer.fulfilment_verified===1&&offer.delivery_scope==='GB_ALL'&&!!offer.supplier_sku&&!!offer.pack_label&&pence(offer.price_pence)&&offer.price_pence>0&&pence(offer.delivery_pence)&&!!offer.delivery_group&&Number.isSafeInteger(offer.stock_quantity)&&Number.isSafeInteger(offer.reserved)&&offer.stock_quantity>offer.reserved&&Date.parse(offer.valid_until)>at;
}
export function quoteBasket(lines,offers,{enabled=false,at=Date.now()}={}){
 const chosen=selection(lines),groups=new Map();let subtotalPence=0;
 const items=chosen.map(line=>{
  const offer=offers.find(p=>p.id===line.id);
  if(!sellable(offer,enabled,at))throw new BasketError('extra_unavailable','An extra is unavailable. Remove it or check the range again.');
  if(offer.revision!==line.revision)throw new BasketError('extra_changed','A pack, price or delivery charge changed. Review the basket before paying.');
  if(offer.stock_quantity-offer.reserved<line.quantity)throw new BasketError('extra_stock_changed','The selected quantity is no longer available.');
  const previous=groups.get(offer.delivery_group);
  if(previous&&previous.pence!==offer.delivery_pence)throw new BasketError('delivery_unconfirmed','Delivery needs checking before this order can be paid.');
  groups.set(offer.delivery_group,{id:offer.delivery_group,label:offer.delivery_label||'Supplements delivery',pence:offer.delivery_pence});
  const totalPence=offer.price_pence*line.quantity;subtotalPence+=totalPence;
  return {id:offer.id,name:offer.name,pack:offer.pack_label,sku:offer.supplier_sku,revision:offer.revision,quantity:line.quantity,unitPence:offer.price_pence,totalPence,deliveryGroup:offer.delivery_group};
 });
 const deliveries=[...groups.values()].sort((a,b)=>a.id.localeCompare(b.id)),deliveryPence=deliveries.reduce((sum,d)=>sum+d.pence,0);
 return {items,deliveries,subtotalPence,deliveryPence,totalPence:subtotalPence+deliveryPence,currency:'GBP',separateParcels:items.length>0};
}
export function appendExtras(form,quote,start=1){
 let index=start;
 for(const item of [...quote.items.map(p=>({name:p.name+' · '+p.pack,price:p.unitPence,quantity:p.quantity})),...quote.deliveries.filter(d=>d.pence>0).map(d=>({name:d.label,price:d.pence,quantity:1}))]){
  const key='line_items['+(index++)+']';form.set(key+'[price_data][currency]','gbp');form.set(key+'[price_data][unit_amount]',String(item.price));form.set(key+'[price_data][product_data][name]',item.name);form.set(key+'[quantity]',String(item.quantity));
 }
 if(quote.items.length){form.set('shipping_address_collection[allowed_countries][0]','GB');form.set('phone_number_collection[enabled]','true');}
 return form;
}
