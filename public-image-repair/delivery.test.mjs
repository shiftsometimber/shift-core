import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {withApprovedToolsImage, TOOLS_IMAGE_PATH, TOOLS_IMAGE_SHA256} from './delivery.mjs';
import manifest from './manifest.json' with {type:'json'};

const image = readFileSync(new URL('./assets/ct3-couple-20261031.webp', import.meta.url));
const original = {fetch: async () => {throw Error('Unintended upstream request');}};

test('the recovered approved artwork is served byte-for-byte on both production hosts', async () => {
  assert.equal(image.subarray(0,4).toString(), 'RIFF');
  assert.equal(image.subarray(8,12).toString(), 'WEBP');
  assert.equal(createHash('sha256').update(image).digest('hex'), TOOLS_IMAGE_SHA256);
  for (const host of ['shiftsometimber.co.uk', 'www.shiftsometimber.co.uk']) {
    for (const query of ['', '?utm_source=image-repair']) {
      const response = await withApprovedToolsImage(original).fetch(new Request('https://' + host + TOOLS_IMAGE_PATH + query));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('content-type'), 'image/webp');
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), image);
    }
  }
});

test('HEAD returns image metadata and no body', async () => {
  const response = await withApprovedToolsImage(original).fetch(new Request('https://shiftsometimber.co.uk' + TOOLS_IMAGE_PATH, {method:'HEAD'}));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('etag'), '"' + TOOLS_IMAGE_SHA256 + '"');
  assert.equal((await response.arrayBuffer()).byteLength, 0);
});

test('all documents, unrelated assets, methods, arguments and scheduled handlers pass through unchanged', async () => {
  const response = new Response('unchanged', {headers:{'x-original':'yes'}});
  const scheduled = () => 'existing cron';
  for (const [host, path, method] of [
    ['shiftsometimber.co.uk','/tools','GET'],
    ['shiftsometimber.co.uk','/','GET'],
    ['shiftsometimber.co.uk',TOOLS_IMAGE_PATH + '.unknown','GET'],
    ['example.com',TOOLS_IMAGE_PATH,'GET'],
    ['shiftsometimber.co.uk',TOOLS_IMAGE_PATH,'POST'],
    ...manifest.pages.slice(1).map(p => ['shiftsometimber.co.uk',p.image,'GET'])
  ]) {
    const request = new Request('https://' + host + path, {method});
    const env = {}, ctx = {};
    const worker = withApprovedToolsImage({scheduled, async fetch(...args) {
      assert.deepEqual(args, [request,env,ctx]); return response;
    }});
    assert.equal(await worker.fetch(request,env,ctx),response);
    assert.equal(worker.scheduled,scheduled);
  }
});
