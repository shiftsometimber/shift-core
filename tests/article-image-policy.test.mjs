import test from 'node:test';
import assert from 'node:assert/strict';
import {assertArticleImagePolicy} from '../scripts/article-image-policy.mjs';

const production='https://shiftsometimber.co.uk';
const policy=({main='',schema={},sharingImage=production+'/assets/og-default.jpg'}={})=>assertArticleImagePolicy({html:'<main>'+main+'</main>',path:'/articles/example',schema,sharingImage,production});

test('accepts a visible article image only when structured data exposes an image',()=>{
 assert.equal(policy({main:'<img src="/articles/example/image">',schema:{image:production+'/articles/example/image'}}),'article');
 assert.throws(()=>policy({main:'<img src="/articles/example/image">'}),/structured image required/);
});

test('accepts the conservative publisher fallback when the reviewed article has no image',()=>{
 assert.equal(policy(),'publisher-fallback');
 assert.throws(()=>policy({sharingImage:production+'/assets/shift-wordmark.png'}),/conservative sharing fallback/);
 assert.throws(()=>policy({sharingImage:'https://example.com/assets/og-default.jpg'}),/sharing image origin/);
});

test('allows only the conservative publisher fallback in schema when the article has no visible image',()=>{
 assert.equal(policy({schema:{image:[production+'/assets/og-default.jpg']}}),'publisher-fallback-schema');
 assert.throws(()=>policy({schema:{image:production+'/assets/article-looking-image.jpg'},sharingImage:production+'/assets/article-looking-image.jpg'}),/conservative structured fallback/);
});
