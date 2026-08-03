import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ComponentPropsWithoutRef } from 'react';

export interface MarkdownProps {
  children: string;
}

/**
 * The one place in this library that renders announcement body text. Deliberately
 * carries no `rehype-raw` and no `dangerouslySetInnerHTML` — react-markdown parses
 * the body into a syntax tree and renders each node as a real React element, so an
 * `<img onerror=...>` written into the body is emitted as inert text, never as an
 * element the DOM would execute. That is the whole security model here: there is
 * nothing to sanitise because raw HTML is never turned into elements in the first
 * place. Do not add `rehype-raw` to this file.
 */
export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: props => <h1 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }} {...props} />,
          h2: props => <h2 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }} {...props} />,
          h3: props => <h3 className="text-sm font-semibold mt-3 mb-1.5" style={{ color: 'var(--text-primary)' }} {...props} />,
          p: props => <p className="mb-2 last:mb-0" {...props} />,
          ul: props => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: props => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          li: props => <li {...props} />,
          strong: props => <strong className="font-semibold" style={{ color: 'var(--text-primary)' }} {...props} />,
          code: props => (
            <code
              className="px-1 py-0.5 rounded text-xs"
              style={{ background: 'var(--bg-hover)', fontFamily: 'var(--font-mono)' }}
              {...props}
            />
          ),
          a: ({ href, ...props }: ComponentPropsWithoutRef<'a'>) => {
            // Absolute links open in a new tab so an announcement can never
            // navigate the host app away from itself; relative in-app links
            // (e.g. a quest deep link) stay in place.
            const isAbsolute = !!href && /^[a-z][a-z0-9+.-]*:\/\//i.test(href);
            return (
              <a
                href={href}
                target={isAbsolute ? '_blank' : undefined}
                rel={isAbsolute ? 'noopener noreferrer' : undefined}
                className="underline underline-offset-2"
                style={{ color: 'var(--accent-text)' }}
                {...props}
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
