import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import sharp from 'sharp';
import { optimize } from 'svgo';

const MAX_WIDTH = 2560;
const JPEG_QUALITY = 80;
const PNG_QUALITY = 80;
const WEBP_QUALITY = 80;

const JPEG_EXTENSIONS = new Set(['.jpg', '.jpeg']);
const PNG_EXTENSIONS = new Set(['.png']);
const SVG_EXTENSIONS = new Set(['.svg']);

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function compressImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  const originalBuffer = await readFile(filePath);
  const originalSize = originalBuffer.length;
  let outputBuffer;

  if (JPEG_EXTENSIONS.has(ext)) {
    let pipeline = sharp(originalBuffer);
    const metadata = await pipeline.metadata();

    if (metadata.width && metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    outputBuffer = await pipeline
      .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
      .toBuffer();
  } else if (PNG_EXTENSIONS.has(ext)) {
    let pipeline = sharp(originalBuffer);
    const metadata = await pipeline.metadata();

    if (metadata.width && metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }

    outputBuffer = await pipeline
      .png({ quality: PNG_QUALITY, compressionLevel: 9, palette: true })
      .toBuffer();
  } else if (SVG_EXTENSIONS.has(ext)) {
    const svgString = originalBuffer.toString('utf-8');
    const result = optimize(svgString, {
      multipass: true,
      plugins: [
        'preset-default',
        {
          name: 'removeViewBox',
          active: false,
        },
      ],
    });
    outputBuffer = Buffer.from(result.data);
  } else {
    return null;
  }

  // Only write if compressed version is smaller
  if (outputBuffer.length < originalSize) {
    await writeFile(filePath, outputBuffer);
    return { filePath, originalSize, compressedSize: outputBuffer.length };
  }

  return { filePath, originalSize, compressedSize: originalSize, skipped: true };
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function imageCompressPlugin(options = {}) {
  const {
    maxWidth = MAX_WIDTH,
    jpegQuality = JPEG_QUALITY,
    pngQuality = PNG_QUALITY,
    webpQuality = WEBP_QUALITY,
    verbose = true,
  } = options;

  return {
    name: 'vite-plugin-image-compress',
    apply: 'build',
    enforce: 'post',

    async closeBundle() {
      const outDir = this?.environment?.config?.build?.outDir
        || join(process.cwd(), 'dist');

      const resolvedOutDir = outDir.startsWith('/')
        ? outDir
        : join(process.cwd(), outDir);

      let files;
      try {
        files = await getFiles(resolvedOutDir);
      } catch {
        console.warn('\n[image-compress] Output directory not found, skipping compression.');
        return;
      }

      const imageFiles = files.filter(f => {
        const ext = extname(f).toLowerCase();
        return JPEG_EXTENSIONS.has(ext) || PNG_EXTENSIONS.has(ext) || SVG_EXTENSIONS.has(ext);
      });

      if (imageFiles.length === 0) {
        if (verbose) console.log('\n[image-compress] No images found in build output.');
        return;
      }

      if (verbose) {
        console.log(`\n[image-compress] Compressing ${imageFiles.length} image(s)...`);
      }

      let totalOriginal = 0;
      let totalCompressed = 0;
      const results = [];

      for (const file of imageFiles) {
        const result = await compressImage(file);
        if (result) {
          results.push(result);
          totalOriginal += result.originalSize;
          totalCompressed += result.compressedSize;
        }
      }

      if (verbose && results.length > 0) {
        console.log('[image-compress] Results:');
        for (const r of results) {
          const filename = r.filePath.split('/').pop();
          const savings = ((1 - r.compressedSize / r.originalSize) * 100).toFixed(1);
          if (r.skipped) {
            console.log(`  ${filename}: ${formatSize(r.originalSize)} (already optimal)`);
          } else {
            console.log(`  ${filename}: ${formatSize(r.originalSize)} → ${formatSize(r.compressedSize)} (-${savings}%)`);
          }
        }
        const totalSavings = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
        console.log(`\n[image-compress] Total: ${formatSize(totalOriginal)} → ${formatSize(totalCompressed)} (-${totalSavings}%)`);
      }
    },
  };
}
