import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.orders.title');

export default function OrdersPage() {
  return <PlaceholderPage titleKey="pages.orders.title" />;
}
