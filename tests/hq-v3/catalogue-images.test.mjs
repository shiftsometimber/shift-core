import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validCatalogueImage} from '../../catalogue-image-validation.mjs';
test('Catalogue image validation rejects disguised markup, wrong MIME, missing alt and files above 1.5 MB',()=>{
 const png=Buffer.from([137,80,78,71,13,10,26,10]).toString('base64');assert.equal(validCatalogueImage('image/png',png,'TEST catalogue image'),true);
 for(const [mime,bytes,alt] of [['image/png',Buffer.from('<script>send()</script>').toString('base64'),'Product'],['text/html',png,'Product'],['image/jpeg',png,'Product'],['image/png',png,''],['image/png',png,'<img onerror=send()>'],['image/png',png,'bad\u0000alt'],['image/png','!notbase64','Product']])assert.equal(validCatalogueImage(mime,bytes,alt),false);
 const large=Buffer.alloc(1572865);Buffer.from([137,80,78,71,13,10,26,10]).copy(large);assert.equal(validCatalogueImage('image/png',large.toString('base64'),'Product'),false);
});
