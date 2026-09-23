import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';
import {photonAddressRuntime} from '../photon-address-client.mjs';import {deliveryRuntime} from '../member-delivery-client.mjs';
// Minimal event harness explicitly models the native select's input THEN change.
// The real Chromium/WebKit matrix remains the end-to-end acceptance, not this model.
function setup(){
 class E{constructor(type,{bubbles=false,detail}={}){this.type=type;this.bubbles=bubbles;this.detail=detail;}}
 const elements=new Map();class Element{constructor(id){this.id=id;this.value='';this.dataset={};this.disabled=false;this.hidden=true;this.listeners={};this.options=[];}addEventListener(t,f){(this.listeners[t]??=[]).push(f);}async dispatchEvent(e){e.target??=this;for(const f of this.listeners[e.type]||[])await f(e);if(e.bubbles&&this.parent)await this.parent.dispatchEvent(e);}replaceChildren(...items){this.options=items;this.value='';}add(v){this.options.push(v);}focus(){this.focused=true;}}
 for(const id of ['memberDetailsForm','memberDetailsFields','memberFindAddress','memberAddressHelp','memberAddressSelect','memberAddressLookup','memberPostcode','memberAddress1','memberAddress2','memberTown','memberCounty','memberAddressQuery','memberAddressManual'])elements.set(id,new Element(id));
 for(const e of elements.values())if(e.id!=='memberDetailsForm')e.parent=elements.get('memberDetailsForm');
 const win=new Element('window');let calls=0;
 const context={document:{getElementById:id=>elements.get(id)},window:win,Option:class{constructor(label,value){this.label=label;this.value=value;}},Event:E,AbortController,setTimeout,clearTimeout,fetch:async()=>{calls++;return {ok:true,json:async()=>({addresses:[{address1:'12 Example Street',address2:'',town:'London',county:'',postcode:'SW1A 1AA',label:'12 Example Street, London, SW1A 1AA'}]})};}};
 vm.runInNewContext(photonAddressRuntime,context);return {get:id=>elements.get(id),win,E,calls:()=>calls};
}
test('native select input event does not clear results before its change event applies them',async()=>{
 const h=setup();await h.win.dispatchEvent(new h.E('memberAddressLoaded',{detail:{enabled:true}}));h.get('memberPostcode').value='SW1A 1AA';h.get('memberAddressQuery').value='12 Example Street';h.get('memberAddress2').value='Flat 9';
 await h.get('memberFindAddress').dispatchEvent(new h.E('click'));assert.equal(h.calls(),1);assert.equal(h.get('memberAddressLookup').hidden,false);
 const select=h.get('memberAddressSelect');select.value='0';await select.dispatchEvent(new h.E('input',{bubbles:true}));assert.equal(select.value,'0');assert.equal(h.get('memberAddressLookup').hidden,false);
 await select.dispatchEvent(new h.E('change',{bubbles:true}));assert.equal(h.get('memberAddress1').value,'12 Example Street');assert.equal(h.get('memberTown').value,'London');assert.equal(h.get('memberAddress2').value,'Flat 9');assert.equal(h.get('memberAddressLookup').hidden,true);
});
test('ordinary manual input still invalidates old suggestions',async()=>{const h=setup();await h.win.dispatchEvent(new h.E('memberAddressLoaded',{detail:{enabled:true}}));h.get('memberPostcode').value='SW1A 1AA';await h.get('memberFindAddress').dispatchEvent(new h.E('click'));await h.get('memberAddress1').dispatchEvent(new h.E('input',{bubbles:true}));assert.equal(h.get('memberAddressLookup').hidden,true);});
test('delivery dirty-state handler also exempts native suggestion-select input',()=>{assert(deliveryRuntime.includes("if(event.target.id!=='memberDeliverySelect')invalidate()"));});
