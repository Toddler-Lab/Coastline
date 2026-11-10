import type { Metadata } from 'next';
import { Utensils } from 'lucide-react';
import { UnderDevelopmentModule } from '@/components/ui/under-development-module';

export const metadata: Metadata = {
  title: 'Beach Dining & Food (Coming Soon)',
  description: 'Cox’s Bazar beachside seafood, authentic local dining, and hygienic street food directory.',
};

export default function FoodPage() {
  return (
    <UnderDevelopmentModule
      moduleKey="food"
      title="Food & Beach Dining"
      bengaliTitle="সি-ফুড ও রেস্তোরাঁ সেবা"
      icon={Utensils}
      tagline="Authentic Bay of Bengal fresh seafood, hygienic vendor standards & fixed price menus."
      description="Discover verified seafood kitchens, traditional Bengali cuisine, and licensed beach stalls across Sugandha Point, Laboni Market, and Kolatoli with authentic ingredient checks."
      phaseLabel="Phase 3 · Vendor Directory"
      indicativeTariff="BDT 180 – 1,200 / meal"
      mockStats={[
        { label: 'Seafood Kitchens', value: '85+ Vendors' },
        { label: 'Hygiene Inspections', value: 'Monthly Audit' },
        { label: 'Menu Standards', value: 'Fixed Price Rules' },
        { label: 'Ordering Mode', value: 'QR Dine-in / Takeaway' },
      ]}
      highlights={[
        {
          title: 'Fresh Catch Quality Grades',
          desc: 'Koral, Rupchanda, Vetki, Lobster, and Crab with daily market pricing benchmarks and weight measurement enforcement.',
          badge: 'Daily Market Rate',
        },
        {
          title: 'Hygienic Beach Food Stalls',
          desc: 'Licensed kitkot snack stalls and evening seafood fry shops verified by the district tourism health taskforce.',
          badge: 'Health Certified',
        },
        {
          title: 'Direct Sunbed Delivery',
          desc: 'Order coconut water, hot tea, snacks, and lunch directly delivered to your booked sunbed via QR code on your bed ticket.',
          badge: 'Kitkot Service',
        },
        {
          title: 'Transparent Weight Billing',
          desc: 'Digital weighing scale compliance check: fish and seafood weighed live in front of the customer before cooking.',
          badge: 'No Scams',
        },
        {
          title: 'Local Delicacies & Shutki',
          desc: 'Authentic Cox’s Bazar Loitta fry, Shutki bhorta, and traditional coastal recipes with local restaurant recommendations.',
        },
        {
          title: 'Evening Food Street Map',
          desc: 'Interactive food map of Sugandha and Kolatoli evening night market strips with opening hours and seating capacity.',
        },
      ]}
    />
  );
}
