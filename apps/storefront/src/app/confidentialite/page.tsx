import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.privacy.title');

export default function PrivacyPage() {
  return <PlaceholderPage titleKey="pages.privacy.title" />;
}
