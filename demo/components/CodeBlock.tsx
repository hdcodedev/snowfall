'use client';

import React, { useState } from 'react';

interface CodeBlockProps {
  code: string;
  className?: string;
  language?: string;
}

export default function CodeBlock({ code, className = '', language = 'bash' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may be unavailable in some contexts
    }
  };

  const highlightCode = (source: string) => {
    if (language === 'bash') {
      const tokens: React.ReactNode[] = [];
      const regex = /(\b(?:npm|npx|yarn|pnpm|bun|git)\b)|(\b(?:install|i|add|remove|run|build|start|dev|init|create|-y)\b)|(-[-a-zA-Z0-9]+)|(@[\w/-]+|[a-zA-Z0-9.\-_]+)/g;

      let lastIndex = 0;
      let match;
      let i = 0;

      while ((match = regex.exec(source)) !== null) {
        if (match.index > lastIndex) {
          tokens.push(<span key={i++} className="text-frost-muted">{source.slice(lastIndex, match.index)}</span>);
        }

        const content = match[0];
        let tokenClass = 'text-frost-muted';

        if (match[1]) {
          tokenClass = 'text-frost font-medium';
        } else if (match[2]) {
          tokenClass = 'text-glacier';
        } else if (match[3]) {
          tokenClass = 'text-frost-dim';
        } else if (match[4]) {
          tokenClass = 'text-copper-dim';
        }

        tokens.push(<span key={i++} className={tokenClass}>{content}</span>);
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < source.length) {
        tokens.push(<span key={i++} className="text-frost-muted">{source.slice(lastIndex)}</span>);
      }

      return (
        <pre className="text-sm font-mono overflow-x-auto whitespace-pre leading-relaxed">
          <code>{tokens}</code>
        </pre>
      );
    }

    const tokens: React.ReactNode[] = [];
    const regex = /(\/\*[\s\S]*?\*\/|\/\/.*)|((['"`])(?:\\.|(?!\3).)*\3)|(\b(?:import|from|function|return|export|default|const|let|var|true|false|null|undefined)\b)|(\b[A-Z][a-zA-Z0-9]*\b)|([{}[\],();])/g;

    let lastIndex = 0;
    let match;
    let i = 0;

    while ((match = regex.exec(source)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(<span key={i++} className="text-frost-muted">{source.slice(lastIndex, match.index)}</span>);
      }

      const content = match[0];
      let tokenClass = 'text-frost-muted';

      if (match[1]) {
        tokenClass = 'text-frost-dim';
      } else if (match[2]) {
        tokenClass = 'text-copper-dim';
      } else if (match[4]) {
        tokenClass = 'text-glacier font-medium';
      } else if (match[5]) {
        tokenClass = 'text-frost font-semibold';
      } else if (match[6]) {
        tokenClass = 'text-frost-dim';
      }

      tokens.push(<span key={i++} className={tokenClass}>{content}</span>);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < source.length) {
      tokens.push(<span key={i++} className="text-frost-muted">{source.slice(lastIndex)}</span>);
    }

    return (
      <pre className="text-xs md:text-sm font-mono overflow-x-auto leading-relaxed">
        <code>{tokens}</code>
      </pre>
    );
  };

  return (
    <div
      className={`relative group overflow-hidden ${className}`}
      style={{ borderRadius: 0 }}
    >
      {/* Language label */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-thin-ice/30">
        <span className="font-body text-[10px] uppercase tracking-[0.2em] text-frost-dim">
          {language}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className={`
            font-body text-[10px] uppercase tracking-[0.15em] transition-all duration-200 cursor-pointer
            focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-glacier
            ${copied
              ? 'text-glacier'
              : 'text-frost-dim hover:text-frost-muted'
            }
          `}
          aria-label="Copy to clipboard"
          title="Copy to clipboard"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="overflow-x-auto p-5">
        {highlightCode(code)}
      </div>
    </div>
  );
}
