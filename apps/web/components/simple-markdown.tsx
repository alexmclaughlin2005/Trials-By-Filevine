/**
 * Simple markdown renderer compatible with React 19
 * Supports basic markdown features without heavy dependencies
 */

import React from 'react';

interface SimpleMarkdownProps {
  content: string;
  className?: string;
}

export function SimpleMarkdown({ content, className = '' }: SimpleMarkdownProps) {
  const renderContent = (text: string) => {
    // Convert markdown to HTML
    let html = text;

    // Code blocks (```language\ncode\n```)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      return `<pre class="markdown-code-block"><code class="language-${lang || 'plaintext'}">${escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code (`code`)
    html = html.replace(/`([^`]+)`/g, (_match, code) => {
      return `<code class="markdown-inline-code">${escapeHtml(code)}</code>`;
    });

    // Bold (**text** or __text__)
    html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong class="markdown-bold">$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong class="markdown-bold">$1</strong>');

    // Italic (*text* or _text_)
    html = html.replace(/\*([^\*]+)\*/g, '<em class="markdown-italic">$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em class="markdown-italic">$1</em>');

    // Links [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a class="markdown-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Headings (# H1, ## H2, etc.)
    html = html.replace(/^### (.*$)/gim, '<h3 class="markdown-h3">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="markdown-h2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="markdown-h1">$1</h1>');

    // Lists
    // Unordered lists (- item or * item or • item)
    html = html.replace(/^\s*[•\-*]\s+(.*)$/gim, '<li class="markdown-li">$1</li>');
    html = html.replace(/(<li class="markdown-li">.*<\/li>\n?)+/g, '<ul class="markdown-ul">$&</ul>');

    // Numbered lists (1. item)
    html = html.replace(/^\s*\d+\.\s+(.*)$/gim, '<li class="markdown-li-ordered">$1</li>');
    html = html.replace(/(<li class="markdown-li-ordered">.*<\/li>\n?)+/g, '<ol class="markdown-ol">$&</ol>');

    // Paragraphs - split by double newlines
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(p => {
      // Don't wrap if already has block-level tags
      if (p.match(/^<(h[1-6]|ul|ol|pre|div)/)) {
        return p;
      }
      // Replace single newlines with line breaks within paragraphs
      const withBreaks = p.replace(/\n/g, '<br />');
      return `<p class="markdown-p">${withBreaks}</p>`;
    }).join('');

    return html;
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderContent(content) }}
    />
  );
}
