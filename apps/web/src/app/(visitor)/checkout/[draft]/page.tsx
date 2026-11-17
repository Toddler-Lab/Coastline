import type { Metadata } from 'next';
import { CheckoutFlow } from '@/components/flows/checkout-flow';

export const metadata: Metadata = { title: 'Checkout' };

export default async function CheckoutPage({ params }: { params: Promise<{ draft: string }> }) {
  const { draft } = await params;
  return <CheckoutFlow draftId={draft} />;
}
