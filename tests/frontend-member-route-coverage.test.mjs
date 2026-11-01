import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseRouteConfig,coversCanonicalMemberRoute} from '../frontend-member-route-coverage.mjs';

const hosts=['shiftsometimber.co.uk','www.shiftsometimber.co.uk'];
const config=routes=>({name:'shift-core',routes});
const broad=()=>hosts.map(host=>({pattern:host+'/*',zone_name:'shiftsometimber.co.uk'}));
const path='/member-progress-v1.js';

test('the actual consolidated configuration covers every commissioned member endpoint on both hosts',()=>{
  const current=parseRouteConfig(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
  for(const endpoint of ['/shift-me','/api-adapter-v33d.js','/member-product-v33d.js','/member-shell-v33g.js',path,'/member-progress-picture-premium-v1.js','/member-plans-premium-v1.js','/member-plans-premium-v1.css']){
    assert.equal(coversCanonicalMemberRoute(current,endpoint),true,endpoint);
  }
});
test('JSONC parsing preserves URL/comment punctuation inside strings',()=>{
  const text='{// comment\n"name":"shift-core","vars":{"url":"https://example.com/a,}/*kept*/"},"routes":["shiftsometimber.co.uk/*","www.shiftsometimber.co.uk/*",],/* comment */}';
  const parsed=parseRouteConfig(text);assert.equal(parsed.vars.url,'https://example.com/a,}/*kept*/');
  assert.equal(coversCanonicalMemberRoute(parsed,path),true);
});
test('historical explicit prefix routes remain valid',()=>{
  assert.equal(coversCanonicalMemberRoute(config(hosts.map(host=>host+path+'*')),path),true);
});
test('either missing canonical host remains a failure',()=>{
  for(const route of broad())assert.equal(coversCanonicalMemberRoute(config([route]),path),false);
});
test('comments and variables cannot impersonate declared routes',()=>{
  const parsed=parseRouteConfig('{"name":"shift-core","routes":[],"vars":{"fake":"shiftsometimber.co.uk/* www.shiftsometimber.co.uk/*"}/*shiftsometimber.co.uk/member-progress-v1.js* */}');
  assert.equal(coversCanonicalMemberRoute(parsed,path),false);
});
test('another Worker or hostname cannot satisfy Core ownership',()=>{
  assert.equal(coversCanonicalMemberRoute({...config(broad()),name:'another-worker'},path),false);
  assert.equal(coversCanonicalMemberRoute(config(['not-shiftsometimber.co.uk/*','api.shiftsometimber.co.uk/*']),path),false);
});
test('an unversioned exact path alone cannot cover versioned requests',()=>{
  assert.equal(coversCanonicalMemberRoute(config(hosts.map(host=>host+path)),path),false);
});
test('wrong prefixes and path casing do not match',()=>{
  for(const suffix of ['/member-other*','/Member-progress-v1.js*'])assert.equal(coversCanonicalMemberRoute(config(hosts.map(host=>host+suffix)),path),false);
});
test('HTTPS routes work while HTTP-only routes cannot cover production HTTPS requests',()=>{
  assert.equal(coversCanonicalMemberRoute(config(hosts.map(host=>'https://'+host+'/*')),path),true);
  assert.equal(coversCanonicalMemberRoute(config(hosts.map(host=>'http://'+host+'/*')),path),false);
});
test('custom domains on the API host are not website route evidence',()=>{
  assert.equal(coversCanonicalMemberRoute(config([{pattern:'api.shiftsometimber.co.uk',custom_domain:true}]),path),false);
});
test('a disabled or foreign-owner exception cannot be hidden behind a catch-all',()=>{
  for(const script of [null,'another-worker'])assert.throws(()=>coversCanonicalMemberRoute(config([...broad(),{pattern:hosts[0]+path,script}]),path),/ownership/);
});
test('unsupported patterns, wrong zones and malformed configurations fail closed',()=>{
  for(const route of ['shiftsometimber.co.uk/*.js','*.shiftsometimber.co.uk/*','shiftsometimber.co.uk/?v=*'])assert.throws(()=>coversCanonicalMemberRoute(config([route]),path));
  assert.throws(()=>coversCanonicalMemberRoute(config([{pattern:hosts[0]+'/*',zone_name:'example.com'}]),path),/another zone/);
  assert.throws(()=>coversCanonicalMemberRoute(config({pattern:hosts[0]+'/*'}),path),/array/);
  assert.throws(()=>parseRouteConfig('{bad jsonc}'));
});
