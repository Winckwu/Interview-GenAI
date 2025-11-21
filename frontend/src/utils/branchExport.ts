import { MessageBranch } from '../hooks/useMessages';

export interface BranchExportData {
  originalContent: string;
  branches: MessageBranch[];
  messageId: string;
  exportedAt: string;
  totalBranches: number;
}

/**
 * Export branches to JSON format
 */
export function exportBranchesToJSON(
  originalContent: string,
  branches: MessageBranch[],
  messageId: string
): void {
  const data: BranchExportData = {
    originalContent,
    branches,
    messageId,
    exportedAt: new Date().toISOString(),
    totalBranches: branches.length + 1, // +1 for original
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `branches-${messageId.substring(0, 8)}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export branches to CSV format
 */
export function exportBranchesToCSV(
  originalContent: string,
  branches: MessageBranch[],
  messageId: string
): void {
  // CSV headers
  const headers = [
    'Branch Index',
    'Source',
    'Model',
    'Content',
    'Created At',
    'Verified',
    'Modified',
    'Character Count',
    'Word Count',
  ];

  // Create rows
  const rows: string[][] = [];

  // Add original as first row
  rows.push([
    '0',
    'original',
    '',
    escapeCsvField(originalContent),
    new Date().toISOString(),
    'false',
    'false',
    originalContent.length.toString(),
    originalContent.split(/\s+/).filter(w => w).length.toString(),
  ]);

  // Add branches
  branches.forEach((branch, index) => {
    rows.push([
      (index + 1).toString(),
      branch.source,
      branch.model || '',
      escapeCsvField(branch.content),
      branch.createdAt,
      (branch.wasVerified || false).toString(),
      (branch.wasModified || false).toString(),
      branch.content.length.toString(),
      branch.content.split(/\s+/).filter(w => w).length.toString(),
    ]);
  });

  // Build CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `branches-${messageId.substring(0, 8)}-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export branches to Markdown format for easy reading
 */
export function exportBranchesToMarkdown(
  originalContent: string,
  branches: MessageBranch[],
  messageId: string
): void {
  const lines: string[] = [];

  // Header
  lines.push(`# Branch History Export`);
  lines.push(`\n**Message ID:** ${messageId}`);
  lines.push(`**Exported:** ${new Date().toLocaleString()}`);
  lines.push(`**Total Branches:** ${branches.length + 1} (including original)`);
  lines.push(`\n---\n`);

  // Original content
  lines.push(`## Branch 0: Original\n`);
  lines.push(`**Created:** ${new Date().toLocaleString()}`);
  lines.push(`**Source:** Original\n`);
  lines.push(`### Content\n`);
  lines.push(originalContent);
  lines.push(`\n**Stats:** ${originalContent.length} characters, ${originalContent.split(/\s+/).filter(w => w).length} words\n`);
  lines.push(`---\n`);

  // Branches
  branches.forEach((branch, index) => {
    lines.push(`## Branch ${index + 1}: ${branch.source.toUpperCase()}${branch.model ? ` (${branch.model})` : ''}\n`);
    lines.push(`**Created:** ${new Date(branch.createdAt).toLocaleString()}`);
    lines.push(`**Source:** ${branch.source}`);
    if (branch.model) lines.push(`**Model:** ${branch.model}`);
    if (branch.wasVerified) lines.push(`**Status:** ✓ Verified`);
    if (branch.wasModified) lines.push(`**Status:** ✎ Modified`);
    lines.push(`\n### Content\n`);
    lines.push(branch.content);
    lines.push(`\n**Stats:** ${branch.content.length} characters, ${branch.content.split(/\s+/).filter(w => w).length} words\n`);
    lines.push(`---\n`);
  });

  // Create and download file
  const mdContent = lines.join('\n');
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `branches-${messageId.substring(0, 8)}-${Date.now()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV field to handle quotes and commas
 */
function escapeCsvField(field: string): string {
  // Replace newlines with spaces and escape quotes
  const cleaned = field.replace(/\n/g, ' ').replace(/\r/g, '');
  // If field contains comma or quote, wrap in quotes and escape existing quotes
  if (cleaned.includes(',') || cleaned.includes('"')) {
    return `"${cleaned.replace(/"/g, '""')}"`;
  }
  return cleaned;
}

/**
 * Export all branches in selected formats
 */
export function exportBranches(
  originalContent: string,
  branches: MessageBranch[],
  messageId: string,
  formats: ('json' | 'csv' | 'markdown')[]
): void {
  formats.forEach(format => {
    switch (format) {
      case 'json':
        exportBranchesToJSON(originalContent, branches, messageId);
        break;
      case 'csv':
        exportBranchesToCSV(originalContent, branches, messageId);
        break;
      case 'markdown':
        exportBranchesToMarkdown(originalContent, branches, messageId);
        break;
    }
  });
}
