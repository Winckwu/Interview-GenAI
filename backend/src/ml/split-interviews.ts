#!/usr/bin/env ts-node
/**
 * Split large interview transcript files into individual files
 * Outputs: I001.txt - I049.txt
 */

import fs from 'fs';
import path from 'path';

interface InterviewSegment {
  id: string;
  content: string;
  startLine: number;
  endLine?: number;
}

function splitInterviews(inputDir: string, outputDir: string): void {
  console.log('📄 Interview File Splitter');
  console.log('='.repeat(70));

  // File mapping
  const files = [
    { path: '受访人录音转文字1-15.txt', range: [1, 15] },
    { path: '受访人录音转文字16-25.txt', range: [16, 25] },
    { path: '受访人语音转文字26-33.txt', range: [26, 33] },
    { path: '受访人录音转文字34-42.txt', range: [34, 42] },
  ];

  // English interview files (individual)
  const englishFiles = [
    { path: '43-GMT20251015-094409_Recording.transcript.vtt', id: 'I043' },
    { path: '44-GMT20251022-085638_Recording.transcript.vtt', id: 'I044' },
    { path: '45-Ganesh M 15 October audio1962495788.txt', id: 'I045' },
    { path: '46-Ng Chen Kian 21 October audio1912572062.txt', id: 'I046' },
    { path: '47-Leticia Ramirez 28 October audio1676479019.txt', id: 'I047' },
    { path: '48-Tze Shuo Koay 27 October audio1968322064.txt', id: 'I048' },
    { path: '49-Wee Chen Xian 24 October audio1098084502.txt', id: 'I049' },
  ];

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let totalExtracted = 0;

  // Process Chinese interview files (multi-interview)
  for (const file of files) {
    const filePath = path.join(inputDir, file.path);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file.path}`);
      continue;
    }

    console.log(`\n📖 Processing: ${file.path}`);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const segments: InterviewSegment[] = [];

    // Find interview markers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match patterns like "受访人1:", "受访人2:", "受访人 26:", "受访人1：" (with/without space, Chinese colon)
      const match = line.match(/^受访人\s*(\d+)[：:]/);
      if (match) {
        const num = parseInt(match[1]);
        const id = `I${String(num).padStart(3, '0')}`;
        segments.push({
          id,
          content: '',
          startLine: i,
        });
      }
    }

    // Extract content for each segment
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];

      const startLine = segment.startLine;
      const endLine = nextSegment ? nextSegment.startLine : lines.length;

      const interviewLines = lines.slice(startLine, endLine);
      segment.content = interviewLines.join('\n').trim();
      segment.endLine = endLine;

      // Save to file
      const outputPath = path.join(outputDir, `${segment.id}.txt`);
      fs.writeFileSync(outputPath, segment.content, 'utf-8');

      const lineCount = endLine - startLine;
      console.log(`   ✅ ${segment.id}: ${lineCount} lines → ${outputPath}`);
      totalExtracted++;
    }
  }

  // Process English interview files (already individual)
  console.log('\n📖 Processing English interview files:');
  for (const file of englishFiles) {
    const filePath = path.join(inputDir, file.path);

    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${file.path}`);
      continue;
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    // Parse VTT if needed
    if (file.path.endsWith('.vtt')) {
      content = parseVTT(content);
    }

    const outputPath = path.join(outputDir, `${file.id}.txt`);
    fs.writeFileSync(outputPath, content, 'utf-8');

    const lineCount = content.split('\n').length;
    console.log(`   ✅ ${file.id}: ${lineCount} lines → ${outputPath}`);
    totalExtracted++;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Extraction complete! Total interviews: ${totalExtracted}/49`);

  if (totalExtracted < 49) {
    console.log(`\n⚠️  WARNING: Expected 49 interviews, got ${totalExtracted}`);
    console.log('   Some files may be missing or interview markers not detected.');
  }
}

function parseVTT(content: string): string {
  const lines = content.split('\n');
  const textLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Skip WEBVTT header, timestamps, and empty lines
    if (
      !line.startsWith('WEBVTT') &&
      !line.match(/^\d{2}:\d{2}:\d{2}/) &&
      !line.match(/^\d+$/) &&
      line.length > 0
    ) {
      textLines.push(line);
    }
  }

  return textLines.join('\n');
}

// CLI
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Usage: npx tsx split-interviews.ts <input-dir> <output-dir>');
  console.error('');
  console.error('Example:');
  console.error('  npx tsx split-interviews.ts /home/user/Interview-GenAI ./interviews-split');
  process.exit(1);
}

const inputDir = args[0];
const outputDir = args[1];

splitInterviews(inputDir, outputDir);
