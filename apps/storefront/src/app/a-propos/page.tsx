import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.about.title');

export default function AboutPage() {
  return <PlaceholderPage titleKey="pages.about.title" />;
}
