'use client';

import { Button } from '@kairos/ui';
import type { KeyboardEvent, PointerEvent, ReactNode, TouchEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroCarouselSlide = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  cta?: { label: string; href: string };
  image?: ReactNode;
  textPosition?: 'left' | 'center' | 'right';
};

function clientXOf(event: PointerEvent<HTMLDivElement>): number {
  return event.clientX || event.nativeEvent.clientX || 0;
}

/**
 * Storefront-local hero carousel. The UI primitive’s swipe does not capture the pointer,
 * so a real touch drag never commits. Keyboard lives on the region so arrows work without
 * relying on a clipped toolbar. Overflow stays on the photo frame so focus rings are not cut.
 */
export function HeroCarousel({
  slides,
  label,
  previousLabel,
  nextLabel,
  pauseLabel,
  playLabel,
  slideLabel,
  autoPlayMs = 7000,
}: {
  slides: readonly HeroCarouselSlide[];
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
  const pointerId = useRef<number | null>(null);
  const pointerStart = useRef<number | null>(null);
  const pointerLast = useRef<number | null>(null);
  const gestureSource = useRef<'pointer' | 'touch' | null>(null);
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

  function commitSwipe(start: number | null, end: number | null) {
    pointerId.current = null;
    pointerStart.current = null;
    pointerLast.current = null;
    gestureSource.current = null;

    if (start == null || end == null) {
      return;
    }

    const delta = start - end;
    if (Math.abs(delta) < 36) {
      return;
    }

    if (delta > 0) {
      go(index + 1);
    } else {
      go(index - 1);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    gestureSource.current = 'pointer';
    pointerId.current = event.pointerId;
    pointerStart.current = clientXOf(event);
    pointerLast.current = clientXOf(event);

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* jsdom has no pointer capture */
    }
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (gestureSource.current !== 'pointer' || pointerId.current !== event.pointerId) {
      return;
    }

    pointerLast.current = clientXOf(event);
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>) {
    if (gestureSource.current !== 'pointer' || pointerId.current !== event.pointerId) {
      return;
    }

    const start = pointerStart.current;
    const end = clientXOf(event) || pointerLast.current;

    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* jsdom */
    }

    commitSwipe(start, end);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (gestureSource.current === 'pointer') {
      return;
    }

    const touch = event.changedTouches[0] ?? event.touches[0];
    if (!touch) {
      return;
    }

    gestureSource.current = 'touch';
    pointerId.current = touch.identifier;
    pointerStart.current = touch.clientX;
    pointerLast.current = touch.clientX;
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (gestureSource.current !== 'touch') {
      return;
    }

    const touch = event.touches[0] ?? event.changedTouches[0];
    if (!touch) {
      return;
    }

    pointerLast.current = touch.clientX;
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (gestureSource.current !== 'touch') {
      return;
    }

    const touch = event.changedTouches[0];
    commitSwipe(pointerStart.current, touch?.clientX ?? pointerLast.current);
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
    /* WAI-ARIA carousel: the region is the arrow-key / swipe surface. */
    /* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      tabIndex={0}
      data-surface="inverse"
      data-slide={current.id}
      data-testid="hero-carousel"
      className="bg-botanical text-ivory relative overflow-visible rounded-xl"
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        className="hero-carousel-frame relative overflow-hidden rounded-xl touch-pan-y"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div aria-live="polite" className="sr-only">
          {current.title}
        </div>
        <div className="relative min-h-72 md:min-h-[28rem]">
          <div className="pointer-events-none absolute inset-0">{current.image}</div>
          <div
            className={`relative z-10 flex min-h-72 flex-col justify-end gap-3 p-6 md:min-h-[28rem] md:p-12 ${align}`}
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
        <ul className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, slideIndex) => (
            <li key={slide.id}>
              <button
                type="button"
                data-testid={`hero-slide-${slideIndex}`}
                data-current={slideIndex === index ? 'true' : 'false'}
                aria-label={slideLabel(slideIndex + 1, count)}
                aria-current={slideIndex === index ? 'true' : undefined}
                className={
                  slideIndex === index
                    ? 'bg-ivory h-2.5 w-2.5 rounded-full'
                    : 'h-2.5 w-2.5 rounded-full bg-ivory/40'
                }
                onClick={() => setIndex(slideIndex)}
              />
            </li>
          ))}
        </ul>
      </div>
      <div
        role="toolbar"
        aria-label={label}
        className="absolute right-3 bottom-3 z-30 flex items-center gap-2"
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
    </div>
    /* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */
  );
}
