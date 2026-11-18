/* Coastline drone-landing prototype: content and data.
 * Mirrors the API shapes loosely (destination -> spots -> services). Prices, distances and alerts are SAMPLE data.
 * Accent values follow docs/design.md 3.2 (SEA, FOREST, LAKE, HILL). Media lives in apps/web/public/media. */
/* ======================= DATA ======================= */
const MEDIA = window.COASTLINE_MEDIA || '../../apps/web/public/media/';
const IMG = k => `${MEDIA}places/${k}.webp`;
const ICON = {
  stay:'<path d="M3 20V8l9-5 9 5v12"/><path d="M3 14h18M8 20v-6M16 20v-6"/>',
  food:'<path d="M7 3v8a3 3 0 0 0 3 3v7M10 3v6M4 3v6a3 3 0 0 0 3 3"/><path d="M17 21V3c-2 1-3 3.5-3 7s1 4 3 4"/>',
  sunbed:'<path d="M12 3a9 9 0 0 0-9 9h18a9 9 0 0 0-9-9zM12 12v9M8 21h8"/>',
  ride:'<rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 9l2-4h8l2 4"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
  boat:'<path d="M3 15l2 5h14l2-5H3zM12 3v12M12 4l6 8h-6"/>',
  tour:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
  ticket:'<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M13 6v12" stroke-dasharray="2 2"/>',
  guide:'<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  camera:'<path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="4"/>',
  atm:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
  pharmacy:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/>',
  wc:'<circle cx="8" cy="5" r="2"/><circle cx="16" cy="5" r="2"/><path d="M8 8v13M5 10h6M16 8l-3 8h6l-3-8v13"/>',
  prayer:'<path d="M4 21V11l8-7 8 7v10z"/><path d="M10 21v-5a2 2 0 0 1 4 0v5"/>',
  hospital:'<path d="M3 21V7l9-4 9 4v14z"/><path d="M12 9v6M9 12h6"/>',
  phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  lost:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v3M11 14h.01"/>',
  report:'<path d="M4 21V4h12l-2 4 2 4H4"/>',
  alert:'<path d="M12 3 2 21h20zM12 10v5M12 18h.01"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  pin:'<path d="M12 22s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>'
};
const svg = (k, extra='') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICON[k]}</svg>`;

const DEST = [
 { id:'coxs', name:"Cox's Bazar", bn:'কক্সবাজার', accent:'#0B7A8F', kind:'SEA', tag:'Sea, sand and the Marine Drive', tagBn:'সমুদ্র, বালুকাবেলা আর মেরিন ড্রাইভ',
   hero:'hero_saintmartin_sunrise', card:'coxs_himchari_aerial', coord:'21.43°N 91.98°E', alt:'120', best:'November – March', getThere:'Fly or take the overnight bus from Dhaka', pin:'coxs',
   spots:[
     {id:'saintmartin', name:"Saint Martin's Island", bn:'সেন্ট মার্টিন দ্বীপ', kind:'ISLAND', img:'coxs_saintmartin', svc:['boat','stay','food','camera'], know:['Boats run in the dry season only — check the alert before you travel.','Coral is fragile: do not stand on or collect it.','Carry cash; card machines are rare on the island.']},
     {id:'himchari', name:'Himchari', bn:'হিমছড়ি', kind:'HILL', img:'coxs_himchari_aerial', svc:['ride','ticket','food','camera'], know:['Steep steps to the viewpoint — wear proper shoes.','The waterfall is strongest in the monsoon.','Marine Drive rides are cheapest shared; agree the fare first.']},
     {id:'inani', name:'Inani Beach', bn:'ইনানী সৈকত', kind:'BEACH', img:'coxs_inani', svc:['sunbed','food','ride','camera'], know:['Rocky shallows at low tide — watch your footing.','Swim only near lifeguard flags.','Sunset is the busiest hour for photographers.']},
     {id:'marine', name:'Marine Drive coast', bn:'মেরিন ড্রাইভ', kind:'BEACH', img:'coxs_himchari_coast', svc:['ride','tour','food'], know:['The coastal road runs south to Teknaf.','Stops at Himchari and Inani on the way.','Avoid riding after dark on unlit stretches.']}
   ]},
 { id:'sylhet', name:'Sylhet', bn:'সিলেট', accent:'#2F7D32', kind:'FOREST', tag:'Tea hills, swamp forest and stone rivers', tagBn:'চা-বাগান, জলাবন আর পাথুরে নদী',
   hero:'sylhet_ratargul_boats', coord:'24.89°N 91.87°E', alt:'90', best:'July – October for the swamp forest', getThere:'Fly, train or bus from Dhaka', pin:'sylhet',
   spots:[
     {id:'ratargul', name:'Ratargul Swamp Forest', bn:'রাতারগুল জলাবন', kind:'FOREST', img:'sylhet_ratargul_aerial', svc:['boat','guide','camera'], know:['The forest floods mainly in the monsoon; in the dry months it is mostly on foot.','Wooden boats are the way in — agree the time and fare first.','Keep noise low; this is a protected forest.']},
     {id:'tea', name:'Malnicherra Tea Estate', bn:'মালনীছড়া চা-বাগান', kind:'TEA_GARDEN', img:'sylhet_tea', svc:['guide','ride','camera'], know:['Working estate — stay on the paths.','Ask before photographing tea workers.','Early morning has the softest light.']},
     {id:'jaflong', name:'Jaflong', bn:'জাফলং', kind:'RIVER', img:'sylhet_jaflong', svc:['boat','ride','food','camera'], know:['The river is close to the border — follow posted limits.','Currents get strong after rain.','Combine with Lalakhal on a day trip.']}
   ]},
 { id:'rangamati', name:'Rangamati', bn:'রাঙ্গামাটি', accent:'#2457A6', kind:'LAKE', tag:'Kaptai Lake and the hill tracts', tagBn:'কাপ্তাই হ্রদ আর পাহাড়ি জনপদ',
   hero:'rangamati_kaptai_islands', video:'rangamati_floating_market', coord:'22.65°N 92.18°E', alt:'150', best:'October – March', getThere:'Bus from Chattogram or Dhaka', pin:'rangamati',
   spots:[
     {id:'kaptai', name:'Kaptai Lake', bn:'কাপ্তাই হ্রদ', kind:'LAKE', img:'rangamati_fishing_net', svc:['boat','tour','food','camera'], know:['Hire boats from the main ghats; life jackets should be on board.','Island restaurants close early.','Floating fruit markets are busiest on market mornings.']},
     {id:'bridge', name:'Hanging Bridge', bn:'ঝুলন্ত সেতু', kind:'HERITAGE', img:'rangamati_hanging_bridge', svc:['ticket','boat','camera'], know:['Can be partly under water at very high lake levels.','Small entry ticket at the gate.','Crowded on holidays — go early.']},
     {id:'sajek', name:'Sajek Valley', bn:'সাজেক ভ্যালি', kind:'HILL', img:'rangamati_sajek', svc:['stay','ride','food','guide'], know:['Reached by jeep convoy — check convoy times.','Cloud views are best at sunrise.','Book stays ahead on weekends.']}
   ]},
 { id:'bandarban', name:'Bandarban', bn:'বান্দরবান', accent:'#8A5A1F', kind:'HILL', tag:'Above the clouds in the hill tracts', tagBn:'মেঘের ওপরে পাহাড়ের দেশ',
   hero:'bandarban_golden_temple', coord:'22.19°N 92.22°E', alt:'300', best:'October – February', getThere:'Bus from Dhaka or Chattogram', pin:'bandarban',
   spots:[
     {id:'temple', name:'Buddha Dhatu Jadi', bn:'বুদ্ধ ধাতু জাদি', kind:'HERITAGE', img:'bandarban_golden_temple', svc:['ticket','guide','ride'], know:['A place of worship — dress modestly and remove shoes where asked.','Visiting hours are limited.','Photography may be restricted inside.']},
     {id:'nilgiri', name:'Nilgiri', bn:'নীলগিরি', kind:'HILL', img:'bandarban_nilgiri', svc:['stay','ride','food','camera'], know:['Hill roads are steep and winding — hire an experienced driver.','Cloud views are best early morning.','Carry a jacket in winter.']},
     {id:'boga', name:'Boga Lake', bn:'বগা লেক', kind:'LAKE', img:'bandarban_boga', svc:['guide','stay','food'], know:['A guide is usually required for the trek.','Register at the checkpoints on the way.','Basic stays only — bring essentials.']}
   ]},
 { id:'sundarbans', name:'Sundarbans', bn:'সুন্দরবন', accent:'#2F7D32', kind:'FOREST', tag:'The great mangrove forest, by boat', tagBn:'নৌকায় বিশাল ম্যানগ্রোভ বন',
   hero:'sundarbans_aerial', coord:'22.00°N 89.40°E', alt:'200', best:'November – February', getThere:'Boat tours from Khulna or Mongla', pin:'sundarbans',
   spots:[
     {id:'east', name:'Sundarbans East', bn:'সুন্দরবন পূর্ব', kind:'FOREST', img:'sundarbans_aerial', svc:['tour','boat','guide'], know:['Entry is by permitted tour boats only.','Stay with your group on land; this is tiger country.','Carry insect repellent.']},
     {id:'channels', name:'Mangrove channels', bn:'ম্যানগ্রোভ খাল', kind:'RIVER', img:'sundarbans_forest', svc:['boat','tour','camera'], know:['Small boats explore narrow creeks at high tide.','Watch for crocodiles near mudflats.','Early morning is best for birds and deer.']}
   ]}
];
const PINS = {"coxs": [341, 456], "sylhet": [332, 158], "rangamati": [357, 352], "sundarbans": [137, 407], "bandarban": [360, 407], "dhaka": [217, 252]};
const BD_PATH = "M109.1,399.3L109.4,391.3L108.8,383.7L102.8,363.5L98.6,353.2L99.1,349.8L98.9,348.4L97.1,335L94.6,326.8L93.2,318L99.4,305.5L96.9,303.4L89.7,301.7L83.2,299.6L81.5,296.3L84.3,283.9L80.9,279.1L76.1,274.2L74.6,272.2L72.9,269.7L70.6,263.4L75.2,250.3L81.2,235L82.3,229.1L83.5,219L83.8,215.1L83.2,211.3L76.6,207L65.2,205.1L57.2,201.4L52.4,195.8L48.4,193.5L43.6,195.2L37.3,193.1L32.2,187.5L27.6,180.7L28.2,177.5L29.3,173.3L37.6,155.7L40.7,155.1L47.8,158.4L50.7,158.6L55.3,151.6L61.8,131.7L71.2,131.7L79.5,132.5L84.9,133.4L90.6,132.8L96.3,131.1L99.4,128.7L101.1,125.5L100.6,122.8L93.4,119L90.9,116.2L88.9,108.3L86.6,105.3L72.9,104.8L65.5,101.2L61.5,98L54.7,87L45.8,79.1L37.6,77.1L34.2,74.5L32.5,70.4L33.6,64.4L36.2,58.9L37.9,52.8L44.4,44.8L52.1,37.8L55.8,33L60.7,28L61.2,25L60.4,22L56.4,18.9L53.5,17.8L53.3,16L55,10.6L59,10L66.9,14.8L74.9,22.4L79.8,29.3L79.8,34.7L82.9,35.6L86,35.8L91.4,38.2L96.9,37.5L100.3,38.8L102.6,38.4L103.4,35.3L100.9,30.7L98.9,27.3L101.1,24.1L103.7,23.5L106.5,24.3L110.3,27.2L113.1,33.3L113.7,42.7L119.7,51.1L127.9,57.2L134.2,60L141.9,62L148.4,60L151.9,54.2L150.4,48.8L151.3,44.1L153.9,41.5L158.1,41.6L161.3,45.4L170.1,65.6L168.4,74.6L170.4,99.2L168.1,115.3L168.4,118.8L169.5,121.6L171,122.6L173.5,122.6L184.4,125.7L193.5,129L204,132L218.8,134.5L228,133.6L232.8,133.6L241.9,134.3L266.4,133L286.4,132.7L294.6,134.9L301.2,135.8L323.7,134.2L346.5,133.4L358.8,138.6L372.2,146.9L379.6,153.1L381,156.6L380.1,159.6L377.6,161.3L373,161.5L362.5,157.4L360.5,158.6L360.8,166.9L360.5,168.1L358.2,175.5L351.6,192.3L350.5,199.7L349.1,201.7L347.6,202.7L342.5,203L338.5,204.2L337.1,207L334.5,212.5L332.8,218.3L330.3,220.1L324.6,216.9L320.9,217.4L316.3,218.7L311.7,221.9L308.6,225.9L304.9,227.3L294.4,226.5L292.4,227.1L290.9,230L289.8,233.6L281.5,242L278.4,255.7L276.1,264.6L276.4,271.5L283.5,289.3L288.4,312.5L290.1,314.9L291.8,315.6L292.4,315.2L292.4,310.2L292.6,304.4L294.9,303.1L297.8,304.3L300.6,309.3L303.8,318.6L307.2,322.2L312.3,323.2L318.3,321.1L322.9,317L324.6,312.3L323.4,303.5L323.1,296.8L325.7,290.5L336,280.9L337.7,278.1L336.8,270L336.8,262.3L340.8,261.9L345.9,263.1L352.5,259.3L354.5,259.3L357.3,263.2L361.9,262.6L365.3,279.1L369,293.6L369,300.7L369.6,315.5L371,327.6L373.6,330.4L376.4,336.8L379.3,344.4L381.3,348.6L382.7,362.3L384.7,372.1L387,403.1L387.8,409L388.7,412.3L388.7,440.6L389.5,452.5L391.8,462.6L392.4,466.3L389.8,469.4L387.5,470L385.3,465.1L379.9,461.5L371.9,457.6L368.7,454.9L364.5,455.9L359,461.8L356.8,467.4L357.6,475.1L359.3,482.8L363.3,487L363.6,491.9L365,498.1L367,503.8L368.2,510L366.7,510L362.2,502.2L357.9,493.7L346.8,477.5L343.4,448.4L343.1,434.1L335.7,417.2L330.5,393.8L328.6,387.7L331.1,380.1L331.7,377.3L330.3,377.9L326.3,381.7L321.4,372.4L318.3,364.1L305.2,346.6L301.5,338.9L301.2,331.4L295.8,338.9L288.1,344.3L280.4,352.3L275.3,354.7L259,356.2L249.6,345.5L236.2,319.4L234.2,313.4L235.9,298L232.8,283.5L232.8,275.7L231.9,270.6L229.7,271.8L228.5,275.2L229.1,280.6L228.2,285.3L216.6,284.4L205.4,282.3L215.1,289.9L225.4,291.7L230.8,298.6L231.7,304L231.4,309.9L226,314.3L221.1,316.8L222,322.6L228,329.6L220.5,331.7L218.8,336.4L218.5,342.8L222.3,348.6L223.7,352.9L222.8,356.8L226.2,361.1L231.4,370L232.8,376.3L230.8,385.2L228,388.6L223.4,392L212.3,403.1L206.9,415.9L202.3,421.8L196.6,422.8L194.6,420.2L189.8,416.9L189.8,410.7L191.2,405.8L200.6,393.8L195.5,395.4L189.5,398.8L180.6,405.2L177.5,397.3L175.8,389.9L175.8,380.9L182.9,367.3L174.7,374L172.4,382.5L173.5,392.4L172.4,399.4L169.2,408.6L165,414.1L157.8,417.6L154.7,423.1L149.9,427.1L149.9,419.1L148.4,408.6L143.3,383.7L142.2,389L144.7,404.5L144.7,414.5L140.7,422.5L133.1,431L127.1,432.1L123.6,431L118.2,425.6L112.5,418.1L111.4,405.9ZM275.3,392.3L266.7,398.2L269.6,362.7L275.8,376L277.5,383.1ZM307.5,374.5L303.8,377L300.3,374.9L295.8,366.6L298.1,356L299.5,354.4L301.5,357.8L304.6,365.3L306.6,370.9ZM245.6,399.6L231.9,402.5L224.8,401.6L237.9,379.2L237.6,369.1L235.6,360.9L228.8,354.4L228.5,349.6L225.4,343.2L224,335.6L231.4,333.2L237.4,337.6L238.2,339.9L239.4,346.2L242.5,352.6L252.7,365.7L252.7,373.9L249.9,393.5ZM332.5,421.5L329.7,428.4L328.3,423.4L329.4,417L330.5,413.5L331.4,413.5L333.1,417.2ZM338.5,449.1L333.7,449.6L331.4,447.1L332.5,443.5L331.1,432L335.1,430.8L337.1,431L338.5,434.2L339.4,440.4ZM235.1,324.7L236.2,328.5L231.9,326.2L228.5,323.7L226.5,320.2L229.9,318.5Z";
const CREDITS = [
 {
  "title": "Cinematic BANGLADESH in 4K - DJI Mini 2 - Part 1.webm",
  "artist": "Nishaan Ahmed",
  "license": "CC BY 3.0",
  "page": "https://commons.wikimedia.org/wiki/File:Cinematic_BANGLADESH_in_4K_-_DJI_Mini_2_-_Part_1.webm"
 },
 {
  "title": "Traditional floating fruits market.webm",
  "artist": "Azimronnie",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Traditional_floating_fruits_market.webm"
 },
 {
  "title": "Aerial panoramic view of Saint Martin’s Island at sunrise, Bangladesh.jpg",
  "artist": "Khondoker Zobaed",
  "license": "CC BY 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Aerial_panoramic_view_of_Saint_Martin%E2%80%99s_Island_at_sunrise,_Bangladesh.jpg"
 },
 {
  "title": "Sunrise aerial view of Saint Martin’s Island, Bangladesh.jpg",
  "artist": "Khondoker Zobaed",
  "license": "CC BY 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Sunrise_aerial_view_of_Saint_Martin%E2%80%99s_Island,_Bangladesh.jpg"
 },
 {
  "title": "Himchari National Park Image-4.jpg",
  "artist": "Zitu.madcap0901125",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Himchari_National_Park_Image-4.jpg"
 },
 {
  "title": "Himchari National Park Image-3.jpg",
  "artist": "Zitu.madcap0901125",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Himchari_National_Park_Image-3.jpg"
 },
 {
  "title": "Inani Beach in the day (21 February 2014).jpg",
  "artist": "Arjit Chowdhury",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Inani_Beach_in_the_day_(21_February_2014).jpg"
 },
 {
  "title": "Aerial view of Saint Martin’s Island coral formations.jpg",
  "artist": "Khondoker Zobaed",
  "license": "CC BY 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Aerial_view_of_Saint_Martin%E2%80%99s_Island_coral_formations.jpg"
 },
 {
  "title": "Ratargul 0276.jpg",
  "artist": "Abdulmominbd",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Ratargul_0276.jpg"
 },
 {
  "title": "Aerial view of Ratargul.jpg",
  "artist": "Jayedju149",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Aerial_view_of_Ratargul.jpg"
 },
 {
  "title": "Malnichora Tea Garden at Sylhet 01.jpg",
  "artist": "IqbalHossain",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Malnichora_Tea_Garden_at_Sylhet_01.jpg"
 },
 {
  "title": "Jaflong Sylhet.jpg",
  "artist": "Abdul Momin",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Jaflong_Sylhet.jpg"
 },
 {
  "title": "Kaptai Lake 05.jpg",
  "artist": "Jacob Fring",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Kaptai_Lake_05.jpg"
 },
 {
  "title": "Traditional Fishing Net.jpg",
  "artist": "Muhammad Amdad Hossain",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Traditional_Fishing_Net.jpg"
 },
 {
  "title": "Rangamati Hanging Bridge View.jpg",
  "artist": "Md. Asifur Rahaman",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Rangamati_Hanging_Bridge_View.jpg"
 },
 {
  "title": "Sajek Valley Bangladesh.jpg",
  "artist": "Zohrakeya",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Sajek_Valley_Bangladesh.jpg"
 },
 {
  "title": "Buddha Dhatu Jadi 01.jpg",
  "artist": "Azimronnie",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Buddha_Dhatu_Jadi_01.jpg"
 },
 {
  "title": "Nilgiri, Bandarban, Bangladesh 4.jpg",
  "artist": "Tanvir Rahat",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Nilgiri,_Bandarban,_Bangladesh_4.jpg"
 },
 {
  "title": "Boga Lake (20180915).jpg",
  "artist": "Mhr golpo",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Boga_Lake_(20180915).jpg"
 },
 {
  "title": "Aerial view of Sundarbans East Wildlife Sanctuary.jpg",
  "artist": "Knowshin",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Aerial_view_of_Sundarbans_East_Wildlife_Sanctuary.jpg"
 },
 {
  "title": "Aerial view of the Sundarban.JPG",
  "artist": "Jyotirmoy Banik",
  "license": "CC BY 3.0",
  "page": "https://commons.wikimedia.org/wiki/File:Aerial_view_of_the_Sundarban.JPG"
 },
 {
  "title": "Some where in Bangladesh 1.jpg",
  "artist": "Shirin Kona",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Some_where_in_Bangladesh_1.jpg"
 },
 {
  "title": "Traditional wooden boats 53.jpg",
  "artist": "Azimronnie",
  "license": "CC BY-SA 4.0",
  "page": "https://commons.wikimedia.org/wiki/File:Traditional_wooden_boats_53.jpg"
 }
];

const SVC = {
  stay:{en:'Stay',bn:'থাকা',d:'Hotels, resorts, cottages',ex:'Sea-view room',price:'৳4,500',unit:'/ night'},
  food:{en:'Food',bn:'খাবার',d:'Tables and food to your sunbed',ex:'Seafood dinner table',price:'৳600',unit:'/ deposit'},
  sunbed:{en:'Sunbeds',bn:'সানবেড',d:'Hourly, picked on a map',ex:'Sunbed, front row',price:'৳150',unit:'/ hour'},
  ride:{en:'Rides',bn:'যাতায়াত',d:'Tomtom, CNG, jeep, car',ex:'Shared ride',price:'৳80',unit:'/ seat'},
  boat:{en:'Boats',bn:'নৌকা',d:'Lake boats, speedboats, launches',ex:'Country boat, 2 hours',price:'৳1,200',unit:'/ boat'},
  tour:{en:'Tours',bn:'ট্যুর',d:'Guided trips and activities',ex:'Half-day guided tour',price:'৳900',unit:'/ person'},
  ticket:{en:'Tickets',bn:'টিকিট',d:'Parks, sites, museums',ex:'Entry ticket',price:'৳30',unit:'/ ticket'},
  guide:{en:'Guides',bn:'গাইড',d:'Private local guides',ex:'Local guide, half day',price:'৳1,000',unit:'/ quote'},
  camera:{en:'Photographers',bn:'ফটোগ্রাফার',d:'Per photo or per package',ex:'20-photo package',price:'৳100',unit:'/ package'}
};
const NEARBY = [['atm','ATM','3 min walk'],['pharmacy','Pharmacy','5 min walk'],['wc','Washroom','2 min walk'],['prayer','Prayer room','6 min walk'],['hospital','Hospital','10 min by CNG']];

