import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CustomSelect } from '../CustomSelect';

const OPTIONS = [
  { value: 'mainnet', label: 'Mainnet' },
  { value: 'testnet2', label: 'Testnet' },
  { value: 'stagenet', label: 'Stagenet' },
];

const combobox = () => screen.getByRole('combobox');
const listbox = () => screen.queryByRole('listbox');
const optionNames = () => screen.getAllByRole('option').map(o => o.textContent);
const activeOptionName = () => {
  const id = combobox().getAttribute('aria-activedescendant');
  return id ? document.getElementById(id)?.textContent : null;
};

function setup(props: Partial<Parameters<typeof CustomSelect>[0]> = {}) {
  const onChange = vi.fn();
  const user = userEvent.setup();
  render(
    <>
      <CustomSelect options={OPTIONS} value="testnet2" onChange={onChange} ariaLabel="Network" {...props} />
      {/* The control that would come next in a form — the one Tab must reach, and the one a
          portalled, focusable list would have put BEFORE the options. */}
      <button type="button">Submit</button>
    </>,
  );
  return { onChange, user };
}

/** A harness that actually holds the value, for asserting what the control shows after a pick. */
function Controlled({ initial = 'testnet2' }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <CustomSelect options={OPTIONS} value={value} onChange={setValue} ariaLabel="Network" />;
}

describe('CustomSelect', () => {
  describe('the combobox contract', () => {
    it('announces itself as a closed listbox control, named by its label and not its value', () => {
      setup();

      expect(combobox()).toHaveAttribute('aria-haspopup', 'listbox');
      expect(combobox()).toHaveAttribute('aria-expanded', 'false');
      expect(combobox()).not.toHaveAttribute('aria-controls');
      expect(combobox()).toHaveAccessibleName('Network');
      expect(listbox()).toBeNull();
    });

    it('points at the list it opened, and at the row the cursor is on', async () => {
      const { user } = setup();

      await user.click(combobox());

      expect(combobox()).toHaveAttribute('aria-expanded', 'true');
      expect(combobox().getAttribute('aria-controls')).toBe(listbox()!.id);
      expect(activeOptionName()).toBe('Testnet');
    });

    it('marks only the current value as selected', async () => {
      const { user } = setup();

      await user.click(combobox());

      expect(screen.getAllByRole('option', { selected: true }).map(o => o.textContent)).toEqual(['Testnet']);
    });

    it('prefers a labelling element over its own label text, as the HTML does', () => {
      render(
        <>
          <span id="net-label">Declared network</span>
          <CustomSelect
            options={OPTIONS}
            value="mainnet"
            onChange={() => {}}
            ariaLabel="Network"
            ariaLabelledBy="net-label"
            ariaDescribedBy="net-hint"
          />
          <p id="net-hint">Pick the chain this app declares.</p>
        </>,
      );

      expect(combobox()).toHaveAccessibleName('Declared network');
      expect(combobox()).toHaveAccessibleDescription('Pick the chain this app declares.');
    });
  });

  describe('keyboard', () => {
    it('opens on ArrowDown with the cursor on the current value', async () => {
      const { user } = setup();
      combobox().focus();

      await user.keyboard('{ArrowDown}');

      expect(listbox()).not.toBeNull();
      expect(activeOptionName()).toBe('Testnet');
    });

    it.each(['{Enter}', ' ', '{ArrowUp}'])('opens on %s too', async (key) => {
      const { user } = setup();
      combobox().focus();

      await user.keyboard(key);

      expect(listbox()).not.toBeNull();
    });

    it('moves the cursor with the arrows and stops at the ends', async () => {
      const { user } = setup();
      combobox().focus();

      await user.keyboard('{ArrowDown}'); // opens on Testnet
      await user.keyboard('{ArrowDown}');
      expect(activeOptionName()).toBe('Stagenet');

      await user.keyboard('{ArrowDown}'); // already last
      expect(activeOptionName()).toBe('Stagenet');

      await user.keyboard('{ArrowUp}{ArrowUp}');
      expect(activeOptionName()).toBe('Mainnet');

      await user.keyboard('{ArrowUp}'); // already first
      expect(activeOptionName()).toBe('Mainnet');
    });

    it('jumps to the ends with Home and End', async () => {
      const { user } = setup();
      combobox().focus();

      await user.keyboard('{ArrowDown}{End}');
      expect(activeOptionName()).toBe('Stagenet');

      await user.keyboard('{Home}');
      expect(activeOptionName()).toBe('Mainnet');
    });

    it('commits the cursor row on Enter, closes, and hands focus back', async () => {
      const { onChange, user } = setup();
      combobox().focus();

      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('stagenet');
      expect(listbox()).toBeNull();
      expect(document.activeElement).toBe(combobox());
    });

    it('shows what was picked once the value comes back', async () => {
      const user = userEvent.setup();
      render(<Controlled />);
      combobox().focus();

      await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');

      expect(combobox()).toHaveTextContent('Stagenet');
    });

    it('closes on Escape without picking anything', async () => {
      const { onChange, user } = setup();
      combobox().focus();

      await user.keyboard('{ArrowDown}{ArrowDown}{Escape}');

      expect(onChange).not.toHaveBeenCalled();
      expect(listbox()).toBeNull();
      expect(document.activeElement).toBe(combobox());
    });

    /**
     * The regression this component was rebuilt for.
     *
     * The list is portalled to document.body, after everything the app rendered. If its rows were
     * focusable, Tab from the trigger would walk the rest of the page before reaching the first
     * option — so the next control, here "Submit", would be one Enter away while the user believed
     * they were choosing a row.
     */
    it('leaves on Tab like a real select: the list closes and focus goes to the next control', async () => {
      const { onChange, user } = setup();
      combobox().focus();
      await user.keyboard('{ArrowDown}');
      expect(screen.getAllByRole('option')).toHaveLength(3);

      await user.tab();

      expect(listbox()).toBeNull();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Submit' }));
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps the rows out of the tab order while the list is open', async () => {
      const { user } = setup();

      await user.click(combobox());

      for (const option of screen.getAllByRole('option')) {
        expect(option).toHaveAttribute('tabindex', '-1');
      }
      expect(document.activeElement).toBe(combobox());
    });

    it('opens straight at an entry typed by its first letters', async () => {
      const { user } = setup();
      combobox().focus();

      await user.keyboard('st');

      expect(listbox()).not.toBeNull();
      expect(activeOptionName()).toBe('Stagenet');
    });

    // Keystrokes close together build one search, as in a native select — so a letter repeated
    // cannot mean "find 'tt'", which matches nothing. It walks the entries sharing that letter.
    it('walks the entries sharing a first letter when that letter is repeated', async () => {
      const { user } = setup({
        value: 'mainnet',
        options: [
          { value: 'mainnet', label: 'Mainnet' },
          { value: 'testnet', label: 'Testnet' },
          { value: 'testnet2', label: 'Testnet 2' },
        ],
      });
      combobox().focus();

      await user.keyboard('t');
      expect(activeOptionName()).toBe('Testnet');

      await user.keyboard('t');
      expect(activeOptionName()).toBe('Testnet 2');

      await user.keyboard('t');
      expect(activeOptionName()).toBe('Testnet');
    });
  });

  describe('mouse', () => {
    it('still picks a row on click', async () => {
      const { onChange, user } = setup();

      await user.click(combobox());
      await user.click(screen.getByRole('option', { name: 'Mainnet' }));

      expect(onChange).toHaveBeenCalledWith('mainnet');
      expect(listbox()).toBeNull();
    });

    it('closes on a click outside without picking', async () => {
      const { onChange, user } = setup();

      await user.click(combobox());
      await user.click(document.body);

      expect(listbox()).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('moves the same cursor the keyboard moves, so Enter cannot take a different row', async () => {
      const { onChange, user } = setup();

      await user.click(combobox());
      await user.hover(screen.getByRole('option', { name: 'Mainnet' }));
      expect(activeOptionName()).toBe('Mainnet');

      combobox().focus();
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('mainnet');
    });
  });

  describe('the rest of the surface', () => {
    /**
     * Opening the list used to build an id selector, and `useId` produces ids containing colons,
     * so it needed `CSS.escape`. `CSS` is not a given: the jsdom this package tests under provides
     * it, the newer one a consumer was on did not, and the list threw a TypeError from inside this
     * package the moment it opened — which is how it was found, in someone else's test suite.
     *
     * The global is deleted here rather than trusted to be absent, so the test fails in THIS
     * environment too. Without that it would pass for the wrong reason, exactly as the original
     * suite did.
     */
    it('opens without CSS.escape, which not every environment has', async () => {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'CSS');
      // @ts-expect-error — removing a DOM global on purpose
      delete globalThis.CSS;
      try {
        const { user } = setup();
        await user.click(combobox());
        expect(optionNames()).toEqual(['Mainnet', 'Testnet', 'Stagenet']);
      } finally {
        if (descriptor) Object.defineProperty(globalThis, 'CSS', descriptor);
      }
    });

    it('lists every option it was given, in order', async () => {
      const { user } = setup();

      await user.click(combobox());

      expect(optionNames()).toEqual(['Mainnet', 'Testnet', 'Stagenet']);
    });

    it('shows the placeholder when the value matches nothing, and still opens', async () => {
      const { user } = setup({ value: 'nope', placeholder: 'Select a network' });

      expect(combobox()).toHaveTextContent('Select a network');

      await user.click(combobox());
      expect(activeOptionName()).toBe('Mainnet');
      expect(screen.queryAllByRole('option', { selected: true })).toHaveLength(0);
    });

    it('cannot be opened when it is disabled', async () => {
      const { onChange, user } = setup({ disabled: true });

      expect(combobox()).toBeDisabled();
      await user.click(combobox());
      expect(listbox()).toBeNull();

      combobox().focus();
      await user.keyboard('{ArrowDown}{Enter}');
      expect(listbox()).toBeNull();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
