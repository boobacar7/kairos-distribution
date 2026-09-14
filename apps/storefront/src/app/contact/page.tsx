import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage.js';

export const metadata: Metadata = placeholderMetadata('pages.contact.title');

export default function ContactPage() {
  return <PlaceholderPage titleKey="pages.contact.title" />;
}
