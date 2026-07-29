# micompress

> Compress **images, PDFs, video, audio, documents & archives** from your terminal.
> Powered by [**micompress.com**](https://micompress.com/?utm_source=npm&utm_medium=cli&utm_campaign=extend).

No build tools, no native binaries — a tiny zero-dependency client that sends your file
to the MiCompress engine and writes back the optimized result.

```bash
npm install -g micompress-cli
```

> The package is published as **`micompress-cli`**; the command it installs is **`micompress`**.

## Usage

```bash
micompress photo.jpg                 # → photo-min.jpg
micompress *.png --preset extreme
micompress report.pdf slides.pptx -o out/
micompress big.jpg --max-width 1920 --json
```

### Options

| Option | Description |
|--------|-------------|
| `-o, --output <dir>` | Write results to a directory (default: alongside input, `-min` suffix) |
| `-p, --preset <name>` | `lossless` · `recommended` (default) · `extreme` |
| `--max-width <px>` | Resize images down to a maximum width |
| `--token <jwt>` | Auth token for higher size limits ([log in](https://micompress.com/account)) |
| `--api <url>` | Override API base URL |
| `--json` | Machine-readable output |
| `-q, --quiet` | Only print errors |

## Supported formats

| Category | Formats |
|----------|---------|
| Image | jpg, png, webp, gif, bmp, tiff, avif, svg, heic, psd, dng, raw, cr2, arw, nef |
| PDF / Docs | pdf, docx, xlsx, pptx, doc, ppt, xls, epub, odt, ods, html, csv, txt, rtf |
| Video | mp4, mov, avi, mkv, webm, m4v, wmv, flv |
| Audio | mp3, wav, flac, ogg, m4a, aac, opus |
| Archive | zip, 7z, tar, gz |

Full tool list: **https://micompress.com/all-tools**

## How it works

Your file is uploaded over HTTPS to [micompress.com](https://micompress.com), compressed with
the same engine the website uses (mozjpeg, pngquant, gifski, Ghostscript, ffmpeg, …), and the
optimized file is streamed back. Anonymous use is supported within per-type size limits;
pass `--token` for larger files.

## Requirements

- Node.js **>= 18** (uses the built-in `fetch`/`FormData`)

## License

MIT © [MiCompress](https://micompress.com)

---

<sub>Need to compress files without installing anything, or a bigger batch UI?
Use the web app at **[micompress.com](https://micompress.com/?utm_source=npm&utm_medium=cli&utm_campaign=extend)**.</sub>
