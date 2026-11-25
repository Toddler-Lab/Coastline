import type { Metadata } from 'next';
import { PhotographerMarketplace } from '@/components/photographers/marketplace';

export const metadata: Metadata = {
  title: 'Find Your Photographer | Coastline',
  description:
    'Explore photography packages, plan your shoot and compare offers from local photographers. An interactive preview of the Coastline photography marketplace.',
};

export default function PhotographersPage() {
  return <PhotographerMarketplace />;
}
