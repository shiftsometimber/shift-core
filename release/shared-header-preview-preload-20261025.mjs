import assert from 'node:assert/strict';
import {RETA_STYLES} from '../reta-styles-data.mjs';
import {HOME_BLOCKING_STYLES} from '../home-blocking-styles.mjs';
import {originalHeaderPreviewFetch,SHARED_HEADER_PRESENTATION} from './shared-header-preview-20261025.mjs';
// This preload exists only in the one original read-only CSS verification child.
// Its command, manifest, assertions and expected preview bytes stay unchanged.
assert.equal(process.env.SHIFT_SHARED_HEADER_PREVIEW_ONLY,'exact-original-production-step-007','Original owned header preview context required');
const expected={...RETA_STYLES,...HOME_BLOCKING_STYLES}[SHARED_HEADER_PRESENTATION.path];
globalThis.fetch=originalHeaderPreviewFetch(globalThis.fetch.bind(globalThis),expected);
