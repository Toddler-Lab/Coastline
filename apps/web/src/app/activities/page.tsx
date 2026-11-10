import type { Metadata } from 'next';
import { Waves } from 'lucide-react';
import { UnderDevelopmentModule } from '@/components/ui/under-development-module';

export const metadata: Metadata = {
  title: 'Water Sports & Beach Activities (Coming Soon)',
  description: 'Jet ski rentals, parasailing, surfing lessons, and sea adventures in Cox’s Bazar.',
};

export default function ActivitiesPage() {
  return (
    <UnderDevelopmentModule
      moduleKey="activities"
      title="Water Sports & Activities"
      bengaliTitle="ওয়াটার স্পোর্টস ও সী এডভেঞ্চার"
      icon={Waves}
      tagline="Licensed Jet skis, parasailing flights, surfboard rentals & certified coastal instructors."
      description="Experience thrilling Bay of Bengal water sports with certified life jackets, coast guard safety standards, and transparent hourly packages at Laboni, Sugandha, and Inani."
      phaseLabel="Phase 3 · Slot Booking"
      indicativeTariff="BDT 800 – 3,500 / session"
      mockStats={[
        { label: 'Licensed Jet Skis', value: '45 Crafts' },
        { label: 'Certified Lifeguards', value: 'Sea Safe Audited' },
        { label: 'Safety Zones', value: 'Designated Corridors' },
        { label: 'Booking Model', value: 'Slot Capacity' },
      ]}
      highlights={[
        {
          title: 'Jet Ski Wave Running',
          desc: '15-minute and 30-minute high-speed wave excursions with experienced pilots or solo riding under instructor supervision.',
          badge: 'High Adrenaline',
        },
        {
          title: 'Coastal Parasailing',
          desc: 'Tethered speedboat parasailing flights over the Bay of Bengal surf with certified harnesses and dual-camera video recording.',
          badge: 'Aerial View',
        },
        {
          title: 'Surfing & Bodyboarding',
          desc: 'Learn from local Cox’s Bazar champion surfers: rental boards, beginner surf classes, and morning wave forecasts.',
          badge: 'Surf Academy',
        },
        {
          title: 'Speed Boat Bay Tours',
          desc: 'Guided coastal speed boat rides around Maheshkhali channel and Sonadia island viewpoints with safety jackets included.',
          badge: 'Island Excursion',
        },
        {
          title: 'Safety Equipment Standards',
          desc: 'Mandatory ISO-certified life jackets, kill-switch cords on all watercraft, and strict clearance from swimming zones.',
          badge: 'Safety First',
        },
        {
          title: 'Tide & Surf Forecast Alerts',
          desc: 'Real-time tide charts (high tide / low tide) and red-flag danger warnings directly integrated with your session booking.',
        },
      ]}
    />
  );
}
