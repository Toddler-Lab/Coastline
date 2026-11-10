import type { Metadata } from 'next';
import { Car } from 'lucide-react';
import { UnderDevelopmentModule } from '@/components/ui/under-development-module';

export const metadata: Metadata = {
  title: 'Rides & Transport (Coming Soon)',
  description: 'Fixed-fare Tomtom auto-rickshaws, Chander Gari jeep hires, and Marine Drive rentals in Cox’s Bazar.',
};

export default function RidesPage() {
  return (
    <UnderDevelopmentModule
      moduleKey="rides"
      title="Rides & Beach Transport"
      bengaliTitle="টমটম ও পর্যটন পরিবহন সেবা"
      icon={Car}
      tagline="Fixed-fare Tomtoms, open-top Chander Gari safari jeeps & Marine Drive rentals."
      description="Transparent, government-benchmarked transportation across Cox's Bazar town, Himchari waterfalls, Inani coral beach, and Teknaf with fair distance calculations."
      phaseLabel="Phase 2 · Fare Directory"
      indicativeTariff="BDT 30 / short ride · BDT 1,800 – 4,500 / day jeep hire"
      mockStats={[
        { label: 'Tomtom Network', value: '1,200+ E-Bikes' },
        { label: 'Chander Gari Fleet', value: '180 Open Jeeps' },
        { label: 'Fixed Fare Zones', value: '6 Route Bands' },
        { label: 'Booking Model', value: 'Indicative Fare / Hail' },
      ]}
      highlights={[
        {
          title: 'Official Fixed Fare Matrix',
          desc: 'Legally benchmarked Tomtom (electric auto-rickshaw) fares per person for standard town routes to prevent tourist overcharging.',
          badge: 'Fixed Tariff',
        },
        {
          title: 'Chander Gari Day Charters',
          desc: 'Book verified 4WD open-top safari jeeps for half-day or full-day trips along the scenic 80 km Marine Drive to Inani and Teknaf.',
          badge: 'Marine Drive Safari',
        },
        {
          title: 'Airport & Bus Stand Shuttles',
          desc: 'Verified flat-rate transfers connecting Cox’s Bazar Airport (CXB) and Dolphin Circle bus terminal straight to your beach hotel.',
          badge: 'Shuttle Express',
        },
        {
          title: 'Driver Identity & Badges',
          desc: 'Every registered vehicle features a prominent QR code with verified driver license, phone number, and police clearance.',
          badge: 'Safety Verified',
        },
        {
          title: 'Scooter & Cycle Rentals',
          desc: 'Hourly and daily electric scooter and bicycle rentals for self-guided coastal cruises along the sea boulevard.',
        },
        {
          title: 'Fair Ride Estimator',
          desc: 'Instant GPS distance calculator: enter pickup and dropoff point to see the official approved fare before boarding.',
        },
      ]}
    />
  );
}
