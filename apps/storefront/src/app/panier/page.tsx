import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage.js';

export const metadata: Metadata = placeholderMetadata('pages.cart.title');

export default function CartPage() {
  return <PlaceholderPage titleKey="pages.cart.title" />;
}
