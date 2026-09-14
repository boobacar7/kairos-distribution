import type { Metadata } from 'next';

import { PlaceholderPage, placeholderMetadata } from '../../components/shell/PlaceholderPage';

export const metadata: Metadata = placeholderMetadata('pages.returns.title');

export default function ReturnsPage() {
  return <PlaceholderPage titleKey="pages.returns.title" />;
}
