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
 * Parse inline markdown (bold, italic, code, links)
 */
const parseInlineMarkdown = (text: string, keyPrefix: string): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  const inlinePattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[([^\]]+)\]\(([^)]+)\))/g;

  let lastMatchEnd = 0;
  let match;

  while ((match = inlinePattern.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastMatchEnd) {
      result.push(text.substring(lastMatchEnd, match.index));
    }

    const matchedText = match[0];

    // Bold text: **text**
    if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
      result.push(
        <strong key={`${keyPrefix}-bold-${match.index}`}>
          {matchedText.slice(2, -2)}
        </strong>
      );
    }
    // Italic text: *text* (but not part of list marker)
    else if (matchedText.startsWith('*') && matchedText.endsWith('*') && !matchedText.includes(' ')) {
      result.push(
        <em key={`${keyPrefix}-italic-${match.index}`}>
          {matchedText.slice(1, -1)}
        </em>
      );
    }
    // Code text: `text`
    else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
      result.push(
        <code key={`${keyPrefix}-code-${match.index}`} style={{
          backgroundColor: '#f3f4f6',
          padding: '0.125rem 0.25rem',
          borderRadius: '0.25rem',
          fontFamily: 'monospace',
        }}>
          {matchedText.slice(1, -1)}
        </code>
      );
    }
    // Link text: [text](url)
    else if (matchedText.startsWith('[') && match[2]) {
      result.push(
        <a
          key={`${keyPrefix}-link-${match.index}`}
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
  if (lastMatchEnd < text.length) {
    result.push(text.substring(lastMatchEnd));
  }

  return result.length > 0 ? result : [text];
};

/**
 * Convert markdown text to JSX elements
 * Supports common markdown syntax:
 * - **bold** → <strong>bold</strong>
 * - *italic* → <em>italic</em>
 * - `code` → <code>code</code>
 * - # Headers → <h1>Headers</h1>
 * - > Quotes → <blockquote>Quotes</blockquote>
 * - [link](url) → <a>link</a>
 * - - Lists → <li>Lists</li>
 */
export const parseMarkdown = (content: string): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  const lines = content.split('\n');

  let listItems: React.ReactNode[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let listStartIndex = 0;

  const flushList = (currentIndex: number) => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType;
      result.push(
        <ListTag key={`list-${listStartIndex}`} style={{
          margin: '0.5rem 0',
          paddingLeft: '1.5rem',
        }}>
          {listItems}
        </ListTag>
      );
      listItems = [];
      listType = null;
    }
  };

  lines.forEach((line, lineIndex) => {
    // Headers: # ## ### #### ##### ######
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushList(lineIndex);
      const level = headerMatch[1].length;
      const text = headerMatch[2];

      const headerStyle = {
        margin: '0.75rem 0 0.5rem 0',
        fontWeight: level <= 3 ? 'bold' : '600',
        fontSize: level === 1 ? '1.5rem' : level === 2 ? '1.25rem' : level === 3 ? '1.1rem' : '1rem',
        lineHeight: '1.4',
      };

      const headerContent = parseInlineMarkdown(text, `h${level}-${lineIndex}`);

      // Create appropriate header element based on level
      const headerElement = React.createElement(
        `h${level}`,
        { key: `header-${lineIndex}`, style: headerStyle },
        headerContent
      );

      result.push(headerElement);
      return;
    }

    // Unordered lists: - item or * item
    const ulMatch = line.match(/^[\s]*[-*]\s+(.+)$/);
    if (ulMatch) {
      const text = ulMatch[1];

      if (listType !== 'ul') {
        flushList(lineIndex);
        listType = 'ul';
        listStartIndex = lineIndex;
      }

      listItems.push(
        <li key={`li-${lineIndex}`} style={{ margin: '0.25rem 0' }}>
          {parseInlineMarkdown(text, `li-${lineIndex}`)}
        </li>
      );
      return;
    }

    // Ordered lists: 1. item
    const olMatch = line.match(/^[\s]*\d+\.\s+(.+)$/);
    if (olMatch) {
      const text = olMatch[1];

      if (listType !== 'ol') {
        flushList(lineIndex);
        listType = 'ol';
        listStartIndex = lineIndex;
      }

      listItems.push(
        <li key={`li-${lineIndex}`} style={{ margin: '0.25rem 0' }}>
          {parseInlineMarkdown(text, `li-${lineIndex}`)}
        </li>
      );
      return;
    }

    // Blockquotes: > text
    const quoteMatch = line.match(/^>\s+(.+)$/);
    if (quoteMatch) {
      flushList(lineIndex);
      const text = quoteMatch[1];

      result.push(
        <blockquote key={`quote-${lineIndex}`} style={{
          borderLeft: '4px solid #d1d5db',
          paddingLeft: '1rem',
          margin: '0.5rem 0',
          color: '#6b7280',
          fontStyle: 'italic',
        }}>
          {parseInlineMarkdown(text, `quote-${lineIndex}`)}
        </blockquote>
      );
      return;
    }

    // Empty line
    if (line.trim() === '') {
      flushList(lineIndex);
      result.push(<br key={`br-${lineIndex}`} />);
      return;
    }

    // Regular paragraph
    flushList(lineIndex);
    result.push(
      <span key={`p-${lineIndex}`} style={{ display: 'block', margin: '0.25rem 0' }}>
        {parseInlineMarkdown(line, `p-${lineIndex}`)}
      </span>
    );
  });

  // Flush any remaining list
  flushList(lines.length);

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
