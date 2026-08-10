import { createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import type { ComponentPropsWithoutRef } from 'react';

export interface MarkdownProps {
  children: string;
}

/**
 * Whether the `code` being rendered sits inside a fenced block.
 *
 * react-markdown v10 removed the `inline` prop its `code` component used to
 * receive, and the usual replacement — "treat `className: language-*` as a
 * block" — is wrong: a fence written without a language gets no className at
 * all and would silently fall back to inline styling. The `pre` component
 * below is the only thing that reliably knows, so it says so here.
 *
 * Descendant CSS would be the other way to do this (`pre code { … }`), but
 * the inline-code style sets its background through a `style` attribute,
 * which no class from an ancestor can override.
 */
const InCodeBlock = createContext(false);

/**
 * The one place in this library that renders announcement body text. Deliberately
 * carries no `rehype-raw` and no `dangerouslySetInnerHTML` — react-markdown parses
 * the body into a syntax tree and renders each node as a real React element, so an
 * `<img onerror=...>` written into the body is emitted as inert text, never as an
 * element the DOM would execute. That is the whole security model here: there is
 * nothing to sanitise because raw HTML is never turned into elements in the first
 * place. Do not add `rehype-raw` to this file.
 *
 * Every element markdown (plus GFM) can produce is given a style. An element
 * left out does not fail loudly — it renders at browser defaults, which on
 * this dark card means an invisible `<hr>`, a borderless table and a quote
 * indistinguishable from a paragraph. The composer accepts all of it, so all
 * of it is styled here.
 */
export function Markdown({ children }: MarkdownProps) {
  return (
    <div className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
      <ReactMarkdown
        // `remark-breaks` makes a single newline a line break. Markdown's own
        // rule is that it is a space, and only a blank line or two trailing
        // spaces break the line — which is a reasonable rule for a document
        // format and the wrong one for the field this text is typed into: the
        // composer's Body is a plain textarea, and an author who pressed
        // Enter once watched their two lines silently run together. Comment
        // fields everywhere (GitHub's included) settle this the same way.
        // It affects text only, so a code block's newlines stay untouched.
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: props => <h1 className="text-lg font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }} {...props} />,
          h2: props => <h2 className="text-base font-semibold mt-4 mb-2" style={{ color: 'var(--text-primary)' }} {...props} />,
          h3: props => <h3 className="text-sm font-semibold mt-3 mb-1.5" style={{ color: 'var(--text-primary)' }} {...props} />,
          // h4 and below share h3's treatment: past the third level the
          // distinction is decorative, and an announcement that nests deeper
          // than that has a structure problem no type scale will fix. What
          // matters is that they stop rendering at browser defaults, which
          // made an h4 smaller than the body text around it.
          h4: props => <h4 className="text-sm font-semibold mt-3 mb-1.5" style={{ color: 'var(--text-primary)' }} {...props} />,
          h5: props => <h5 className="text-sm font-semibold mt-3 mb-1.5" style={{ color: 'var(--text-primary)' }} {...props} />,
          h6: props => <h6 className="text-sm font-semibold mt-3 mb-1.5" style={{ color: 'var(--text-primary)' }} {...props} />,
          p: props => <p className="mb-2 last:mb-0" {...props} />,
          ul: props => <ul className="list-disc pl-5 mb-2 space-y-1" {...props} />,
          ol: props => <ol className="list-decimal pl-5 mb-2 space-y-1" {...props} />,
          li: props => <li {...props} />,
          strong: props => <strong className="font-semibold" style={{ color: 'var(--text-primary)' }} {...props} />,
          del: props => <del className="line-through opacity-70" {...props} />,
          blockquote: props => (
            <blockquote
              className="border-l-2 pl-3 my-2 italic"
              style={{ borderColor: 'var(--border)' }}
              {...props}
            />
          ),
          hr: props => <hr className="my-4 border-0 h-px" style={{ background: 'var(--border)' }} {...props} />,
          // The block owns the background and the scrolling; `code` inside it
          // only carries the monospace face. A release note's install command
          // routinely runs wider than this card, and a block that widens the
          // card instead of scrolling inside it breaks the whole page layout.
          pre: props => (
            <InCodeBlock.Provider value={true}>
              <pre
                className="rounded-lg p-3 mb-2 overflow-x-auto text-xs"
                style={{ background: 'var(--bg-hover)' }}
                {...props}
              />
            </InCodeBlock.Provider>
          ),
          // A named, PascalCase function rather than an arrow: it calls a
          // hook, so it has to read as a component to both React and the
          // rules-of-hooks lint.
          code: function Code(props) {
            const inBlock = useContext(InCodeBlock);
            if (inBlock) {
              return <code style={{ fontFamily: 'var(--font-mono)' }} {...props} />;
            }
            return (
              <code
                className="px-1 py-0.5 rounded text-xs"
                style={{ background: 'var(--bg-hover)', fontFamily: 'var(--font-mono)' }}
                {...props}
              />
            );
          },
          // GFM tables: the wrapper scrolls, for the same reason the code
          // block does — a comparison table of SDK versions is wider than a
          // 512px modal long before it is unreasonable to write.
          table: props => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-xs border-collapse" {...props} />
            </div>
          ),
          th: props => (
            <th
              className="text-left font-semibold px-2 py-1 border-b"
              style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              {...props}
            />
          ),
          td: props => (
            <td className="px-2 py-1 border-b align-top" style={{ borderColor: 'var(--border)' }} {...props} />
          ),
          // `![alt](url)` is markdown, not raw HTML, so this element exists
          // whether or not it is styled — the src has always been the
          // author's to choose. `no-referrer` keeps the reader's current URL
          // from reaching whatever host that is; `lazy` keeps an image in a
          // long body from competing with the text for the first paint.
          img: ({ alt, ...props }: ComponentPropsWithoutRef<'img'>) => (
            <img
              alt={alt ?? ''}
              className="max-w-full h-auto rounded-lg my-2"
              loading="lazy"
              referrerPolicy="no-referrer"
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
