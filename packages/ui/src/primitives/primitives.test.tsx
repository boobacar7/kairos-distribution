import { money } from '@kairos/types/money';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button.js';
import { Dialog } from './Dialog.js';
import { TextField } from './Field.js';
import { NavItem, SideNav } from './Nav.js';

describe('Button', () => {
  it('exposes its label and a visible focus target', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} data-testid="save">
        [TEST] Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: '[TEST] Save' });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks interaction while loading and announces busy state', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="[TEST] Loading" onClick={onClick}>
        [TEST] Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: '[TEST] Loading' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status')).toHaveTextContent('[TEST] Loading');
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('paints the cta variant coral with ink text and a CTA focus hook', () => {
    render(<Button variant="cta">[TEST] Shop</Button>);
    const button = screen.getByRole('button', { name: '[TEST] Shop' });
    expect(button).toHaveAttribute('data-variant', 'cta');
    expect(button).toHaveAttribute('data-cta');
    expect(button.className).toContain('bg-coral');
    expect(button.className).toContain('text-ink');
  });
});

describe('NavItem', () => {
  it('uses botanical fill and ivory text for selected storefront and admin items', () => {
    render(
      <div>
        <NavItem href="#shop" current>
          [TEST] Shop
        </NavItem>
        <SideNav label="[TEST] Admin">
          <NavItem href="#orders" current inverse>
            [TEST] Orders
          </NavItem>
        </SideNav>
      </div>,
    );
    for (const name of ['[TEST] Shop', '[TEST] Orders']) {
      const link = screen.getByRole('link', { name });
      expect(link.className).toContain('bg-botanical');
      expect(link.className).toContain('text-ivory');
    }
  });
});

describe('TextField', () => {
  it('associates the label, hint and error with the input', () => {
    render(
      <TextField
        label="[TEST] Email"
        hint="[TEST] We will not share this"
        error="[TEST] Required"
        required
      />,
    );
    const input = screen.getByLabelText(/\[TEST\] Email/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/\[TEST\] Required/);
    expect(screen.getByRole('alert')).toHaveTextContent('[TEST] Required');
  });
});

describe('Dialog', () => {
  it('names the modal and closes from the labelled dismiss control', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open title="[TEST] Title" closeLabel="[TEST] Close" onClose={onClose}>
        Lorem ipsum dolor sit amet.
      </Dialog>,
    );
    expect(screen.getByRole('dialog', { name: '[TEST] Title' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '[TEST] Close' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});

describe('money display contract', () => {
  it('keeps XOF formatting out of the primitive layer', () => {
    expect(money(12_500)).toBe(12_500);
  });
});
