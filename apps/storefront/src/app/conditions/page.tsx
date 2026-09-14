import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage.js';

export const metadata: Metadata = placeholderMetadata('pages.terms.title');

export default function TermsPage() {
  return <PlaceholderPage titleKey="pages.terms.title" />;
}
