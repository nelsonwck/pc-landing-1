---
name: image-compress-skill
description: A production-grade image optimization engine for AI Agents. Smartly routes between PNG quantization and WebP compression. Use this skill when working with images, optimizing assets, compressing photos, or preparing images for web deployment. Triggers on any image-related task including compression, optimization, format conversion, or build asset preparation.
---

# ImageCompressSkill

> The intelligent image optimization engine for AI Agents. Smart routing between PNG quantization and WebP compression.

## 1. Smart Strategy Overview

The optimal compression strategy depends on the input content type and the target use case.

| Content Type | Primary Strategy | Toolchain | Target Format |
| :--- | :--- | :--- | :--- |
| **Photographs** | **Lossy WebP** | `sharp` -> `webp` | `.webp` |
| **Graphics / Logos / UI** | **Optimized PNG** | `sharp` -> `png` (palette) | `.png` |
| **Universal (Web)** | **WebP (High Compat)** | `sharp` -> `webp` | `.webp` |
| **SVG** | **SVGO Optimization** | `svgo` | `.svg` |

**Decision Logic:**
1. **Try WebP First (Default)**: For most web use cases, WebP offers the best size/quality ratio (30-90% reduction).
2. **Fallback to PNG**: If the input is a simple graphic (low color count) OR if WebP results in a larger file (rare, but happens with simple shapes), use the Optimized PNG pipeline.
3. **Strict Quality**: If the user demands "Lossless" or "No visual change", skip quantization and use only lossless WebP or lossless PNG.

## 2. Setup

This skill uses `sharp` (Node.js) for image compression and `svgo` for SVG optimization.

Install dependencies:
```bash
npm install --save-dev sharp svgo
```

The build automation script is located at:
```
scripts/compress-images.mjs
```

It is automatically run during `npm run build` via the Vite plugin configuration.

## 3. Usage

### Quality Settings

**WebP (Photos/JPEG/PNG photos):**
- **Quality 80-85**: Sweet spot for web (visually indistinguishable). **Default: 80**.
- **Quality 75**: Aggressive, might show slight artifacts on sharp edges.
- **Quality 90+**: Archival quality, diminishing returns.
- **Effort 4-6**: Higher = better compression but slower. Default: 4.

**PNG (Graphics/Logos/UI):**
- **Quality 80**: Default. Good balance of size and fidelity.
- **Compression Level 9**: Maximum compression. Use for static assets.
- **Palette mode**: Automatically used for low-color-count images.

**SVG:**
- SVGO with safe preset, preserving viewBox and dimensions.

### Build Integration

The compression runs automatically during `vite build`:
1. Images in `src/assets/images/` are compressed to WebP format
2. SVGs in `src/assets/logo/` are optimized with SVGO
3. Original files are replaced with optimized versions in the build output

## 4. Implementation Rules

1. **Dual Mode Support**: Always implement BOTH pipelines (WebP and PNG).
2. **Smart Defaults**:
   - Default Quality: **80** (for WebP and PNG).
   - Default WebP effort: **4**.
   - Default PNG compression: **9**.
3. **Output Logic**:
   - Photos (JPEG/JPG) -> Output **WebP** (smallest).
   - PNG with many colors -> Output **WebP**.
   - PNG with few colors (graphics) -> Output **Optimized PNG**.
   - SVG -> Output **Optimized SVG**.
4. **Preserve aspect ratio**: Never distort images during resize.
5. **Maximum dimensions**: Cap at 2560px width for web use (configurable).

## 5. Verification

Always verify:
1. **File Size**: Is output < input?
2. **Format**: Is it a valid WebP/PNG/SVG?
3. **Visual**: Open in browser/viewer. No visible artifacts at default quality.
4. **Build Integration**: Run `npm run build` and check `dist/` output.
