// Synthetic fixtures for the UI preview. These are not bookable providers.
export const photographers = [
  {
    id: 'rafi',
    name: 'Rafi Hasan',
    location: 'Cox’s Bazar',
    spot: 'Laboni Beach',
    style: 'Couple',
    rating: 4.9,
    reviews: 126,
    response: '10 min',
    image: 'coxs_laboni',
    second: 'coxs_beach_waves',
    bio: 'Easygoing beach walks, candid moments and the last light of the day. I help you feel comfortable in front of the camera.',
    specialty: 'Sunset storyteller',
    languages: 'Bangla · English',
    mode: 'Instant Book',
  },
  {
    id: 'nila',
    name: 'Nila Rahman',
    location: 'Cox’s Bazar',
    spot: 'Inani Beach',
    style: 'Family',
    rating: 4.9,
    reviews: 84,
    response: '15 min',
    image: 'coxs_inani',
    second: 'coxs_himchari_coast',
    bio: 'Unhurried sessions for families, big and small. A little exploring, a little laughter, and photographs that feel like you.',
    specialty: 'Made for family memories',
    languages: 'Bangla · English',
    mode: 'Request only',
  },
  {
    id: 'arif',
    name: 'Arif Chowdhury',
    location: 'Sylhet',
    spot: 'Jaflong',
    style: 'Solo',
    rating: 4.8,
    reviews: 67,
    response: '20 min',
    image: 'sylhet_tea',
    second: 'sylhet_jaflong',
    bio: 'Tea gardens, quiet trails and natural portraits. Let’s find a beautiful corner of Sylhet for your story.',
    specialty: 'A different perspective',
    languages: 'Bangla · English · Hindi',
    mode: 'Instant Book',
  },
  {
    id: 'sami',
    name: 'Sami Ahmed',
    location: 'Rangamati',
    spot: 'Kaptai Lake',
    style: 'Drone',
    rating: 4.8,
    reviews: 52,
    response: '25 min',
    image: 'rangamati_kaptai_lake',
    second: 'rangamati_kaptai_islands',
    bio: 'Lakeside portraits and aerial compositions inspired by the hills. Drone sessions are subject to location permission and weather.',
    specialty: 'Stories from the hills',
    languages: 'Bangla · English',
    mode: 'Request only',
  },
] as const;

export type Photographer = (typeof photographers)[number];
export type Package = {
  id: string;
  name: string;
  unit: 'package' | 'photo' | 'hour';
  price: number;
  count: number;
  extra: number;
  duration: string;
  delivery: string;
  format: string;
};
export const packages: Package[] = [
  {
    id: 'story',
    name: 'A little beach story',
    unit: 'package',
    price: 10000,
    count: 20,
    extra: 500,
    duration: '30 minutes',
    delivery: 'Within 24 hours',
    format: 'Edited JPEG',
  },
  {
    id: 'keepers',
    name: 'Just your favourites',
    unit: 'photo',
    price: 500,
    count: 20,
    extra: 500,
    duration: '30 minutes',
    delivery: 'Within 24 hours',
    format: 'Edited JPEG',
  },
  {
    id: 'hour',
    name: 'Take your time',
    unit: 'hour',
    price: 150000,
    count: 40,
    extra: 0,
    duration: '1 hour',
    delivery: 'Within 48 hours',
    format: 'Edited JPEG + RAW',
  },
];

export const galleryImages = [
  'coxs_laboni',
  'coxs_beach_waves',
  'coxs_inani',
  'coxs_sugandha',
  'coxs_kolatoli',
  'coxs_himchari_coast',
];

export function estimatedTotal(pack: Package, count: number) {
  if (pack.unit === 'photo') return count * pack.price;
  if (pack.unit === 'hour') return pack.price;
  return pack.price + Math.max(0, count - pack.count) * pack.extra;
}
