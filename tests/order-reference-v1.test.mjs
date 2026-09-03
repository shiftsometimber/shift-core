import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {reserveOrderReference,attachOrderReference,updateOrderReferenceStatus} from '../order-reference-v1.js';

class FakeDB{
  constructor(){this.refs=new Map()}
  async exec(){return{}}
  prepare(sql){return{bind:(...values)=>({run:async()=>{
    if(sql.startsWith('INSERT INTO order_reference_registry')){
      const [number,channel,userId,created,updated]=values;
      if(this.refs.has(number))throw new Error('UNIQUE constraint failed');
      this.refs.set(number,{order_number:number,channel,user_id:userId,status:'reserved',created_at:created,updated_at:updated});
    }else if(sql.includes('SET source_table=')){
      const [sourceTable,sourceId,status,updated,number]=values;Object.assign(this.refs.get(number),{source_table:sourceTable,source_id:sourceId,status,updated_at:updated});
    }else if(sql.includes('SET status=')){
      const [status,updated,number]=values;Object.assign(this.refs.get(number),{status,updated_at:updated});
    }
    return{meta:{changes:1}};
  }})}}
}

test('all rails reserve globally unique opaque SST references',async()=>{
  const db=new FakeDB(),seen=new Set();
  for(const channel of ['apparel','medicine','pharmacy','membership'])for(let i=0;i<20;i++){
    const ref=await reserveOrderReference(db,{channel,userId:i+1});
    assert.match(ref,/^SST-\d{8}-[A-F0-9]{8}$/);
    assert.doesNotMatch(ref,/MED|JAB|TEE/);
    assert.equal(seen.has(ref),false);seen.add(ref);
  }
  assert.equal(seen.size,80);
});

test('one reference follows source record and lifecycle',async()=>{
  const db=new FakeDB(),ref=await reserveOrderReference(db,{channel:'medicine',userId:7});
  await attachOrderReference(db,ref,{sourceTable:'medicine_orders',sourceId:42,status:'pending'});
  await updateOrderReferenceStatus(db,ref,'paid');
  const row=db.refs.get(ref);
  assert.equal(row.order_number,ref);assert.equal(row.channel,'medicine');assert.equal(row.source_table,'medicine_orders');assert.equal(row.source_id,42);assert.equal(row.status,'paid');
});

test('apparel and medicine checkout both use the shared registry',()=>{
  for(const file of ['commerce-stripe-v1.js','medicine-commerce-v1.js']){
    const source=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.match(source,/reserveOrderReference/);
    assert.match(source,/attachOrderReference/);
  }
});
