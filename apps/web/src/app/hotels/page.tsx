import type { Metadata } from 'next';
import { Hotel } from 'lucide-react';
import { UnderDevelopmentModule } from '@/components/ui/under-development-module';

export const metadata: Metadata = {
  title: 'Hotels & Stays (Coming Soon)',
  description: 'Verified coastal hotel and guesthouse referral directory in Cox’s Bazar.',
};

export default function HotelsPage() {
  return (
    <UnderDevelopmentModule
      moduleKey="hotels"
      title="Hotels & Stays"
      bengaliTitle="হোটেল ও রিসোর্ট ডিরেক্টরি"
      icon={Hotel}
      tagline="Government-audited coastal accommodations, transparent rates & referral registry."
      description="Smart Cox's Bazar will aggregate hotels, guesthouses, and resorts across Kolatoli, Sugandha, Laboni, and Marine Drive with verified tariff baselines and authentic amenities."
      phaseLabel="Phase 2 · Referral Directory"
      indicativeTariff="BDT 2,500 – 18,000 / night"
      mockStats={[
        { label: 'Registered Hotels', value: '140+ Properties' },
        { label: 'Tariff Transparency', value: '100% Verified' },
        { label: 'Location Zones', value: '4 Key Areas' },
        { label: 'Booking Model', value: 'Inquiry & Referral' },
      ]}
      highlights={[
        {
          title: 'Verified Room Tariffs',
          desc: 'Indicative seasonal pricing published with full review provenance to eliminate price gouging during peak tourist seasons.',
          badge: 'Tariff Engine',
        },
        {
          title: 'Direct Hotel Inquiries',
          desc: 'Verified telephone, WhatsApp, and official reservation portals with direct contact and no middleman commission.',
          badge: 'Direct Connect',
        },
        {
          title: 'Beach Distance & Zone Tags',
          desc: 'Clear distance from authentic beach points (Kolatoli, Sugandha, Laboni, Inani) with map pins and verified sea-view ratings.',
          badge: 'Geo-Tagged',
        },
        {
          title: 'Safety & License Verification',
          desc: 'Displaying tourist police registry number, local municipality trade license, and emergency fire safety compliance status.',
          badge: 'Governance',
        },
        {
          title: 'Amenity Audits',
          desc: 'Standardized badges for generator backup, Wi-Fi speed, dedicated parking, elevator access, and complimentary breakfast.',
        },
        {
          title: 'Zero Hidden Fees',
          desc: 'Clear breakdown of VAT, municipality tax, and service charges before booking confirmation.',
        },
      ]}
    />
  );
}
