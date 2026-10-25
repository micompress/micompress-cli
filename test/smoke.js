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

// Local mock server (still no internet): the API key must ride on the compress
// POST as X-API-Key only, and quota errors must point at /plans.
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');

(async () => {
  const seen = [];
  const srv = http.createServer((req, res) => {
    seen.push({ method: req.method, url: req.url, key: req.headers['x-api-key'] });
    req.resume();
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.headers['x-api-key'] === 'mc_quota') {
        res.statusCode = 429;
        return res.end(JSON.stringify({ code: 'API_QUOTA_REACHED', error: 'API quota reached' }));
      }
      if (req.method === 'POST') {
        return res.end(JSON.stringify({ success: true, downloadUrl: '/downloads/x.png',
          inputSize: 3, outputSize: 2, savedBytes: 1, savedPercent: 33 }));
      }
      res.end('ok');
    });
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const baseUrl = `http://127.0.0.1:${srv.address().port}`;
  const tmp = path.join(os.tmpdir(), `mc-smoke-${process.pid}.png`);
  fs.writeFileSync(tmp, 'png');
  try {
    await api.compressFile(tmp, { baseUrl, apiKey: 'mc_test' });
    assert.deepStrictEqual(seen.map((s) => [s.method, s.key]),
      [['POST', 'mc_test'], ['GET', undefined]]);
    await assert.rejects(api.compressFile(tmp, { baseUrl, apiKey: 'mc_quota' }),
      (e) => e.code === 'API_QUOTA_REACHED' && e.message.includes('/plans'));
    console.log('ok — api key test passed');
  } finally {
    fs.unlinkSync(tmp);
    srv.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
