import { Button, SelectField, TextField } from '@kairos/ui';
import type { CatalogCategory, ProductListQuery } from '@kairos/validation/catalog';

import { boutiqueHref, boutiquePath } from '../../catalog/href';
import { t } from '../../messages/t';

export function FilterBar({
  query,
  categorySlug,
}: {
  query: ProductListQuery;
  categorySlug?: string;
}) {
  const action = boutiquePath(categorySlug);
  return (
    <form
      method="get"
      action={action}
      className="border-beige bg-ivory grid gap-3 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-4"
      role="search"
      aria-label={t('catalog.filters')}
    >
      <TextField
        name="q"
        type="search"
        label={t('catalog.search')}
        placeholder={t('catalog.searchPlaceholder')}
        defaultValue={query.q ?? ''}
        autoComplete="off"
      />
      <SelectField name="sort" label={t('catalog.sort')} defaultValue={query.sort}>
        <option value="default">{t('catalog.sort.default')}</option>
        <option value="price_asc">{t('catalog.sort.price_asc')}</option>
        <option value="price_desc">{t('catalog.sort.price_desc')}</option>
        <option value="newest">{t('catalog.sort.newest')}</option>
      </SelectField>
      <SelectField
        name="availability"
        label={t('catalog.availability')}
        defaultValue={query.availability}
      >
        <option value="all">{t('catalog.availability.all')}</option>
        <option value="in_stock">{t('catalog.availability.in_stock')}</option>
        <option value="out_of_stock">{t('catalog.availability.out_of_stock')}</option>
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          name="minPrice"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          label={t('catalog.priceMin')}
          defaultValue={query.minPrice !== undefined ? String(query.minPrice) : ''}
        />
        <TextField
          name="maxPrice"
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          label={t('catalog.priceMax')}
          defaultValue={query.maxPrice !== undefined ? String(query.maxPrice) : ''}
        />
      </div>
      <div className="flex flex-wrap items-end gap-3 md:col-span-2 lg:col-span-4">
        <Button type="submit">{t('catalog.apply')}</Button>
        <a
          href={boutiquePath(categorySlug)}
          className="text-botanical text-body-sm font-semibold underline-offset-4 hover:underline"
        >
          {t('catalog.reset')}
        </a>
      </div>
    </form>
  );
}

export function CategoryNav({
  categories,
  activeSlug,
  query,
}: {
  categories: readonly CatalogCategory[];
  activeSlug?: string;
  query: ProductListQuery;
}) {
  if (categories.length === 0) return null;
  return (
    <nav aria-label={t('catalog.categories')} className="flex flex-wrap gap-2">
      <a
        href={boutiqueHref({ ...query, page: 1 }, { categorySlug: null })}
        className={
          !activeSlug
            ? 'bg-botanical text-ivory rounded-full px-3 py-1.5 text-body-sm font-semibold'
            : 'border-beige text-botanical rounded-full border px-3 py-1.5 text-body-sm'
        }
        aria-current={!activeSlug ? 'page' : undefined}
      >
        {t('catalog.allCategories')}
      </a>
      {categories.map((category) => {
        const current = activeSlug === category.slug;
        return (
          <a
            key={category.id}
            href={boutiqueHref({ ...query, page: 1 }, { categorySlug: category.slug })}
            className={
              current
                ? 'bg-botanical text-ivory rounded-full px-3 py-1.5 text-body-sm font-semibold'
                : 'border-beige text-botanical rounded-full border px-3 py-1.5 text-body-sm'
            }
            aria-current={current ? 'page' : undefined}
          >
            {category.name}
          </a>
        );
      })}
    </nav>
  );
}
