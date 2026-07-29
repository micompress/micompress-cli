#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { compressFile, CompressError, DEFAULT_BASE, UTM } = require('../src/api');

const pkg = require('../package.json');

const HELP = `
micompress — compress images, PDFs, video, audio, docs & archives via micompress.com

Usage
  micompress <file...> [options]

Options
  -o, --output <dir>     Write compressed files to this directory
                         (default: alongside input, "-min" suffix)
  -p, --preset <name>    lossless | recommended (default) | extreme
      --max-width <px>   Resize images down to this max width
      --token <jwt>      Auth token for higher size limits (login on micompress.com)
      --api <url>        API base URL (default: ${DEFAULT_BASE})
      --suffix <str>     Filename suffix for default output (default: "-min")
      --json             Machine-readable JSON output
  -q, --quiet            Only print errors
  -h, --help             Show this help
  -v, --version          Show version

Examples
  micompress photo.jpg
  micompress *.png --preset extreme
  micompress report.pdf slides.pptx -o out/
  micompress big.jpg --max-width 1920 --json

Powered by micompress.com — need more formats or bigger files? ${DEFAULT_BASE}/?${UTM}
`;

function parseArgs(argv) {
  const o = { files: [], preset: null, maxWidth: null, token: null,
    baseUrl: DEFAULT_BASE, output: null, suffix: '-min', json: false, quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    switch (a) {
      case '-h': case '--help': o.help = true; break;
      case '-v': case '--version': o.version = true; break;
      case '-q': case '--quiet': o.quiet = true; break;
      case '--json': o.json = true; break;
      case '-o': case '--output': o.output = argv[++i]; break;
      case '-p': case '--preset': o.preset = argv[++i]; break;
      case '--max-width': o.maxWidth = parseInt(argv[++i], 10); break;
      case '--token': o.token = argv[++i]; break;
      case '--api': o.baseUrl = argv[++i]; break;
      case '--suffix': o.suffix = argv[++i]; break;
      default:
        if (a.startsWith('-')) { o.badFlag = a; }
        else o.files.push(a);
    }
  }
  return o;
}

function humanSize(n) {
  if (n == null) return '?';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)}${u[i]}`;
}

function outPathFor(inputPath, opts) {
  const base = path.basename(inputPath);
  const ext = path.extname(base);
  if (opts.output) {
    fs.mkdirSync(opts.output, { recursive: true });
    return path.join(opts.output, base);
  }
  const dir = path.dirname(inputPath);
  const stem = base.slice(0, base.length - ext.length);
  return path.join(dir, `${stem}${opts.suffix}${ext}`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.version) { process.stdout.write(pkg.version + '\n'); return 0; }
  if (opts.help || (opts.files.length === 0 && !opts.badFlag)) {
    process.stdout.write(HELP); return opts.help ? 0 : 1;
  }
  if (opts.badFlag) { process.stderr.write(`Unknown option: ${opts.badFlag}\n`); return 1; }
  if (opts.preset && !['lossless', 'recommended', 'extreme'].includes(opts.preset)) {
    process.stderr.write(`Invalid --preset "${opts.preset}" (use lossless|recommended|extreme)\n`);
    return 1;
  }

  const results = [];
  let failed = 0, totalIn = 0, totalOut = 0;

  for (const file of opts.files) {
    try {
      const { buffer, meta } = await compressFile(file, opts);
      const dest = outPathFor(file, opts);
      fs.writeFileSync(dest, buffer);
      totalIn += meta.inputSize || 0;
      totalOut += meta.outputSize || 0;
      results.push({ file, dest, ok: true, ...meta });
      if (!opts.quiet && !opts.json) {
        process.stdout.write(
          `✔ ${file} → ${dest}  ${humanSize(meta.inputSize)} → ${humanSize(meta.outputSize)} ` +
          `(-${meta.savedPercent}%)\n`,
        );
      }
    } catch (err) {
      failed++;
      const msg = err instanceof CompressError ? err.message : (err && err.message) || String(err);
      results.push({ file, ok: false, error: msg, code: err && err.code });
      if (!opts.json) process.stderr.write(`✗ ${file}: ${msg}\n`);
    }
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify({ results, totalIn, totalOut, failed }, null, 2) + '\n');
  } else if (!opts.quiet && opts.files.length > 1) {
    const okCount = opts.files.length - failed;
    const pct = totalIn ? Math.round((1 - totalOut / totalIn) * 100) : 0;
    process.stdout.write(
      `\n${okCount}/${opts.files.length} done — ${humanSize(totalIn)} → ${humanSize(totalOut)} (-${pct}%)  ` +
      `· powered by micompress.com\n`,
    );
  }

  return failed > 0 ? 1 : 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  process.stderr.write(`Fatal: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
