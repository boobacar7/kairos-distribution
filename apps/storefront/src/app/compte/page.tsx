import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.account.title');

export default function AccountPage() {
  return <PlaceholderPage titleKey="pages.account.title" />;
}
