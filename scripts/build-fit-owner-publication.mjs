// Deterministic offline export. Does not contact or write production.
import fs from 'node:fs';
import {gzipSync} from 'node:zlib';
import {buildFitOwnerRelease,fitDigest,prepareFitOwnerCandidate} from '../fit-expansion-publication-v1.mjs';
import {catalogueRowsSha256} from '../catalogue-publication-shared.mjs';
const read=p=>JSON.parse(fs.readFileSync(p));
const root='evidence/fit-publication-2026-09-16';
const candidate=prepareFitOwnerCandidate(read('evidence/fit-v3-closeout-2026-09-16/candidate-review.json'));
fs.writeFileSync(`${root}/resolved-candidate.json`,JSON.stringify(candidate,null,2)+'\n');
const owner=read('evidence/owner-publication-instruction-2026-09-16.json');
const release=buildFitOwnerRelease({candidate,ownerInstruction:{kind:'owner_publication_instruction',quote:owner.instruction,candidate_hash:fitDigest(candidate),trainer_attestation:false,clinical_attestation:false,source:owner.proof,actor:owner.actor,recorded_at:owner.recorded_at},nineReview:read(`${root}/independent-nine-dose-review.json`),preparedAt:owner.recorded_at});
const {items,rows,...wire}=release;
wire.rows_sha256=await catalogueRowsSha256(wire.additions);
wire.manifest.rows_sha256=wire.rows_sha256;
fs.writeFileSync(`${root}/owner-release.json.gz`,gzipSync(JSON.stringify(wire)));
console.log(JSON.stringify({path:`${root}/owner-release.json.gz`,additions:wire.additions.length,protected_originals:wire.protected_originals.length,rows_sha256:wire.rows_sha256}));
