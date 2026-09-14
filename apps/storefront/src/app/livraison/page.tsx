import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage.js';

export const metadata: Metadata = placeholderMetadata('pages.delivery.title');

export default function DeliveryPage() {
  return <PlaceholderPage titleKey="pages.delivery.title" />;
}
