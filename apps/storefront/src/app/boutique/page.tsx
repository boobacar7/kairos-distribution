import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.shop.title');

export default function BoutiquePage() {
  return <PlaceholderPage titleKey="pages.shop.title" />;
}
