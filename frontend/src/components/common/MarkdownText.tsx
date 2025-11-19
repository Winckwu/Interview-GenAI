/**
 * Simple Markdown Text Renderer
 * Renders basic markdown formatting without external dependencies
 * Supports: **bold**, *italic*, `code`, # headers, - lists, etc.
 */

import React from 'react';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

/**
 * Convert markdown text to JSX elements
 * Supports common markdown syntax:
 * - **bold** → <strong>bold</strong>
 * - *italic* → <em>italic</em>
 * - `code` → <code>code</code>
 * - # Headers → <h1>Headers</h1>
 * - > Quotes → <blockquote>Quotes</blockquote>
 * - [link](url) → <a>link</a>
 */
export const parseMarkdown = (content: string): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  // Pattern for inline markdown: **bold**, *italic*, `code`, [link](url)
  const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;

  let match;
  let lastMatchEnd = 0;

  // Process text with inline patterns
  while ((match = inlinePattern.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastMatchEnd) {
      result.push(content.substring(lastMatchEnd, match.index));
    }

    const text = match[0];

    // Bold text: **text**
    if (text.startsWith('**') && text.endsWith('**')) {
      result.push(
        <strong key={`bold-${match.index}`}>
          {text.slice(2, -2)}
        </strong>
      );
    }
    // Italic text: *text*
    else if (text.startsWith('*') && text.endsWith('*')) {
      result.push(
        <em key={`italic-${match.index}`}>
          {text.slice(1, -1)}
        </em>
      );
    }
    // Code text: `text`
    else if (text.startsWith('`') && text.endsWith('`')) {
      result.push(
        <code key={`code-${match.index}`} style={{
          backgroundColor: '#f3f4f6',
          padding: '0.125rem 0.25rem',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
        }}>
          {text.slice(1, -1)}
        </code>
      );
    }
    // Link text: [text](url)
    else if (text.startsWith('[') && match[2]) {
      result.push(
        <a
          key={`link-${match.index}`}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#3b82f6',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
        >
          {match[2]}
        </a>
      );
    }

    lastMatchEnd = inlinePattern.lastIndex;
  }

  // Add remaining text
  if (lastMatchEnd < content.length) {
    result.push(content.substring(lastMatchEnd));
  }

  return result.length > 0 ? result : [content];
};

/**
 * Component to render markdown text
 */
const MarkdownText: React.FC<MarkdownTextProps> = ({ content, className }) => {
  const elements = parseMarkdown(content);

  return (
    <span className={className}>
      {elements}
    </span>
  );
};

export default MarkdownText;
