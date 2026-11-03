import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

export const slug = 'wegovy-injection-sites';
export const changes = Object.freeze([
  ['Most men start here because it is easy to see and reach.', 'The stomach can be easy to see and reach.'],
  ['We hear the same worry from lots of men: am I doing this right?', 'A practical question is: am I doing this right?'],
  ['Clinical assessment, prescribing and dispensing are handled by appropriately regulated partners, and we are here for the everyday side before, during and after treatment, including if you started somewhere else.', 'SHIFT does not currently provide or book prescribing. We offer general information and practical support before, during and after treatment, including if you started somewhere else. Treatment questions go to your own prescriber.']
]);
export const sha256 = value => createHash('sha256').update(value).digest('hex');

// Preparation only. No DB client, credentials, network request or production write.
// The release manager must capture the actual row and review its exact hash first.
export function prepareCorrection(row, expectedBeforeHash, now) {
  assert.equal(row?.slug, slug, 'Wrong canonical owner');
  assert.equal(row.status, 'published', 'Only the existing published article');
  assert.equal(row.author, 'SHIFT Team', 'Authorship changed; reconcile first');
  assert(row.publish_at && Number.isFinite(Date.parse(row.publish_at)));
  assert(Number.isSafeInteger(row.id) && row.id > 0);
  assert.equal(sha256(row.body), expectedBeforeHash, 'Source changed; refuse stale correction');
  assert(Number.isFinite(Date.parse(now)) && Date.parse(now) >= Date.parse(row.publish_at));
  let body = row.body;
  for (const [from, to] of changes) {
    assert.equal(body.split(from).length - 1, 1, 'Expected sentence missing or repeated');
    body = body.replace(from, to);
  }
  // Retain the real organisation byline and remove the unverified personal signature.
  // Accept only a standalone Markdown quote signature, never a mention elsewhere.
  const signature = /^>\s*(?:\*|_){1,2}Matt O[’']Brien(?:\*|_){1,2}\s*$/gm;
  const signatures = [...body.matchAll(signature)];
  assert.equal(signatures.length, 1, 'Signature format or count changed; reconcile first');
  body = body.replace(signature, '');
  assert(!body.includes(changes[2][0]));
  return {
    before: {...row}, after: {...row, body, updated_at: now},
    beforeBodySha256: expectedBeforeHash, afterBodySha256: sha256(body),
    changedFields: ['body', 'updated_at'], deployed: false,
    update: {
      sql: "UPDATE knowledge_articles SET body=?,updated_at=? WHERE id=? AND slug=? AND status='published' AND body=? AND author=? AND publish_at=? AND updated_at IS ?",
      values: [body, now, row.id, slug, row.body, row.author, row.publish_at, row.updated_at ?? null],
      requiredChanges: 1
    }
  };
}
