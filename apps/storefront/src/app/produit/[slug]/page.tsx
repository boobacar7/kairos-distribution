import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.product.title');

export default function ProductPage() {
  return <PlaceholderPage titleKey="pages.product.title" />;
}
