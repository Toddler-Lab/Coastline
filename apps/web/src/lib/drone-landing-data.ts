export interface DroneSpot {
  id: string;
  name: string;
  bn: string;
  kind: string;
  img: string;
  svc: string[];
  know: string[];
}

export interface DroneDestination {
  id: string;
  aliases?: string[];
  name: string;
  bn: string;
  accent: string;
  kind: string;
  tag: string;
  tagBn: string;
  hero: string;
  card?: string;
  video?: string;
  coord: string;
  alt: string;
  best: string;
  getThere: string;
  pin: 'coxs' | 'coxs-bazar' | 'sylhet' | 'rangamati' | 'sundarbans' | 'bandarban' | 'dhaka';
  spots: DroneSpot[];
}

export const DRONE_DESTINATIONS: DroneDestination[] = [
  {
    id: 'coxs-bazar',
    aliases: ['coxs'],
    name: "Cox's Bazar",
    bn: 'কক্সবাজার',
    accent: '#0B7A8F',
    kind: 'SEA',
    tag: 'Sea, sand and the Marine Drive',
    tagBn: 'সমুদ্র, বালুকাবেলা আর মেরিন ড্রাইভ',
    hero: 'hero_saintmartin_sunrise',
    card: 'coxs_himchari_aerial',
    coord: '21.43°N 91.98°E',
    alt: '120',
    best: 'November – March',
    getThere: 'Fly or take the overnight bus from Dhaka',
    pin: 'coxs-bazar',
    spots: [
      {
        id: 'laboni-beach',
        name: 'Laboni Beach',
        bn: 'লাবণী সৈকত',
        kind: 'BEACH',
        img: 'coxs_laboni',
        svc: ['sunbed', 'food', 'camera'],
        know: [
          'The classic viewpoint: gently sloping sand, shells, and a short walk from town.',
          'Popular for morning walks and shell markets.',
          'Follow safety flags on swimming conditions.',
        ],
      },
      {
        id: 'sugandha-beach',
        name: 'Sugandha Beach',
        bn: 'সুগন্ধা সৈকত',
        kind: 'BEACH',
        img: 'coxs_sugandha',
        svc: ['sunbed', 'food', 'camera', 'stay'],
        know: [
          'The busy town-end stretch, closest to hotels and evening food stalls.',
          'Front-row beach umbrella slots can be booked by the hour.',
          'Always swim near lifeguard-monitored zones.',
        ],
      },
      {
        id: 'kolatoli-beach',
        name: 'Kolatoli Beach',
        bn: 'কলাতলী সৈকত',
        kind: 'BEACH',
        img: 'coxs_kolatoli',
        svc: ['sunbed', 'food', 'camera', 'stay'],
        know: [
          'Wide open sand with the main lifeguard tower and the busiest sunbed line.',
          'Easy access from the hotel strip and rickshaw drop-off.',
          'Watch the sunset with fresh green coconut and seafood.',
        ],
      },
      {
        id: 'himchari',
        name: 'Himchari',
        bn: 'হিমছড়ি',
        kind: 'HILL',
        img: 'coxs_himchari_aerial',
        svc: ['ride', 'ticket', 'food', 'camera'],
        know: [
          'Steep steps to the viewpoint — wear proper shoes.',
          'The waterfall is strongest in the monsoon.',
          'Marine Drive rides are cheapest shared; agree the fare first.',
        ],
      },
      {
        id: 'inani-coral-beach',
        name: 'Inani Beach',
        bn: 'ইনানী সৈকত',
        kind: 'BEACH',
        img: 'coxs_inani',
        svc: ['sunbed', 'food', 'ride', 'camera'],
        know: [
          'Rocky shallows and coral stones at low tide — watch your footing.',
          'Swim only near lifeguard flags.',
          'Sunset is the busiest hour for photographers.',
        ],
      },
      {
        id: 'teknaf-beach',
        name: 'Teknaf Beach',
        bn: 'টেকনাফ সৈকত',
        kind: 'BEACH',
        img: 'coxs_himchari_coast',
        svc: ['ride', 'food', 'guide'],
        know: [
          'The far southern tip where Marine Drive ends near the Naf river mouth.',
          'Quiet beaches and mangrove edges.',
          'Avoid riding after dark on unlit stretches.',
        ],
      },
      {
        id: 'saintmartin',
        name: "Saint Martin's Island",
        bn: 'সেন্ট মার্টিন দ্বীপ',
        kind: 'ISLAND',
        img: 'coxs_saintmartin',
        svc: ['boat', 'stay', 'food', 'camera'],
        know: [
          'Boats run in the dry season only — check the alert before you travel.',
          'Coral is fragile: do not stand on or collect it.',
          'Carry cash; card machines are rare on the island.',
        ],
      },
      {
        id: 'marine',
        name: 'Marine Drive coast',
        bn: 'মেরিন ড্রাইভ',
        kind: 'BEACH',
        img: 'coxs_himchari_coast',
        svc: ['ride', 'tour', 'food'],
        know: [
          'The coastal road runs south to Teknaf.',
          'Stops at Himchari and Inani on the way.',
          'Avoid riding after dark on unlit stretches.',
        ],
      },
    ],
  },
  {
    id: 'sylhet',
    name: 'Sylhet',
    bn: 'সিলেট',
    accent: '#2F7D32',
    kind: 'FOREST',
    tag: 'Tea hills, swamp forest and stone rivers',
    tagBn: 'চা-বাগান, জলাবন আর পাথুরে নদী',
    hero: 'sylhet_ratargul_boats',
    coord: '24.89°N 91.87°E',
    alt: '90',
    best: 'July – October for the swamp forest',
    getThere: 'Fly, train or bus from Dhaka',
    pin: 'sylhet',
    spots: [
      {
        id: 'ratargul',
        name: 'Ratargul Swamp Forest',
        bn: 'রাতারগুল জলাবন',
        kind: 'FOREST',
        img: 'sylhet_ratargul_aerial',
        svc: ['boat', 'guide', 'camera'],
        know: [
          'The forest floods mainly in the monsoon; in the dry months it is mostly on foot.',
          'Wooden boats are the way in — agree the time and fare first.',
          'Keep noise low; this is a protected forest.',
        ],
      },
      {
        id: 'jaflong',
        name: 'Jaflong',
        bn: 'জাফলং',
        kind: 'RIVER',
        img: 'sylhet_jaflong',
        svc: ['boat', 'ride', 'food', 'camera'],
        know: [
          'The river is close to the border — follow posted limits.',
          'Currents get strong after rain.',
          'Combine with Lalakhal on a day trip.',
        ],
      },
      {
        id: 'bichanakandi',
        name: 'Bichanakandi',
        bn: 'বিছানাকান্দি',
        kind: 'RIVER',
        img: 'sylhet_bichanakandi',
        svc: ['boat', 'ride', 'food', 'camera'],
        know: [
          'A shallow river of clear stones where hill streams meet the border.',
          'Best reached by boat from Gowainghat during monsoon and post-monsoon.',
          'Follow border safety markers and do not cross border lines.',
        ],
      },
      {
        id: 'tea',
        name: 'Malnicherra Tea Estate',
        bn: 'মালনীছড়া চা-বাগান',
        kind: 'TEA_GARDEN',
        img: 'sylhet_tea',
        svc: ['guide', 'ride', 'camera'],
        know: [
          'Working estate — stay on the paths.',
          'Ask before photographing tea workers.',
          'Early morning has the softest light.',
        ],
      },
    ],
  },
  {
    id: 'rangamati',
    name: 'Rangamati',
    bn: 'রাঙ্গামাটি',
    accent: '#2457A6',
    kind: 'LAKE',
    tag: 'Kaptai Lake and the hill tracts',
    tagBn: 'কাপ্তাই হ্রদ আর পাহাড়ি জনপদ',
    hero: 'rangamati_kaptai_islands',
    video: 'rangamati_floating_market',
    coord: '22.65°N 92.18°E',
    alt: '150',
    best: 'October – March',
    getThere: 'Bus from Chattogram or Dhaka',
    pin: 'rangamati',
    spots: [
      {
        id: 'kaptai-lake',
        name: 'Kaptai Lake',
        bn: 'কাপ্তাই হ্রদ',
        kind: 'LAKE',
        img: 'rangamati_kaptai_lake',
        svc: ['boat', 'tour', 'food', 'camera'],
        know: [
          'Hire boats from the main ghats; life jackets should be on board.',
          'Island restaurants close early.',
          'Floating fruit markets are busiest on market mornings.',
        ],
      },
      {
        id: 'hanging-bridge',
        name: 'Hanging Bridge',
        bn: 'ঝুলন্ত সেতু',
        kind: 'HERITAGE',
        img: 'rangamati_hanging_bridge',
        svc: ['ticket', 'boat', 'camera'],
        know: [
          'Can be partly under water at very high lake levels.',
          'Small entry ticket at the gate.',
          'Crowded on holidays — go early.',
        ],
      },
      {
        id: 'rajban-vihara',
        name: 'Rajban Vihara',
        bn: 'রাজবন বিহার',
        kind: 'HERITAGE',
        img: 'rangamati_kaptai_islands',
        svc: ['ticket', 'guide', 'tour'],
        know: [
          'An active Buddhist monastery and meditation centre — dress modestly.',
          'Remove footwear before entering temple pavilions.',
          'Morning and late afternoon are the best times to visit peacefully.',
        ],
      },
      {
        id: 'sajek',
        name: 'Sajek Valley',
        bn: 'সাজেক ভ্যালি',
        kind: 'HILL',
        img: 'rangamati_sajek',
        svc: ['stay', 'ride', 'food', 'guide'],
        know: [
          'Reached by jeep convoy — check convoy times.',
          'Cloud views are best at sunrise.',
          'Book stays ahead on weekends.',
        ],
      },
    ],
  },
  {
    id: 'bandarban',
    name: 'Bandarban',
    bn: 'বান্দরবান',
    accent: '#8A5A1F',
    kind: 'HILL',
    tag: 'Above the clouds in the hill tracts',
    tagBn: 'মেঘের ওপরে পাহাড়ের দেশ',
    hero: 'bandarban_golden_temple',
    coord: '22.19°N 92.22°E',
    alt: '300',
    best: 'October – February',
    getThere: 'Bus from Dhaka or Chattogram',
    pin: 'bandarban',
    spots: [
      {
        id: 'temple',
        name: 'Buddha Dhatu Jadi',
        bn: 'বুদ্ধ ধাতু জাদি',
        kind: 'HERITAGE',
        img: 'bandarban_golden_temple',
        svc: ['ticket', 'guide', 'ride'],
        know: [
          'A place of worship — dress modestly and remove shoes where asked.',
          'Visiting hours are limited.',
          'Photography may be restricted inside.',
        ],
      },
      {
        id: 'nilgiri',
        name: 'Nilgiri',
        bn: 'নীলগিরি',
        kind: 'HILL',
        img: 'bandarban_nilgiri',
        svc: ['stay', 'ride', 'food', 'camera'],
        know: [
          'Hill roads are steep and winding — hire an experienced driver.',
          'Cloud views are best early morning.',
          'Carry a jacket in winter.',
        ],
      },
      {
        id: 'boga',
        name: 'Boga Lake',
        bn: 'বগা লেক',
        kind: 'LAKE',
        img: 'bandarban_boga',
        svc: ['guide', 'stay', 'food'],
        know: [
          'A guide is usually required for the trek.',
          'Register at the checkpoints on the way.',
          'Basic stays only — bring essentials.',
        ],
      },
    ],
  },
  {
    id: 'sundarbans',
    name: 'Sundarbans',
    bn: 'সুন্দরবন',
    accent: '#2F7D32',
    kind: 'FOREST',
    tag: 'The great mangrove forest, by boat',
    tagBn: 'নৌকায় বিশাল ম্যানগ্রোভ বন',
    hero: 'sundarbans_aerial',
    coord: '22.00°N 89.40°E',
    alt: '200',
    best: 'November – February',
    getThere: 'Boat tours from Khulna or Mongla',
    pin: 'sundarbans',
    spots: [
      {
        id: 'east',
        name: 'Sundarbans East',
        bn: 'সুন্দরবন পূর্ব',
        kind: 'FOREST',
        img: 'sundarbans_aerial',
        svc: ['tour', 'boat', 'guide'],
        know: [
          'Entry is by permitted tour boats only.',
          'Stay with your group on land; this is tiger country.',
          'Carry insect repellent.',
        ],
      },
      {
        id: 'channels',
        name: 'Mangrove channels',
        bn: 'ম্যানগ্রোভ খাল',
        kind: 'RIVER',
        img: 'sundarbans_forest',
        svc: ['boat', 'tour', 'camera'],
        know: [
          'Small boats explore narrow creeks at high tide.',
          'Watch for crocodiles near mudflats.',
          'Early morning is best for birds and deer.',
        ],
      },
    ],
  },
];

export interface DroneSlide {
  id: string;
  name: string;
  bn: string;
  coord: string;
  alt: string;
  video?: string;
  poster?: string;
  img?: string;
}

export const DRONE_SLIDES: DroneSlide[] = [
  {
    id: 'bd',
    name: 'Bangladesh',
    bn: 'বাংলাদেশ',
    video: 'bd_cinematic',
    poster: 'bd_cinematic_poster',
    coord: '23.68°N 90.35°E',
    alt: '400',
  },
  ...DRONE_DESTINATIONS.map((d) => ({
    id: d.id,
    name: d.name,
    bn: d.bn,
    img: d.hero,
    coord: d.coord,
    alt: d.alt,
    video: d.video,
    poster: d.video ? `${d.video}_poster` : undefined,
  })),
];

export const PIN_COORDINATES: Record<string, [number, number]> = {
  'coxs-bazar': [341, 456],
  coxs: [341, 456],
  sylhet: [332, 158],
  rangamati: [357, 352],
  sundarbans: [137, 407],
  bandarban: [360, 407],
  dhaka: [217, 252],
};

export interface RegionSpotMarker {
  id: string;
  name: string;
  nameBn: string;
  x: number;
  y: number;
  kind: string;
}

export interface RegionMapZone {
  id: string;
  name: string;
  nameBn: string;
  kind: string;
  color: string;
  gradient: [string, string];
  path: string;
  center: [number, number];
  spots: RegionSpotMarker[];
}

export const REGION_MAP_ZONES: Record<string, RegionMapZone> = {
  'coxs-bazar': {
    id: 'coxs-bazar',
    name: "Cox's Bazar Shoreline",
    nameBn: 'কক্সবাজার উপকূলীয় করিডোর',
    kind: 'SEA',
    color: '#0B7A8F',
    gradient: ['#0B7A8F', '#14B8A6'],
    path: 'M 334,372 C 348,366 375,372 384,375 C 388,405 389,442 388,465 C 389,482 382,492 368,510 C 361,507 354,495 346,472 C 338,446 336,424 332,408 C 328,392 328,380 334,372 Z',
    center: [356, 436],
    spots: [
      { id: 'laboni-beach', name: 'Laboni Beach', nameBn: 'লাবণী সৈকত', x: 342, y: 400, kind: 'BEACH' },
      { id: 'sugandha-beach', name: 'Sugandha Beach', nameBn: 'সুগন্ধা সৈকত', x: 348, y: 414, kind: 'BEACH' },
      { id: 'kolatoli-beach', name: 'Kolatoli Beach', nameBn: 'কলাতলী সৈকত', x: 351, y: 426, kind: 'BEACH' },
      { id: 'himchari', name: 'Himchari', nameBn: 'হিমছড়ি', x: 356, y: 448, kind: 'HILL' },
      { id: 'inani-coral-beach', name: 'Inani Coral Beach', nameBn: 'ইনানী সৈকত', x: 364, y: 472, kind: 'BEACH' },
      { id: 'teknaf-beach', name: 'Teknaf Beach', nameBn: 'টেকনাফ সৈকত', x: 372, y: 504, kind: 'BEACH' },
    ],
  },
  sylhet: {
    id: 'sylhet',
    name: 'Sylhet Highlands & Wetlands',
    nameBn: 'সিলেট হাওর ও চা-বাগান অঞ্চল',
    kind: 'FOREST',
    color: '#2F7D32',
    gradient: ['#2F7D32', '#10B981'],
    path: 'M 264,134 C 290,132 338,133 365,138 C 380,146 384,160 374,178 C 360,195 352,210 338,220 C 320,228 300,230 286,242 C 274,235 272,215 264,195 C 260,170 262,145 264,134 Z',
    center: [320, 180],
    spots: [
      { id: 'ratargul', name: 'Ratargul Swamp Forest', nameBn: 'রাতারগুল জলাবন', x: 302, y: 168, kind: 'FOREST' },
      { id: 'jaflong', name: 'Jaflong River', nameBn: 'জাফলং', x: 348, y: 154, kind: 'RIVER' },
      { id: 'bichanakandi', name: 'Bichanakandi', nameBn: 'বিছনাকান্দি', x: 326, y: 146, kind: 'RIVER' },
      { id: 'tea', name: 'Sreemangal Tea Estates', nameBn: 'শ্রীমঙ্গল চা বাগান', x: 295, y: 218, kind: 'TEA_GARDEN' },
    ],
  },
  rangamati: {
    id: 'rangamati',
    name: 'Rangamati Lake Archipelago',
    nameBn: 'রাঙ্গামাটি কাপ্তাই হ্রদ এলাকা',
    kind: 'LAKE',
    color: '#2457A6',
    gradient: ['#2457A6', '#3B82F6'],
    path: 'M 314,268 C 336,258 360,262 368,278 C 374,302 376,325 365,342 C 350,360 336,364 322,352 C 314,335 310,310 314,288 Z',
    center: [342, 310],
    spots: [
      { id: 'kaptai-lake', name: 'Kaptai Lake', nameBn: 'কাপ্তাই হ্রদ', x: 338, y: 296, kind: 'LAKE' },
      { id: 'hanging-bridge', name: 'Hanging Bridge', nameBn: 'ঝুলন্ত সেতু', x: 344, y: 316, kind: 'LAKE' },
      { id: 'rajban-vihara', name: 'Rajban Vihara', nameBn: 'রাজবন বিহার', x: 330, y: 308, kind: 'HERITAGE' },
      { id: 'sajek', name: 'Sajek Valley', nameBn: 'সাজেক ভ্যালি', x: 356, y: 274, kind: 'HILL' },
    ],
  },
  bandarban: {
    id: 'bandarban',
    name: 'Bandarban Mountain Peaks',
    nameBn: 'বান্দরবান পর্বতমালা',
    kind: 'HILL',
    color: '#8A5A1F',
    gradient: ['#8A5A1F', '#F59E0B'],
    path: 'M 345,335 C 365,330 382,342 388,368 C 390,392 384,414 370,424 C 354,418 348,396 344,374 C 342,355 342,340 345,335 Z',
    center: [364, 375],
    spots: [
      { id: 'nilgiri', name: 'Nilgiri Clouds', nameBn: 'নীলগিরি', x: 366, y: 382, kind: 'HILL' },
      { id: 'boga', name: 'Boga Lake', nameBn: 'বগা লেক', x: 374, y: 396, kind: 'LAKE' },
      { id: 'golden-temple', name: 'Golden Temple', nameBn: 'স্বর্ণ মন্দির', x: 358, y: 350, kind: 'HERITAGE' },
    ],
  },
  sundarbans: {
    id: 'sundarbans',
    name: 'Sundarbans Mangrove Delta',
    nameBn: 'সুন্দরবন ম্যানগ্রোভ ব-দ্বীপ',
    kind: 'MANGROVE',
    color: '#1B4D3E',
    gradient: ['#1B4D3E', '#10B981'],
    path: 'M 82,365 C 105,355 145,360 178,368 C 182,390 175,418 165,432 C 142,438 118,435 98,422 C 86,410 82,385 82,365 Z',
    center: [130, 396],
    spots: [
      { id: 'katka', name: 'Katka Wildlife Beach', nameBn: 'কটকা সমুদ্র সৈকত', x: 136, y: 412, kind: 'BEACH' },
      { id: 'hiron', name: 'Hiron Point', nameBn: 'হিরণ পয়েন্ট', x: 108, y: 406, kind: 'FOREST' },
      { id: 'karamjal', name: 'Karamjal Eco Center', nameBn: 'করমজল', x: 148, y: 380, kind: 'FOREST' },
    ],
  },
};

export const BANGLADESH_PATH =
  'M109.1,399.3L109.4,391.3L108.8,383.7L102.8,363.5L98.6,353.2L99.1,349.8L98.9,348.4L97.1,335L94.6,326.8L93.2,318L99.4,305.5L96.9,303.4L89.7,301.7L83.2,299.6L81.5,296.3L84.3,283.9L80.9,279.1L76.1,274.2L74.6,272.2L72.9,269.7L70.6,263.4L75.2,250.3L81.2,235L82.3,229.1L83.5,219L83.8,215.1L83.2,211.3L76.6,207L65.2,205.1L57.2,201.4L52.4,195.8L48.4,193.5L43.6,195.2L37.3,193.1L32.2,187.5L27.6,180.7L28.2,177.5L29.3,173.3L37.6,155.7L40.7,155.1L47.8,158.4L50.7,158.6L55.3,151.6L61.8,131.7L71.2,131.7L79.5,132.5L84.9,133.4L90.6,132.8L96.3,131.1L99.4,128.7L101.1,125.5L100.6,122.8L93.4,119L90.9,116.2L88.9,108.3L86.6,105.3L72.9,104.8L65.5,101.2L61.5,98L54.7,87L45.8,79.1L37.6,77.1L34.2,74.5L32.5,70.4L33.6,64.4L36.2,58.9L37.9,52.8L44.4,44.8L52.1,37.8L55.8,33L60.7,28L61.2,25L60.4,22L56.4,18.9L53.5,17.8L53.3,16L55,10.6L59,10L66.9,14.8L74.9,22.4L79.8,29.3L79.8,34.7L82.9,35.6L86,35.8L91.4,38.2L96.9,37.5L100.3,38.8L102.6,38.4L103.4,35.3L100.9,30.7L98.9,27.3L101.1,24.1L103.7,23.5L106.5,24.3L110.3,27.2L113.1,33.3L113.7,42.7L119.7,51.1L127.9,57.2L134.2,60L141.9,62L148.4,60L151.9,54.2L150.4,48.8L151.3,44.1L153.9,41.5L158.1,41.6L161.3,45.4L170.1,65.6L168.4,74.6L170.4,99.2L168.1,115.3L168.4,118.8L169.5,121.6L171,122.6L173.5,122.6L184.4,125.7L193.5,129L204,132L218.8,134.5L228,133.6L232.8,133.6L241.9,134.3L266.4,133L286.4,132.7L294.6,134.9L301.2,135.8L323.7,134.2L346.5,133.4L358.8,138.6L372.2,146.9L379.6,153.1L381,156.6L380.1,159.6L377.6,161.3L373,161.5L362.5,157.4L360.5,158.6L360.8,166.9L360.5,168.1L358.2,175.5L351.6,192.3L350.5,199.7L349.1,201.7L347.6,202.7L342.5,203L338.5,204.2L337.1,207L334.5,212.5L332.8,218.3L330.3,220.1L324.6,216.9L320.9,217.4L316.3,218.7L311.7,221.9L308.6,225.9L304.9,227.3L294.4,226.5L292.4,227.1L290.9,230L289.8,233.6L281.5,242L278.4,255.7L276.1,264.6L276.4,271.5L283.5,289.3L288.4,312.5L290.1,314.9L291.8,315.6L292.4,315.2L292.4,310.2L292.6,304.4L294.9,303.1L297.8,304.3L300.6,309.3L303.8,318.6L307.2,322.2L312.3,323.2L318.3,321.1L322.9,317L324.6,312.3L323.4,303.5L323.1,296.8L325.7,290.5L336,280.9L337.7,278.1L336.8,270L336.8,262.3L340.8,261.9L345.9,263.1L352.5,259.3L354.5,259.3L357.3,263.2L361.9,262.6L365.3,279.1L369,293.6L369,300.7L369.6,315.5L371,327.6L373.6,330.4L376.4,336.8L379.3,344.4L381.3,348.6L382.7,362.3L384.7,372.1L387,403.1L387.8,409L388.7,412.3L388.7,440.6L389.5,452.5L391.8,462.6L392.4,466.3L389.8,469.4L387.5,470L385.3,465.1L379.9,461.5L371.9,457.6L368.7,454.9L364.5,455.9L359,461.8L356.8,467.4L357.6,475.1L359.3,482.8L363.3,487L363.6,491.9L365,498.1L367,503.8L368.2,510L366.7,510L362.2,502.2L357.9,493.7L346.8,477.5L343.4,448.4L343.1,434.1L335.7,417.2L330.5,393.8L328.6,387.7L331.1,380.1L331.7,377.3L330.3,377.9L326.3,381.7L321.4,372.4L318.3,364.1L305.2,346.6L301.5,338.9L301.2,331.4L295.8,338.9L288.1,344.3L280.4,352.3L275.3,354.7L259,356.2L249.6,345.5L236.2,319.4L234.2,313.4L235.9,298L232.8,283.5L232.8,275.7L231.9,270.6L229.7,271.8L228.5,275.2L229.1,280.6L228.2,285.3L216.6,284.4L205.4,282.3L215.1,289.9L225.4,291.7L230.8,298.6L231.7,304L231.4,309.9L226,314.3L221.1,316.8L222,322.6L228,329.6L220.5,331.7L218.8,336.4L218.5,342.8L222.3,348.6L223.7,352.9L222.8,356.8L226.2,361.1L231.4,370L232.8,376.3L230.8,385.2L228,388.6L223.4,392L212.3,403.1L206.9,415.9L202.3,421.8L196.6,422.8L194.6,420.2L189.8,416.9L189.8,410.7L191.2,405.8L200.6,393.8L195.5,395.4L189.5,398.8L180.6,405.2L177.5,397.3L175.8,389.9L175.8,380.9L182.9,367.3L174.7,374L172.4,382.5L173.5,392.4L172.4,399.4L169.2,408.6L165,414.1L157.8,417.6L154.7,423.1L149.9,427.1L149.9,419.1L148.4,408.6L143.3,383.7L142.2,389L144.7,404.5L144.7,414.5L140.7,422.5L133.1,431L127.1,432.1L123.6,431L118.2,425.6L112.5,418.1L111.4,405.9ZM275.3,392.3L266.7,398.2L269.6,362.7L275.8,376L277.5,383.1ZM307.5,374.5L303.8,377L300.3,374.9L295.8,366.6L298.1,356L299.5,354.4L301.5,357.8L304.6,365.3L306.6,370.9ZM245.6,399.6L231.9,402.5L224.8,401.6L237.9,379.2L237.6,369.1L235.6,360.9L228.8,354.4L228.5,349.6L225.4,343.2L224,335.6L231.4,333.2L237.4,337.6L238.2,339.9L239.4,346.2L242.5,352.6L252.7,365.7L252.7,373.9L249.9,393.5ZM332.5,421.5L329.7,428.4L328.3,423.4L329.4,417L330.5,413.5L331.4,413.5L333.1,417.2ZM338.5,449.1L333.7,449.6L331.4,447.1L332.5,443.5L331.1,432L335.1,430.8L337.1,431L338.5,434.2L339.4,440.4ZM235.1,324.7L236.2,328.5L231.9,326.2L228.5,323.7L226.5,320.2L229.9,318.5Z';

export function findDroneSpot(destinationSlug: string, spotSlug: string): DroneSpot | undefined {
  const normDest = destinationSlug.toLowerCase().trim();
  const normSpot = spotSlug.toLowerCase().trim();
  const dest = DRONE_DESTINATIONS.find(
    (d) => d.id === normDest || (d.aliases && d.aliases.includes(normDest)),
  );
  if (!dest) {
    for (const d of DRONE_DESTINATIONS) {
      const match = d.spots.find(
        (s) => s.id === normSpot || s.id.includes(normSpot) || normSpot.includes(s.id),
      );
      if (match) return match;
    }
    return undefined;
  }
  return dest.spots.find(
    (s) => s.id === normSpot || s.id.includes(normSpot) || normSpot.includes(s.id),
  );
}

export function findDroneDestination(destinationSlug: string): DroneDestination | undefined {
  const normDest = destinationSlug.toLowerCase().trim();
  return DRONE_DESTINATIONS.find(
    (d) => d.id === normDest || (d.aliases && d.aliases.includes(normDest)),
  );
}

