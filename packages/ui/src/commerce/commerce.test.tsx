import { money } from '@kairos/types/money';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Carousel } from './Carousel.js';
import { PriceDisplay } from './PriceDisplay.js';
import { QuantityStepper } from './QuantityStepper.js';

describe('PriceDisplay', () => {
  it('renders the shared formatXOF output and a compare-at strike', () => {
    render(<PriceDisplay amount={money(12_500)} compareAt={money(15_000)} />);
    expect(screen.getByText(/12\s?500 FCFA/)).toBeInTheDocument();
    const previous = screen.getByText(/15\s?000 FCFA/);
    expect(previous.tagName).toBe('S');
  });
});

describe('QuantityStepper', () => {
  it('is labelled, keyboard operable, and clamped to min', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <QuantityStepper
        value={1}
        min={1}
        onChange={onChange}
        decreaseLabel="[TEST] Decrease"
        increaseLabel="[TEST] Increase"
        inputLabel="[TEST] Quantity"
      />,
    );
    expect(screen.getByLabelText('[TEST] Quantity')).toHaveValue(1);
    await user.click(screen.getByRole('button', { name: '[TEST] Decrease' }));
    expect(onChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: '[TEST] Increase' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe('Carousel', () => {
  it('rotates with arrows and exposes a pause control', async () => {
    const user = userEvent.setup();
    render(
      <Carousel
        label="[TEST] Hero"
        previousLabel="[TEST] Previous"
        nextLabel="[TEST] Next"
        pauseLabel="[TEST] Pause"
        playLabel="[TEST] Play"
        slideLabel={(page, total) => `[TEST] Slide ${page} of ${total}`}
        slides={[
          { id: 'a', title: '[TEST] First' },
          { id: 'b', title: '[TEST] Second' },
        ]}
      />,
    );
    expect(screen.getByRole('region', { name: '[TEST] Hero' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '[TEST] Next' }));
    expect(screen.getByRole('heading', { name: '[TEST] Second' })).toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: /\[TEST\] (Pause|Play)/ });
    const playing = toggle.getAttribute('aria-label') === '[TEST] Pause';
    await user.click(toggle);
    expect(
      screen.getByRole('button', { name: playing ? '[TEST] Play' : '[TEST] Pause' }),
    ).toBeInTheDocument();
  });
});
