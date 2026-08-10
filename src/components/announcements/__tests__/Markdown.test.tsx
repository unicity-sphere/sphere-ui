import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Markdown } from '../Markdown.js';

/**
 * Everything below is about markdown an author can actually type into the
 * composer's Body field and that used to reach the reader unstyled — a code
 * block wearing inline-code's pill, a GFM table with no rules, a quote
 * indistinguishable from a paragraph. Class-name assertions are the honest
 * test here: the defect is that no rule applied at all, so what has to be
 * proven is that one does.
 */
describe('Markdown', () => {
  it('renders a fenced code block as a scrollable block, not as inline code', () => {
    const { container } = render(
      <Markdown>{'```ts\nconst providers = createWalletApiProviders(base, { baseUrl, network });\n```'}</Markdown>,
    );

    const pre = container.querySelector('pre');
    expect(pre).toBeTruthy();
    // A long line must scroll inside the block instead of pushing the modal
    // wider than the viewport.
    expect(pre!.className).toContain('overflow-x-auto');
    // The block owns the background; the code inside it must not also wear
    // the inline pill's, which is what a single `code` override produced.
    expect(pre!.querySelector('code')!.getAttribute('style') ?? '').not.toContain('--bg-hover');
  });

  it('renders a fenced block with no language the same way as one with a language', () => {
    // The obvious shortcut — treat `className: 'language-*'` as "block" — is
    // wrong: a fence without a language gets no className at all and would
    // fall back to inline styling.
    const { container } = render(<Markdown>{'```\nnpm install\n```'}</Markdown>);
    expect(container.querySelector('pre')!.querySelector('code')!.getAttribute('style') ?? '')
      .not.toContain('--bg-hover');
  });

  it('keeps the pill styling for inline code', () => {
    const { container } = render(<Markdown>{'Run `npm install` first.'}</Markdown>);
    const code = container.querySelector('code')!;
    expect(code.closest('pre')).toBeNull();
    expect(code.getAttribute('style') ?? '').toContain('--bg-hover');
  });

  // The composer's Body is a plain textarea, so an author presses Enter and
  // expects a line break. Markdown's own rule — a single newline is a space,
  // only a blank line or two trailing spaces break the line — silently ran
  // their lines together, which is exactly what happened to a moderation
  // note typed on two lines. Chat and comment fields everywhere (GitHub's
  // included) resolve this the same way: honour the newline that was typed.
  it('turns a single newline into a line break, as the textarea it was typed in shows it', () => {
    const { container } = render(<Markdown>{'Test Test Test Test Test\nTestTestTestTestTest'}</Markdown>);
    expect(container.querySelector('br')).toBeTruthy();
  });

  it('still starts a new paragraph on a blank line', () => {
    const { container } = render(<Markdown>{'one\n\ntwo'}</Markdown>);
    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  it('leaves the newlines inside a code block exactly as written', () => {
    // A <br> injected into a code block would change the code itself.
    const { container } = render(<Markdown>{'```\nnpm install\nnpm run build\n```'}</Markdown>);
    const pre = container.querySelector('pre')!;
    expect(pre.querySelector('br')).toBeNull();
    expect(pre.textContent).toContain('npm install\nnpm run build');
  });

  it('gives a gfm table its own rules rather than leaving it borderless', () => {
    const { container } = render(<Markdown>{'| Version | Status |\n| --- | --- |\n| 0.14.3 | current |'}</Markdown>);

    const table = container.querySelector('table');
    expect(table).toBeTruthy();
    expect(table!.className).toContain('w-full');
    expect(container.querySelector('th')!.className).toContain('border-b');
    // Wide tables scroll rather than widening the card.
    expect(table!.parentElement!.className).toContain('overflow-x-auto');
  });

  it('renders a blockquote as a quote instead of another paragraph', () => {
    const { container } = render(<Markdown>{'> Deprecated since 0.14.1.'}</Markdown>);
    expect(container.querySelector('blockquote')!.className).toContain('border-l');
  });

  it('renders a horizontal rule as a visible line', () => {
    const { container } = render(<Markdown>{'before\n\n---\n\nafter'}</Markdown>);
    expect(container.querySelector('hr')!.className).toContain('h-px');
  });

  it('keeps an image inside the card width', () => {
    const { container } = render(<Markdown>{'![A screenshot](https://cdn.example/shot.png)'}</Markdown>);
    const img = container.querySelector('img')!;
    expect(img.className).toContain('max-w-full');
    expect(img.getAttribute('alt')).toBe('A screenshot');
  });

  it('styles headings below h3 instead of leaving them at browser defaults', () => {
    const { container } = render(<Markdown>{'#### Building a bot\n\n##### Details'}</Markdown>);
    expect(container.querySelector('h4')!.className).toContain('font-semibold');
    expect(container.querySelector('h5')!.className).toContain('font-semibold');
  });

  it('still renders raw html as inert text', () => {
    // The security model this file documents, restated here so the components
    // added around it cannot quietly reintroduce rehype-raw.
    const { container } = render(<Markdown>{'before <img src=x onerror="alert(1)"> after'}</Markdown>);
    expect(container.querySelector('img[onerror]')).toBeNull();
    expect(container.textContent).toContain('after');
  });
});
