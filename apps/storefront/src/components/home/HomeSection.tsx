import type { ReactNode } from 'react';

export function HomeSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titre`}
      className="px-gutter py-section md:px-gutter-lg lg:py-section-lg"
    >
      <div className="mx-auto max-w-7xl space-y-stack">
        <h2 id={`${id}-titre`} className="font-serif text-h2 text-aubergine">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}
