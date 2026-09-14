import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.faq.title');

export default function FaqPage() {
  return <PlaceholderPage titleKey="pages.faq.title" />;
}
