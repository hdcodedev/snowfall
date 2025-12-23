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
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const highlightCode = (source: string) => {
        if (language === 'bash') {
            const tokens: React.ReactNode[] = [];
            // Regex for basic Bash highlighting
            const regex = /(\b(?:npm|npx|yarn|pnpm|bun|git)\b)|(\b(?:install|i|add|remove|run|build|start|dev|init|create|-y)\b)|(-[-a-zA-Z0-9]+)|(@[\w/-]+|[a-zA-Z0-9.\-_]+)/g;

            let lastIndex = 0;
            let match;
            let i = 0;

            while ((match = regex.exec(source)) !== null) {
                if (match.index > lastIndex) {
                    tokens.push(<span key={i++} className="text-slate-700 dark:text-slate-300">{source.slice(lastIndex, match.index)}</span>);
                }

                const content = match[0];
                let tokenClass = "text-slate-700 dark:text-slate-300";

                if (match[1]) { // Tool - Sky Blue (Ice)
                    tokenClass = "text-sky-600 dark:text-sky-300 font-semibold";
                } else if (match[2]) { // Command - Cyan (Frost)
                    tokenClass = "text-cyan-600 dark:text-cyan-300";
                } else if (match[3]) { // Flags - Slate (Cloudy)
                    tokenClass = "text-slate-500 dark:text-slate-400 italic";
                } else if (match[4]) { // Args/Package - Teal (Pine)
                    tokenClass = "text-teal-600 dark:text-teal-300";
                }

                tokens.push(<span key={i++} className={tokenClass}>{content}</span>);
                lastIndex = regex.lastIndex;
            }

            if (lastIndex < source.length) {
                tokens.push(<span key={i++} className="text-slate-700 dark:text-slate-300">{source.slice(lastIndex)}</span>);
            }

            return (
                <pre className="text-sm md:text-base font-mono overflow-x-auto whitespace-pre">
                    <code>{tokens}</code>
                </pre>
            );
        }

        const tokens: React.ReactNode[] = [];
        // Regex for basic TSX/JS highlighting
        const regex = /(\/\*[\s\S]*?\*\/|\/\/.*)|((['"`])(?:\\.|(?!\3).)*\3)|(\b(?:import|from|function|return|export|default|const|let|var|true|false|null|undefined)\b)|(\b[A-Z][a-zA-Z0-9]*\b)|([{}[\],();])/g;

        let lastIndex = 0;
        let match;
        let i = 0;

        while ((match = regex.exec(source)) !== null) {
            if (match.index > lastIndex) {
                tokens.push(<span key={i++} className="text-slate-700 dark:text-slate-300">{source.slice(lastIndex, match.index)}</span>);
            }

            const content = match[0];
            let tokenClass = "text-slate-700 dark:text-slate-300";

            if (match[1]) { // Comment - Slate (Cloudy)
                tokenClass = "text-slate-500 dark:text-slate-400 italic";
            } else if (match[2]) { // String - Teal (Pine)
                tokenClass = "text-teal-600 dark:text-teal-300";
            } else if (match[4]) { // Keyword - Sky Blue (Ice)
                tokenClass = "text-sky-600 dark:text-sky-400 font-medium";
            } else if (match[5]) { // Component/Class - Indigo (Deep Winter)
                tokenClass = "text-indigo-600 dark:text-indigo-300 font-semibold";
            } else if (match[6]) { // Punctuation - Slate
                tokenClass = "text-slate-500 dark:text-slate-400";
            }

            tokens.push(<span key={i++} className={tokenClass}>{content}</span>);
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < source.length) {
            tokens.push(<span key={i++} className="text-slate-700 dark:text-slate-300">{source.slice(lastIndex)}</span>);
        }

        return (
            <pre className="text-xs md:text-sm font-mono overflow-x-auto">
                <code>{tokens}</code>
            </pre>
        );
    };

    return (
        <div
            onClick={handleCopy}
            className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all active:scale-[0.99] ${className}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCopy();
                }
            }}
        >
            <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    type="button"
                    className="p-2 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white transition-all shadow-lg"
                    aria-label="Copy to clipboard"
                    title="Copy to clipboard"
                >
                    {copied ? (
                        <svg
                            className="w-4 h-4 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                            />
                        </svg>
                    ) : (
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                    )}
                </button>
            </div>

            <div className="overflow-x-auto p-4">
                {highlightCode(code)}
            </div>
        </div>
    );
}
