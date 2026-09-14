import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../../components/shell/PlaceholderPage.js';

export const metadata: Metadata = placeholderMetadata('pages.category.title');

export default function CategoryPage() {
  return <PlaceholderPage titleKey="pages.category.title" />;
}
