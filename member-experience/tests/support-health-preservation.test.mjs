import test from'node:test';import assert from'node:assert/strict';import{preserveHealthCardOrder}from'../../testosterone-hub-order.mjs';import{healthVisionMain,healthVisionStyle}from'../../shift-health-vision-content.mjs';
test('native approved Health presentation stays completely byte compared',()=>{
 const html='<style>'+healthVisionStyle+'</style><main data-health-vision="20261021">'+healthVisionMain+'<section>Existing appendix stays protected</section></main>',b=Buffer.from(html);assert.equal(preserveHealthCardOrder('/shift-health',b),b);
 for(const bad of [html.replace(healthVisionMain,healthVisionMain+'X').replace(healthVisionMain.slice(0,35),'changed'),html.replace(healthVisionStyle,'changed'),html+'<main>duplicate</main>'])assert.throws(()=>preserveHealthCardOrder('/shift-health',Buffer.from(bad)),/approved source/);
});
