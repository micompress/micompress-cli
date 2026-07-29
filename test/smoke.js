'use strict';
// Offline smoke test — no network. Validates category routing + exports.
const assert = require('assert');
const { categoryFor, endpointPath, extOf } = require('../src/categories');
const api = require('../src/api');

assert.strictEqual(extOf('a/b/Photo.JPG'), 'jpg');
assert.strictEqual(categoryFor('photo.png'), 'image');
assert.strictEqual(categoryFor('doc.pdf'), 'pdf');
assert.strictEqual(categoryFor('slides.pptx'), 'document');
assert.strictEqual(categoryFor('clip.mp4'), 'video');
assert.strictEqual(categoryFor('song.mp3'), 'audio');
assert.strictEqual(categoryFor('bundle.zip'), 'archive');
assert.strictEqual(categoryFor('file.unknownext'), null);

assert.strictEqual(endpointPath('image'), 'image-compressors');
assert.strictEqual(endpointPath('pdf'), 'pdf-compressors');
assert.strictEqual(endpointPath('archive'), 'archive-compressors');

assert.strictEqual(typeof api.compressFile, 'function');
assert.strictEqual(api.DEFAULT_BASE, 'https://micompress.com');

console.log('ok — smoke test passed');
