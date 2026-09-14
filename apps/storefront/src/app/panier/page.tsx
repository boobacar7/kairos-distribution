import type { Metadata } from 'next';

import { CartPageView } from '../../components/cart/CartPageView';
import { t } from '../../messages/t';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: t('pages.cart.title'),
};

export default function CartPage() {
  return <CartPageView />;
}
