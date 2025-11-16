#!/usr/bin/env node
/**
 * CLI Tool for Training Data Extraction
 *
 * Usage:
 *   npx tsx src/ml/extract-cli.ts <transcript-dir> <output-csv>
 *
 * Example:
 *   npx tsx src/ml/extract-cli.ts /path/to/transcripts ./training-data.csv
 */

import { extractTrainingData } from './extractTrainingData.js';
import path from 'path';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('❌ Error: Missing arguments\n');
  console.log('Usage:');
  console.log('  npx tsx src/ml/extract-cli.ts <transcript-dir> <output-csv>\n');
  console.log('Example:');
  console.log('  npx tsx src/ml/extract-cli.ts ../../transcripts ./training-data.csv\n');
  console.log('Input directory should contain:');
  console.log('  - 受访人录音转文字1-15.txt');
  console.log('  - 受访人录音转文字16-25.txt');
  console.log('  - 受访人语音转文字26-33.txt');
  console.log('  - 受访人录音转文字34-42.txt');
  console.log('  - 43-GMT20251015-094409_Recording.transcript.vtt');
  console.log('  - ... (and other transcript files)\n');
  process.exit(1);
}

const transcriptDir = path.resolve(args[0]);
const outputPath = path.resolve(args[1]);

console.log(`Input directory: ${transcriptDir}`);
console.log(`Output CSV: ${outputPath}\n`);

extractTrainingData(transcriptDir, outputPath);
