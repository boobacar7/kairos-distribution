import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cx } from '../lib/cx.js';
import { Button } from '../primitives/Button.js';

export type CarouselSlide = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  cta?: { label: string; href: string };
  image?: ReactNode;
  textPosition?: 'left' | 'center' | 'right';
};

export function Carousel({
  slides,
  label,
  previousLabel,
  nextLabel,
  pauseLabel,
  playLabel,
  slideLabel,
  autoPlayMs = 7000,
}: {
  slides: readonly CarouselSlide[];
  label: string;
  previousLabel: string;
  nextLabel: string;
  pauseLabel: string;
  playLabel: string;
  slideLabel: (index: number, total: number) => string;
  autoPlayMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const count = slides.length;
  const current = slides[index];

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex((next + count) % count);
    },
    [count],
  );

  useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduce || count < 2) return;
    const timer = window.setInterval(() => go(index + 1), autoPlayMs);
    return () => window.clearInterval(timer);
  }, [autoPlayMs, count, go, index, paused]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(index - 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    pointerStart.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const delta = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (delta > 40) go(index - 1);
    if (delta < -40) go(index + 1);
  }

  if (!current) {
    return null;
  }

  const align =
    current.textPosition === 'center'
      ? 'items-center text-center'
      : current.textPosition === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="bg-botanical text-ivory relative overflow-hidden rounded-xl"
      data-surface="inverse"
    >
      <div
        className="relative"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div aria-live="polite" className="sr-only">
          {current.title}
        </div>
        <div className="relative min-h-72 md:min-h-[28rem]">
          <div className="absolute inset-0">{current.image}</div>
          <div
            className={cx(
              'relative z-10 flex min-h-72 flex-col justify-end gap-3 p-6 md:min-h-[28rem] md:p-12',
              align,
            )}
          >
            <h2 className="font-serif text-h1 md:text-display">{current.title}</h2>
            {current.subtitle ? (
              <p className="text-lead max-w-xl text-ivory/90">{current.subtitle}</p>
            ) : null}
            {current.cta ? (
              <a
                href={current.cta.href}
                data-cta=""
                className="bg-coral text-ink inline-flex min-h-11 items-center rounded-md px-4 font-semibold hover:bg-coral/90"
              >
                {current.cta.label}
              </a>
            ) : null}
          </div>
        </div>
        <div
          role="toolbar"
          aria-label={label}
          className="absolute right-4 bottom-4 z-20 flex items-center gap-2"
          onKeyDown={onKeyDown}
        >
          <Button
            variant="inverse"
            size="sm"
            aria-label={paused ? playLabel : pauseLabel}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? playLabel : pauseLabel}
          </Button>
          <Button
            variant="inverse"
            size="sm"
            aria-label={previousLabel}
            onClick={() => go(index - 1)}
          >
            ←
          </Button>
          <Button variant="inverse" size="sm" aria-label={nextLabel} onClick={() => go(index + 1)}>
            →
          </Button>
        </div>
        <ul className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, slideIndex) => (
            <li key={slide.id}>
              <button
                type="button"
                aria-label={slideLabel(slideIndex + 1, count)}
                aria-current={slideIndex === index ? 'true' : undefined}
                className={cx(
                  'h-2.5 w-2.5 rounded-full',
                  slideIndex === index ? 'bg-ivory' : 'bg-ivory/40',
                )}
                onClick={() => setIndex(slideIndex)}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
