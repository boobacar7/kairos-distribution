import { boutiqueHref } from '../../catalog/href';
import type { ProductListQuery } from '@kairos/validation/catalog';
import { t } from '../../messages/t';

export function CatalogPagination({
  query,
  pageCount,
  categorySlug,
}: {
  query: ProductListQuery;
  pageCount: number;
  categorySlug?: string;
}) {
  if (pageCount <= 1) return null;
  const page = query.page;
  const pages = visiblePages(page, pageCount);

  return (
    <nav aria-label={t('catalog.page', { page })} className="flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <a
          href={boutiqueHref(query, { categorySlug, page: page - 1 })}
          className="border-botanical text-botanical inline-flex min-h-11 items-center rounded-md border px-3 text-body-sm font-semibold"
        >
          {t('catalog.previous')}
        </a>
      ) : (
        <span className="text-botanical/40 inline-flex min-h-11 items-center px-3 text-body-sm">
          {t('catalog.previous')}
        </span>
      )}
      <ul className="flex flex-wrap gap-1">
        {pages.map((item) => (
          <li key={item}>
            {item === page ? (
              <span
                aria-current="page"
                className="bg-botanical text-ivory inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-body-sm font-semibold"
              >
                {item}
              </span>
            ) : (
              <a
                href={boutiqueHref(query, { categorySlug, page: item })}
                aria-label={t('catalog.page', { page: item })}
                className="text-botanical inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-3 text-body-sm font-semibold hover:bg-soft-green"
              >
                {item}
              </a>
            )}
          </li>
        ))}
      </ul>
      {page < pageCount ? (
        <a
          href={boutiqueHref(query, { categorySlug, page: page + 1 })}
          className="border-botanical text-botanical inline-flex min-h-11 items-center rounded-md border px-3 text-body-sm font-semibold"
        >
          {t('catalog.next')}
        </a>
      ) : (
        <span className="text-botanical/40 inline-flex min-h-11 items-center px-3 text-body-sm">
          {t('catalog.next')}
        </span>
      )}
    </nav>
  );
}

function visiblePages(page: number, pageCount: number): number[] {
  const windowSize = 5;
  const start = Math.max(1, Math.min(page - 2, pageCount - windowSize + 1));
  const end = Math.min(pageCount, start + windowSize - 1);
  const pages: number[] = [];
  for (let item = Math.max(1, start); item <= end; item += 1) {
    pages.push(item);
  }
  return pages;
}
