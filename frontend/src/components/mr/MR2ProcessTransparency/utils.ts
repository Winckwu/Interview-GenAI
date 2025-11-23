/**
 * MR2: Process Transparency - Utilities for diff, timeline, and export
 */

import { InteractionVersion } from './index';

export interface VersionSnapshot {
  id: string;
  timestamp: Date;
  output: string;
  reasoning?: string;
}

export interface DiffChange {
  type: 'add' | 'remove' | 'modify';
  content: string;
  oldContent?: string;
  context?: string;
  lineNumber?: number;
}

export interface TimelineEvent {
  title: string;
  description: string;
  timestamp: Date;
  formattedTime: string;
  eventType: 'prompt' | 'response';
  versionId?: string;
  changes?: { added: number; removed: number; modified: number };
}

export interface ChainOfThoughtStep {
  type: string;
  reasoning: string;
  confidence?: number;
}

/**
 * Generate diff between two text versions
 * Uses simple line-based diff algorithm
 */
export function generateDiff(oldText: string, newText: string): DiffChange[] {
  const diffs: DiffChange[] = [];
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Simple diff: identify added/removed/modified lines
  const maxLength = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < maxLength; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';

    if (oldLine === newLine) {
      // No change
      continue;
    } else if (i >= oldLines.length) {
      // Added line
      diffs.push({
        type: 'add',
        content: newLine,
        lineNumber: i
      });
    } else if (i >= newLines.length) {
      // Removed line
      diffs.push({
        type: 'remove',
        content: oldLine,
        lineNumber: i
      });
    } else {
      // Modified line
      diffs.push({
        type: 'modify',
        content: newLine,
        oldContent: oldLine,
        lineNumber: i
      });
    }
  }

  return diffs;
}

/**
 * Create timeline events from interaction history
 */
export function createTimeline(versions: InteractionVersion[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  versions.forEach((version, idx) => {
    // Prompt event
    events.push({
      title: `用户提示 (对话 ${version.promptVersion})`,
      description: version.userPrompt,
      timestamp: version.timestamp,
      formattedTime: formatTime(version.timestamp),
      eventType: 'prompt'
    });

    // Response event
    const prevOutput = idx > 0 ? versions[idx - 1].aiOutput : '';
    const diffResult = prevOutput ? generateDiff(prevOutput, version.aiOutput) : [];

    const changes = {
      added: diffResult.filter(d => d.type === 'add').length,
      removed: diffResult.filter(d => d.type === 'remove').length,
      modified: diffResult.filter(d => d.type === 'modify').length
    };

    events.push({
      title: `AI 回复 (${version.modelName})`,
      description: version.aiOutput.substring(0, 100) + '...',
      timestamp: new Date(version.timestamp.getTime() + 1000), // 1 second after prompt
      formattedTime: formatTime(new Date(version.timestamp.getTime() + 1000)),
      eventType: 'response',
      versionId: version.id,
      changes
    });
  });

  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Extract chain-of-thought steps from reasoning text
 */
export function extractChainOfThought(reasoningText: string): ChainOfThoughtStep[] {
  const steps: ChainOfThoughtStep[] = [];

  // Simple extraction: split by numbered steps or keywords
  const stepPatterns = [
    /Step (\d+):\s*(.+?)(?=Step \d+:|$)/gs,
    /(\d+\.\s*.+?)(?=\d+\.|$)/gs,
    /([A-Z][^.!?]*[.!?])/g
  ];

  let matches: RegExpExecArray | null = null;

  for (const pattern of stepPatterns) {
    matches = pattern.exec(reasoningText);
    if (matches) break;
  }

  if (matches) {
    // Use matched pattern
    const stepPattern = /Step (\d+):\s*(.+?)(?=Step \d+:|$)/gs;
    let match;
    let stepNum = 0;

    while ((match = stepPattern.exec(reasoningText)) !== null) {
      steps.push({
        type: `Step ${++stepNum}`,
        reasoning: match[2].trim(),
        // NOTE: 这是示例/占位符置信度分数 (70-90%)
        // 在实际应用中，应从AI模型的输出中获取真实的置信度评分
        confidence: 0.7 + Math.random() * 0.2
      });
    }
  } else {
    // Fallback: treat entire reasoning as single step
    steps.push({
      type: 'Reasoning',
      reasoning: reasoningText,
      // NOTE: 这是示例/占位符置信度分数 (75%)
      // 在实际应用中，应从AI模型的输出中获取真实的置信度评分
      confidence: 0.75
    });
  }

  return steps;
}

/**
 * Compare two versions and generate metrics
 */
export interface ComparisonMetric {
  label: string;
  v1Value: number;
  v2Value: number;
  v1Display: string;
  v2Display: string;
}

export interface VersionComparison {
  metrics: ComparisonMetric[];
  similarity: number;
}

export function compareVersions(v1: InteractionVersion, v2: InteractionVersion): VersionComparison {
  const v1Length = v1.aiOutput.length;
  const v2Length = v2.aiOutput.length;
  const maxLength = Math.max(v1Length, v2Length);

  const metrics: ComparisonMetric[] = [
    {
      label: 'Output Length',
      v1Value: (v1Length / maxLength) * 100,
      v2Value: (v2Length / maxLength) * 100,
      v1Display: `${v1Length} chars`,
      v2Display: `${v2Length} chars`
    },
    {
      label: 'Confidence Score',
      v1Value: ((v1.confidenceScore || 0) * 100),
      v2Value: ((v2.confidenceScore || 0) * 100),
      v1Display: `${((v1.confidenceScore || 0) * 100).toFixed(0)}%`,
      v2Display: `${((v2.confidenceScore || 0) * 100).toFixed(0)}%`
    }
  ];

  // Calculate similarity (simple Jaccard similarity)
  const words1 = new Set(v1.aiOutput.split(/\s+/));
  const words2 = new Set(v2.aiOutput.split(/\s+/));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  const similarity = intersection.size / union.size;

  return {
    metrics,
    similarity
  };
}

/**
 * Export interaction history in various formats
 */
export function exportInteractionHistory(
  versions: InteractionVersion[],
  format: 'json' | 'markdown' | 'pdf'
): string {
  if (format === 'json') {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        totalVersions: versions.length,
        versions: versions.map(v => ({
          id: v.id,
          promptVersion: v.promptVersion,
          timestamp: v.timestamp.toISOString(),
          userPrompt: v.userPrompt,
          aiOutput: v.aiOutput,
          modelName: v.modelName,
          confidenceScore: v.confidenceScore,
          reasoning: v.reasoning
        }))
      },
      null,
      2
    );
  }

  if (format === 'markdown') {
    let markdown = `# Interaction History\n\n`;
    markdown += `**Generated**: ${new Date().toLocaleString()}\n`;
    markdown += `**Total Versions**: ${versions.length}\n\n`;

    versions.forEach((version, idx) => {
      markdown += `## Version ${version.promptVersion}\n\n`;
      markdown += `**Model**: ${version.modelName}\n`;
      markdown += `**Timestamp**: ${new Date(version.timestamp).toLocaleString()}\n`;

      if (version.confidenceScore) {
        markdown += `**Confidence**: ${(version.confidenceScore * 100).toFixed(0)}%\n`;
      }

      markdown += `\n### User Prompt\n\n${version.userPrompt}\n\n`;
      markdown += `### AI Output\n\n${version.aiOutput}\n\n`;

      if (version.reasoning) {
        markdown += `### Reasoning\n\n${version.reasoning}\n\n`;
      }

      markdown += `---\n\n`;
    });

    return markdown;
  }

  // PDF export would require additional library (not included in this basic version)
  return JSON.stringify({ error: 'PDF export requires external library' });
}

/**
 * Calculate change metrics across iterations
 */
export interface ChangeMetrics {
  totalIterations: number;
  totalChanges: number;
  sessionDuration: string;
  avgTokensPerOutput: number;
  avgConfidence: number;
  iterationSummary: Array<{ changes: number; tokens: number }>;
}

export function calculateChangeMetrics(versions: InteractionVersion[]): ChangeMetrics {
  let totalChanges = 0;
  const iterationSummary = [];
  let totalTokens = 0;
  let confidenceSum = 0;
  let confidenceCount = 0;

  let prevOutput = '';
  versions.forEach(version => {
    const diff = generateDiff(prevOutput, version.aiOutput);
    const changes = diff.length;
    totalChanges += changes;

    // Estimate tokens (rough: 1 token per 4 characters)
    const tokens = Math.ceil(version.aiOutput.length / 4);
    totalTokens += tokens;

    iterationSummary.push({ changes, tokens });

    if (version.confidenceScore) {
      confidenceSum += version.confidenceScore;
      confidenceCount++;
    }

    prevOutput = version.aiOutput;
  });

  const sessionStart = new Date(versions[0].timestamp);
  const sessionEnd = new Date(versions[versions.length - 1].timestamp);
  const durationMs = sessionEnd.getTime() - sessionStart.getTime();
  const durationMins = Math.floor(durationMs / 60000);
  const durationSecs = Math.floor((durationMs % 60000) / 1000);

  return {
    totalIterations: versions.length,
    totalChanges,
    sessionDuration: `${durationMins}m ${durationSecs}s`,
    avgTokensPerOutput: totalTokens / versions.length,
    avgConfidence: confidenceCount > 0 ? confidenceSum / confidenceCount : 0,
    iterationSummary
  };
}

/**
 * Helper: Format timestamp for display
 */
function formatTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else {
    const hours = Math.floor(diffMins / 60);
    return `${hours}h ago`;
  }
}

export default {
  generateDiff,
  createTimeline,
  extractChainOfThought,
  compareVersions,
  exportInteractionHistory,
  calculateChangeMetrics
};
