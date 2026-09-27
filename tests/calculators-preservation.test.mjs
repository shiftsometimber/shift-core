import test from 'node:test';
import assert from 'node:assert/strict';
import {publicHeader,publicDrawer,publicFooter} from '../public-shell-contract.mjs';
import {preserveCalculatorsNavigation} from '../public-calculators-preservation.mjs';
const link='<a href="/tools">Calculators &amp; Tools</a>';
const page=(drawer=publicDrawer,footer=publicFooter)=>'<html><head></head><body>'+publicHeader+drawer+'<main><p>Keep this.</p><a href="/tools">Existing homepage card</a></main>'+footer+'</body></html>';
const before=page(publicDrawer.replace(link,''),publicFooter.replace(link,''));
test('only the two exact navigation additions are removed from comparison',()=>{
 assert.equal(preserveCalculatorsNavigation('/',page(),{required:true}).toString(),before);
 assert.equal(preserveCalculatorsNavigation('/',before).toString(),before);
});
test('missing, duplicate and renamed links fail post-release acceptance',()=>{
 assert.throws(()=>preserveCalculatorsNavigation('/',before,{required:true}),/Missing approved/);
 assert.throws(()=>preserveCalculatorsNavigation('/',page(publicDrawer.replace(link,link+link)),{required:true}),/Duplicate/);
 assert.throws(()=>preserveCalculatorsNavigation('/',page().replace('Calculators &amp; Tools','Wrong label'),{required:true}),/label or destination/);
});
test('moving the drawer link or moving the footer link out of Explore fails',()=>{
 assert.throws(()=>preserveCalculatorsNavigation('/',page(publicDrawer.replace(link,'').replace('</nav>',link+'</nav>')),{required:true}),/alphabetical/);
 assert.throws(()=>preserveCalculatorsNavigation('/',page(publicDrawer,publicFooter.replace(link,'').replace('<h2>Trust</h2>','<h2>Trust</h2>'+link)),{required:true}),/under Explore/);
});
test('unrelated body changes remain detectable and ordinary content tools links survive',()=>{
 const changed=preserveCalculatorsNavigation('/',page().replace('Keep this.','Changed content.'),{required:true}).toString();
 assert.notEqual(changed,before);
 assert.match(changed,/<a href="\/tools">Existing homepage card<\/a>/);
});
test('tools current-page attributes are accepted without swallowing other attributes',()=>{
 const current=page().replaceAll(link,link.replace('href="/tools"','href="/tools" aria-current="page"'));
 assert.equal(preserveCalculatorsNavigation('/tools',current,{required:true}).toString(),before);
 assert.throws(()=>preserveCalculatorsNavigation('/tools',page().replace(link,link.replace('href="/tools"','href="/tools" onclick="bad()"')),{required:true}),/label or destination/);
});
test('non-HTML resources and private member content are returned unchanged',()=>{
 const script=Buffer.from('console.log("unchanged")');
 assert.equal(preserveCalculatorsNavigation('/script.js',script,{required:true}),script);
 assert.equal(preserveCalculatorsNavigation('/member/dashboard',page(),{required:true}).toString(),page());
});
