import type { MediaRef } from '../../content/contract';

/**
 * Hero art direction: separate desktop / mobile assets (spec §6).
 * No overlay is applied — overlay opacity is an open token decision.
 */
export function HeroPicture({
  desktop,
  mobile,
  priority = false,
}: {
  desktop: MediaRef;
  mobile?: MediaRef | null;
  priority?: boolean;
}) {
  return (
    <picture>
      {mobile ? <source media="(max-width: 767px)" srcSet={mobile.url} /> : null}
      {/* Native img: art direction needs <picture>, not next/image. */}
      <img
        src={desktop.url}
        alt={desktop.alt}
        width={desktop.width ?? 1600}
        height={desktop.height ?? 900}
        className="h-full w-full object-cover"
        fetchPriority={priority ? 'high' : 'auto'}
        loading={priority ? 'eager' : 'lazy'}
      />
    </picture>
  );
}
