#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

function usage() {
  console.log(`Usage:
  node stitch_full_page_capture.mjs --manifest <manifest.json> [options]

Options:
  --item <n>              Repair one 1-based item index instead of all items.
  --viewport <WxH>        Viewport size. Default: 1440x1100.
  --step <px>             Scroll/crop step. Default: min(height - 150, height).
  --wait <ms>             Wait after each scroll before screenshot. Default: 2000.
  --quality <n>           ffmpeg JPEG quality. Default: 3.
`);
}

function parseArgs(argv) {
  const args = {
    manifest: '',
    item: 0,
    viewport: '1440x1100',
    step: 0,
    wait: 2000,
    quality: 3
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg === '--manifest') args.manifest = argv[++i] || '';
    else if (arg === '--item') args.item = Number(argv[++i] || 0);
    else if (arg === '--viewport') args.viewport = argv[++i] || args.viewport;
    else if (arg === '--step') args.step = Number(argv[++i] || 0);
    else if (arg === '--wait') args.wait = Number(argv[++i] || args.wait);
    else if (arg === '--quality') args.quality = Number(argv[++i] || args.quality);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  const match = args.viewport.match(/^(\d+)x(\d+)$/);
  if (!match) throw new Error(`Invalid --viewport: ${args.viewport}`);
  args.width = Number(match[1]);
  args.height = Number(match[2]);
  if (!args.step) args.step = Math.max(1, args.height - 150);
  return args;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', d => stderr += d);
    child.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')}\n${stderr}`));
    });
  });
}

function rel(fromDir, file) {
  return path.relative(fromDir, file).replaceAll(path.sep, '/');
}

async function imageHeight(file) {
  const { execFile } = await import('node:child_process');
  return new Promise((resolve, reject) => {
    execFile('sips', ['-g', 'pixelHeight', file], (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(Number(stdout.match(/pixelHeight:\s*(\d+)/)?.[1] || 0));
    });
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.manifest) {
    usage();
    process.exit(args.help ? 0 : 1);
  }

  const manifestPath = path.resolve(args.manifest);
  const articleDir = path.dirname(manifestPath);
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const tempRoot = path.join(articleDir, '.stitched-full-page-temp');
  await fs.rm(tempRoot, { recursive: true, force: true });
  await fs.mkdir(tempRoot, { recursive: true });

  const requireFromWorkspace = createRequire(path.join(process.cwd(), 'package.json'));
  const { chromium } = requireFromWorkspace('playwright');
  const browser = await chromium.launch({ headless: true });
  const targets = manifest.items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => !args.item || index === args.item - 1);

  if (!targets.length) throw new Error(`No manifest items matched --item ${args.item}`);

  try {
    for (const { item, index } of targets) {
      if (!item.pageUrl) throw new Error(`Item ${index + 1} is missing pageUrl`);
      if (!item.fullPageImage) throw new Error(`Item ${index + 1} is missing fullPageImage`);
      if (!Array.isArray(item.sectionImages) || item.sectionImages.length === 0) {
        throw new Error(`Item ${index + 1} is missing sectionImages`);
      }

      const name = `${String(index + 1).padStart(2, '0')}-${(item.title || 'item').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const workDir = path.join(tempRoot, name);
      const rawDir = path.join(workDir, 'raw');
      const segmentDir = path.join(workDir, 'segments');
      await fs.mkdir(rawDir, { recursive: true });
      await fs.mkdir(segmentDir, { recursive: true });

      const page = await browser.newPage({
        viewport: { width: args.width, height: args.height },
        deviceScaleFactor: 1
      });
      await page.goto(item.pageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(5000);

      const warmHeight = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0));
      for (let y = 0; y <= Math.max(0, warmHeight - args.height); y += args.height) {
        await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(350);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(args.wait);

      const scrollHeight = await page.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight || 0));
      const positions = [];
      for (let y = 0; y < scrollHeight; y += args.step) positions.push(y);

      const segmentFiles = [];
      for (let s = 0; s < positions.length; s++) {
        const y = positions[s];
        await page.evaluate(scrollY => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(args.wait);
        const rawFile = path.join(rawDir, `${String(s + 1).padStart(2, '0')}.jpg`);
        await page.screenshot({ path: rawFile, type: 'jpeg', quality: 86, fullPage: false });
        const segmentHeight = Math.min(args.step, scrollHeight - y);
        const segmentFile = path.join(segmentDir, `${String(s + 1).padStart(2, '0')}.jpg`);
        await run('ffmpeg', ['-y', '-i', rawFile, '-vf', `crop=${args.width}:${segmentHeight}:0:0`, '-q:v', String(args.quality), segmentFile]);
        segmentFiles.push(segmentFile);
      }
      await page.close();

      const fullFile = path.join(articleDir, item.fullPageImage);
      const stackInputs = segmentFiles.flatMap(file => ['-i', file]);
      const stackFilter = segmentFiles.map((_, i) => `[${i}:v]`).join('') + `vstack=inputs=${segmentFiles.length}`;
      await run('ffmpeg', ['-y', ...stackInputs, '-filter_complex', stackFilter, '-q:v', String(args.quality), fullFile]);

      const stitchedHeight = await imageHeight(fullFile);
      item.sectionImages = item.sectionImages.map((section, sectionIndex) => {
        const yStart = Math.round((stitchedHeight * sectionIndex) / item.sectionImages.length);
        const yEnd = sectionIndex === item.sectionImages.length - 1
          ? stitchedHeight
          : Math.round((stitchedHeight * (sectionIndex + 1)) / item.sectionImages.length);
        return {
          ...section,
          source: rel(articleDir, fullFile),
          yStart,
          yEnd,
          height: Math.max(1, yEnd - yStart)
        };
      });

      for (const section of item.sectionImages) {
        const cropFile = path.join(articleDir, section.file);
        await run('ffmpeg', ['-y', '-i', fullFile, '-vf', `crop=${args.width}:${section.height}:0:${section.yStart}`, '-q:v', String(args.quality), cropFile]);
      }

      item.sourceInspection = {
        ...(item.sourceInspection || {}),
        scrollHeight: stitchedHeight,
        fullPageCaptureMethod: 'stitchedViewportScreenshots',
        fullPageCaptureStep: args.step,
        fullPageCaptureViewport: { width: args.width, height: args.height },
        fullPageCaptureSegmentCount: segmentFiles.length
      };
    }
  } finally {
    await browser.close();
    await fs.rm(tempRoot, { recursive: true, force: true });
  }

  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

main().catch(error => {
  console.error(error.stack || error.message);
  process.exit(1);
});
