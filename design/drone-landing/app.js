/* Coastline drone-landing prototype behaviour: hash router, hero sequencer, drone camera, map, fly-through, spot hub. */
/* ======================= STATE ======================= */
let LANG = 'en';
let heroIdx = 0, heroTimer = null, heroPaused = false;
const HERO_DUR = 8000;
const SLIDES = [{id:'bd', name:'Bangladesh', bn:'বাংলাদেশ', video:'bd_cinematic', poster:'bd_cinematic_poster', coord:'23.68°N 90.35°E', alt:'400'}].concat(DEST.map(d=>({id:d.id,name:d.name,bn:d.bn,img:d.hero,coord:d.coord,alt:d.alt,video:d.video,poster:d.video?d.video+'_poster':null})));

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const t = (en, bn) => LANG === 'bn' && bn ? bn : en;

/* ======================= RENDER: HOME ======================= */
function media(s, eager){
  if (s.video) return `<video muted playsinline loop autoplay preload="${eager?'auto':'metadata'}" poster="${IMG(s.poster||s.img)}" aria-hidden="true"><source src="${MEDIA}video/${s.video}.mp4" type="video/mp4"></video>`;
  return `<img src="${IMG(s.img)}" alt="" ${eager?'fetchpriority="high"':'loading="lazy"'}>`;
}
function hud(){
  return `<div class="hud" aria-hidden="true"><i></i><i></i><i></i><i></i>
    <div class="tl"><span class="rec">REC</span><span data-tc>00:00:00</span><span>4K · 30FPS</span></div>
    <div class="tr"><span data-coord></span><span>ALT <b data-alt></b> M</span><span>GIMBAL −45°</span></div>
    <div class="cross"></div><div class="horizon"></div></div>`;
}
function renderHome(){
  const m = $('#main');
  m.innerHTML = `
  <section class="stage" id="hero" aria-label="Drone views of Bangladesh">
    ${SLIDES.map((s,i)=>`<div class="layer ${i===0?'on':''}" data-i="${i}"><div class="cam">${media(s, i<2)}</div></div>`).join('')}
    <div class="mist"></div><div class="shade"></div>${hud()}
    <div class="rail" role="tablist" aria-label="Places">
      ${SLIDES.map((s,i)=>`<button role="tab" type="button" data-go="${i}" aria-current="${i===0}"><span class="n">0${i+1}</span><span class="t">${s.name}</span><span class="b">${s.bn}</span><span class="bar"><span></span></span></button>`).join('')}
    </div>
    <div class="hero-copy">
      <div class="kicker" data-en="An independent travel platform for Bangladesh" data-bn="বাংলাদেশ ভ্রমণের স্বাধীন প্ল্যাটফর্ম">An independent travel platform for Bangladesh</div>
      <h1 class="hero-title"><span data-en="Bangladesh," data-bn="বাংলাদেশ,">Bangladesh,</span><br><span class="serif" data-en="from above." data-bn="ওপর থেকে।">from above.</span></h1>
      <div class="place-name" id="placeName"></div>
      <p class="hero-sub" data-en="Pick a place, then book everything there in one go — stays, food, sunbeds, boats, guides and photographers. Help is always one tap away." data-bn="জায়গা বেছে নিন, তারপর সেখানকার সবকিছু এক জায়গায় বুক করুন — থাকা, খাবার, সানবেড, নৌকা, গাইড আর ফটোগ্রাফার। সহায়তা সবসময় এক ট্যাপ দূরে।">Pick a place, then book everything there in one go — stays, food, sunbeds, boats, guides and photographers. Help is always one tap away.</p>
      <form class="search" id="search" role="search">
        <div class="field"><label for="q-where" data-en="Where" data-bn="কোথায়">Where</label>
          <select id="q-where">${DEST.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select></div>
        <div class="field"><label for="q-when" data-en="When" data-bn="কবে">When</label><input id="q-when" type="date"></div>
        <div class="field"><label for="q-who" data-en="Guests" data-bn="অতিথি">Guests</label>
          <select id="q-who"><option>1 guest</option><option selected>2 guests</option><option>3 guests</option><option>4+ guests</option></select></div>
        <button class="btn btn-primary" type="submit">${svg('search')}<span data-en="Explore" data-bn="খুঁজুন">Explore</span></button>
      </form>
    </div>
    <button class="hero-pause" type="button" id="heroPause" aria-pressed="false" aria-label="Pause the moving background"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg><span>Pause</span></button>
    <div class="scroll-cue">Scroll</div>
  </section>

  <section class="sec" id="map">
    <div class="wrap mapsec">
      <div class="reveal">
        <div class="eyebrow" data-en="Fly the map" data-bn="মানচিত্রে উড়ে দেখুন">Fly the map</div>
        <h2 class="h2"><span data-en="Five landscapes," data-bn="পাঁচ রকম প্রকৃতি,">Five landscapes,</span> <span class="serif" data-en="one country." data-bn="একটি দেশ।">one country.</span></h2>
        <p class="lead" data-en="From the Bay of Bengal to the tea hills of Sylhet, the lake country of Rangamati, the clouds of Bandarban and the mangroves of the Sundarbans. Tap a pin to drop in." data-bn="বঙ্গোপসাগর থেকে সিলেটের চা-পাহাড়, রাঙ্গামাটির হ্রদ, বান্দরবানের মেঘ আর সুন্দরবনের ম্যানগ্রোভ। নামতে একটি পিনে ট্যাপ করুন।">From the Bay of Bengal to the tea hills of Sylhet, the lake country of Rangamati, the clouds of Bandarban and the mangroves of the Sundarbans. Tap a pin to drop in.</p>
        <div style="margin-top:34px;max-width:380px">
          <div class="mapbox" id="mapbox">
            <svg viewBox="0 0 420 520" role="img" aria-label="Map of Bangladesh with destinations">
              <defs><linearGradient id="bdfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E4EFE6"/><stop offset="1" stop-color="#CFE3DA"/></linearGradient></defs>
              <path class="bd" d="${BD_PATH}"/>
            </svg>
            ${DEST.map(d=>{const p=PINS[d.pin];return `<button class="pin" type="button" data-pin="${d.id}" style="left:${p[0]/420*100}%;top:${p[1]/520*100}%;--accent-p:${d.accent}" aria-pressed="false" aria-label="${d.name}"><span></span><em>${d.name}</em></button>`}).join('')}
          </div>
        </div>
      </div>
      <a class="tiltcard reveal d2" id="mapcard" href="#coxs" data-fly>
        <div class="ph"><img alt="" src="${IMG(DEST[0].card||DEST[0].hero)}"></div><div class="ov"></div>
        <div class="ct"></div>
      </a>
    </div>
  </section>

  <section id="explore" style="padding-bottom:clamp(60px,8vw,110px)">
    <div class="wrap reveal" style="display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap">
      <div><div class="eyebrow" data-en="Spots" data-bn="স্পট">Spots</div>
      <h2 class="h2" style="margin-bottom:0"><span data-en="Land where" data-bn="যেখানে নামবেন,">Land where</span> <span class="serif" data-en="you book." data-bn="সেখানেই বুক করুন।">you book.</span></h2></div>
      <p class="lead" style="max-width:420px" data-en="Every spot has its own hub: what you can book, what is nearby, what to know and where to get help." data-bn="প্রতিটি স্পটের নিজস্ব হাব: কী বুক করা যায়, কাছে কী আছে, কী জানা দরকার আর কোথায় সহায়তা পাবেন।">Every spot has its own hub: what you can book, what is nearby, what to know and where to get help.</p>
    </div>
    <div class="spots" id="spots" style="margin-top:34px">
      ${DEST.flatMap(d=>d.spots.map(s=>({d,s}))).map(({d,s},i)=>`<a class="spot tilt" href="#${d.id}" data-fly data-spot="${s.id}" style="--tag:${d.accent}">
        <img src="${IMG(s.img)}" alt="" loading="lazy"><span class="num">${String(i+1).padStart(2,'0')}</span>
        <div class="in"><span class="tag">${s.kind.replace('_',' ')}</span><h4>${s.name}</h4><p><span class="bn">${s.bn}</span> · ${d.name}</p></div></a>`).join('')}
    </div>
  </section>

  <section class="band sec" id="services">
    <div class="bgp" data-parallax><img src="${IMG('bd_wooden_boats')}" alt="" loading="lazy"></div><div class="veil"></div>
    <div class="wrap">
      <div class="reveal" style="max-width:640px">
        <div class="eyebrow" style="color:#F6E7C8" data-en="One checkout, one ticket" data-bn="এক চেকআউট, এক টিকিট">One checkout, one ticket</div>
        <h2 class="h2"><span data-en="Everything at the spot," data-bn="স্পটের সবকিছু,">Everything at the spot,</span> <span class="serif" data-en="in one place." data-bn="এক জায়গায়।">in one place.</span></h2>
        <p class="lead" data-en="See the full price, platform fee and cancellation rule before you pay. Your ticket opens offline, with a QR code and a short reference you can read aloud." data-bn="পেমেন্টের আগেই পুরো দাম, প্ল্যাটফর্ম ফি আর বাতিলের নিয়ম দেখুন। আপনার টিকিট অফলাইনেও খোলে — QR কোড আর মুখে বলা যায় এমন ছোট রেফারেন্সসহ।">See the full price, platform fee and cancellation rule before you pay. Your ticket opens offline, with a QR code and a short reference you can read aloud.</p>
      </div>
      <div class="svc">
        ${Object.entries(SVC).map(([k,v],i)=>`<a href="#coxs" data-fly class="reveal ${k==='camera'?'sig':''}" style="transition-delay:${i*.05}s">${svg(k)}<b data-en="${v.en}" data-bn="${v.bn}">${v.en}</b><small>${v.d}</small></a>`).join('')}
      </div>
    </div>
  </section>

  <section class="sec" id="photo">
    <div class="wrap split">
      <div class="photo-stack reveal">
        <figure class="a"><img src="${IMG('coxs_beach_waves')}" alt="Aerial view of waves breaking on Saint Martin's Island" loading="lazy"></figure>
        <figure class="b"><img src="${IMG('rangamati_fishing_net')}" alt="Aerial view of a fishing net on Kaptai Lake" loading="lazy"></figure>
      </div>
      <div class="reveal d2">
        <div class="eyebrow" data-en="Signature · Beach photographers" data-bn="বিশেষ · সৈকতের ফটোগ্রাফার">Signature · Beach photographers</div>
        <h2 class="h2"><span data-en="Post a request." data-bn="অনুরোধ দিন।">Post a request.</span> <span class="serif" data-en="Pick a bid." data-bn="দর বেছে নিন।">Pick a bid.</span></h2>
        <p class="lead" data-en="Hire a photographer the way it really works on the beach — pay per photo or per package, and keep only the shots you want." data-bn="সৈকতে যেভাবে আসলে হয় সেভাবেই ফটোগ্রাফার নিন — ছবি প্রতি বা প্যাকেজ হিসেবে, আর শুধু পছন্দের ছবিগুলো রাখুন।">Hire a photographer the way it really works on the beach — pay per photo or per package, and keep only the shots you want.</p>
        <div class="rates"><div class="rate"><b>৳5</b>per photo</div><div class="rate"><b>৳100</b>20-photo package</div></div>
        <p class="note">Typical beach rates shown as an example; photographers set their own prices.</p>
        <ol class="steps">
          <li><span class="k">01</span><div><b>Post your request</b><span>Spot, time window, party size and how many photos you expect.</span></div></li>
          <li><span class="k">02</span><div><b>Get sealed bids</b><span>Photographers nearby bid privately. You can counter once per bid.</span></div></li>
          <li><span class="k">03</span><div><b>Keep what you love</b><span>Pick from watermarked previews; pay only for the photos you select.</span></div></li>
        </ol>
      </div>
    </div>
  </section>

  <section class="sec" id="help" style="background:#fff;border-top:1px solid var(--line)">
    <div class="wrap">
      <div class="reveal"><div class="eyebrow" data-en="Help" data-bn="সহায়তা">Help</div>
      <h2 class="h2"><span data-en="Help is" data-bn="সহায়তা">Help is</span> <span class="serif" data-en="one tap away." data-bn="এক ট্যাপ দূরে।">one tap away.</span></h2></div>
      <div class="help-grid">
        <div class="help-card em reveal">${svg('phone')}<div class="big">999</div><b>National emergency</b><p>Police, fire and ambulance. Coastline shows numbers and nearby facilities; it does not dispatch help.</p></div>
        <div class="help-card reveal d1">${svg('lost')}<b style="font-size:20px">Lost and found</b><p>Report a lost item. Desk staff log found items and check your answers before handing anything over.</p></div>
        <div class="help-card reveal d2">${svg('report')}<b style="font-size:20px">Report a problem</b><p>Overcharging, safety, cleanliness or a wrong listing — track your report until it is resolved.</p></div>
        <div class="help-card reveal d3">${svg('hospital')}<b style="font-size:20px">Nearby facilities</b><p>ATM, pharmacy, hospital, washroom and prayer room for every spot.</p></div>
      </div>
    </div>
  </section>
  ${footer()}`;
  bindHome();
}

function footer(){
  return `<footer><div class="wrap">
    <div class="fgrid">
      <div><a class="logo" href="#home" style="color:#fff;opacity:1">Coastline</a><p style="max-width:320px;line-height:1.6">An independent tourism platform for Bangladesh. Prices are set by providers and are not official tariffs. Payments in this release are sandbox records only.</p></div>
      <div><h5>Destinations</h5>${DEST.map(d=>`<a href="#${d.id}" data-fly>${d.name}</a>`).join('')}</div>
      <div><h5>Travel</h5><a href="#home">Stays</a><a href="#home">Boats and rides</a><a href="#home">Photographers</a><a href="#home">Trips</a></div>
      <div><h5>Partners</h5><a href="#home">List your business</a><a href="#home">Provider portal</a><a href="#home">Help centre</a></div>
    </div>
    <div class="credits"><b>Photo and video credits</b> — Wikimedia Commons: ${CREDITS.map(c=>`<a href="${c.page}">${c.title.replace(/\.(jpe?g|webm)$/i,'')}</a> by ${c.artist||'unknown'} (${c.license})`).join(' · ')}.</div>
  </div></footer>`;
}

/* ======================= RENDER: DESTINATION ======================= */
let hubState = {spot:0, seg:'book'};
function renderDest(d){
  document.documentElement.style.setProperty('--accent', d.accent);
  hubState = {spot:0, seg:'book'};
  const idx = DEST.indexOf(d), nx = DEST[(idx+1)%DEST.length];
  const heroMedia = d.video ? {video:d.video, poster:d.video+'_poster'} : {img:d.hero};
  const m = $('#main');
  m.innerHTML = `
  <section class="stage" id="dhero" aria-label="${d.name} from above">
    <div class="layer on"><div class="cam">${media(heroMedia, true)}</div></div>
    <div class="mist"></div><div class="shade"></div>${hud()}
    <div class="d-head">
      <div class="crumb"><a href="#home">Explore</a><span>/</span><span>${d.name}</span></div>
      <h1 class="d-title swap">${d.name}</h1>
      <div class="d-bn">${d.bn}</div>
      <p class="d-tag">${t(d.tag, d.tagBn)}</p>
      <div class="facts"><div class="fact"><small>Best time</small>${d.best}</div><div class="fact"><small>Getting there</small>${d.getThere}</div><div class="fact"><small>Spots</small>${d.spots.length} places to land</div></div>
    </div>
  </section>
  <div class="wrap">
    <div class="alert" role="status">${svg('alert')}<div><b>Caution · sea and weather <span class="sample">Sample alert</span></b>Live alerts posted by desk staff appear here, with the highest severity first.</div></div>
    <nav class="tabs" aria-label="${d.name} sections">
      ${['Overview','Spots','Stay','Food','Move','Do','Help'].map((x,i)=>`<a href="#${d.id}" data-scroll="${['hub','hub','list','list','list','list','dhelp'][i]}" class="${i===0?'on':''}">${x}</a>`).join('')}
    </nav>
  </div>
  <section class="sec" id="hub" style="padding-top:48px">
    <div class="wrap">
      <div class="reveal" style="margin-bottom:26px"><div class="eyebrow" style="color:var(--accent)">Spot hub</div>
        <h2 class="h2" style="margin-bottom:0">Choose where <span class="serif" style="color:var(--accent)">you land.</span></h2></div>
      <div class="hub reveal" id="hubbox"></div>
    </div>
  </section>
  <section class="sec" id="list" style="padding-top:0">
    <div class="wrap">
      <div class="reveal" style="display:flex;justify-content:space-between;align-items:end;flex-wrap:wrap;gap:16px">
        <div><div class="eyebrow" style="color:var(--accent)">Popular in ${d.name} <span class="sample">Sample listings</span></div>
        <h2 class="h2" style="margin-bottom:0">Book <span class="serif" style="color:var(--accent)">the good stuff.</span></h2></div>
        <p class="lead" style="max-width:380px">Listings, prices and availability will come from approved providers.</p>
      </div>
      <div class="listings">
        ${d.spots.flatMap(s=>s.svc.slice(0,2).map(k=>({s,k}))).slice(0,8).map(({s,k},i)=>`<a class="lcard reveal" href="#${d.id}" style="transition-delay:${(i%4)*.06}s">
          <div class="im"><img src="${IMG(s.img)}" alt="" loading="lazy" style="object-position:${(i*23)%100}% 50%"><span class="tag" style="background:var(--accent)">${SVC[k].en}</span></div>
          <div class="bd2"><b>${SVC[k].ex}</b><small>${s.name}</small>
          <div class="foot"><span class="price">${SVC[k].price} <small>${SVC[k].unit}</small></span><span class="btn btn-primary" style="padding:8px 14px;min-height:38px;background:var(--accent)">Book</span></div></div></a>`).join('')}
      </div>
    </div>
  </section>
  <section class="sec" id="dhelp" style="background:#fff;border-top:1px solid var(--line)">
    <div class="wrap">
      <div class="reveal"><div class="eyebrow" style="color:var(--accent)">Help in ${d.name}</div><h2 class="h2">Safe trips <span class="serif" style="color:var(--accent)">start here.</span></h2></div>
      <div class="help-grid">
        <div class="help-card em reveal">${svg('phone')}<div class="big">999</div><b>National emergency</b><p>Coastline shows numbers; it does not dispatch help.</p></div>
        <div class="help-card reveal d1">${svg('pin')}<b style="font-size:20px">Coastline desk</b><p>Desk staff at main spots handle tickets, lost items and complaints. <span class="sample">Number set by operator</span></p></div>
        <div class="help-card reveal d2">${svg('lost')}<b style="font-size:20px">Lost something?</b><p>Report it and we will match it against items logged by the desk.</p></div>
      </div>
    </div>
  </section>
  <section style="padding:0 0 clamp(60px,8vw,110px)"><div class="wrap">
    <a class="next" href="#${nx.id}" data-fly><img src="${IMG(nx.hero)}" alt="" loading="lazy"><div><small>Next destination</small><h3>${nx.name} →</h3><p class="bn" style="font-size:22px;margin:8px 0 0">${nx.bn}</p></div></a>
  </div></section>
  ${footer()}`;
  renderHub(d);
  bindCommon();
  startHud(d);
}

function renderHub(d, animateBg){
  const box = $('#hubbox'); if(!box) return;
  const s = d.spots[hubState.spot];
  if (!box.dataset.ready){
    box.innerHTML = `<div class="hub-bg">${d.spots.map((x,i)=>`<img src="${IMG(x.img)}" alt="" class="${i===0?'on':''}" data-bg="${i}">`).join('')}</div>
      <div class="hub-left"><div class="spot-picker" role="group" aria-label="Spots">${d.spots.map((x,i)=>`<button type="button" data-sp="${i}" aria-pressed="${i===0}"><img src="${IMG(x.img)}" alt="">${x.name}</button>`).join('')}</div>
      <div id="hubname"></div></div>
      <div class="hub-panel"><div class="seg" role="tablist">${[['book','Book'],['near','Nearby'],['know','Know'],['help','Help']].map(([k,l])=>`<button role="tab" type="button" data-seg="${k}" aria-selected="${k==='book'}">${l}</button>`).join('')}</div><div id="segbody"></div></div>`;
    box.dataset.ready = 1;
    $$('[data-sp]', box).forEach(b=>b.onclick=()=>{hubState.spot=+b.dataset.sp; renderHub(d,true)});
    $$('[data-seg]', box).forEach(b=>b.onclick=()=>{hubState.seg=b.dataset.seg; renderHub(d)});
  }
  $$('[data-bg]', box).forEach(im=>im.classList.toggle('on', +im.dataset.bg===hubState.spot));
  $$('[data-sp]', box).forEach(b=>b.setAttribute('aria-pressed', +b.dataset.sp===hubState.spot));
  $$('[data-seg]', box).forEach(b=>b.setAttribute('aria-selected', b.dataset.seg===hubState.seg));
  $('#hubname').innerHTML = `<div class="swap" key="${s.id}"><span class="tag" style="background:var(--accent)">${s.kind.replace('_',' ')}</span><h3 class="hub-name">${s.name}</h3><p>${s.bn}</p></div>`;
  let body = '';
  if (hubState.seg==='book') body = `<div class="rows">${s.svc.map(k=>`<a class="row" href="#${d.id}"><span class="ic">${svg(k)}</span><span><b>${SVC[k].en}</b><small>${SVC[k].d}</small></span><span class="pr">from ${SVC[k].price}<small>${SVC[k].unit}</small></span></a>`).join('')}</div><p class="note" style="margin:0">Sample prices. Total, platform fee and cancellation rule are shown before you pay.</p>`;
  if (hubState.seg==='near') body = `<div class="rows">${NEARBY.map(([k,n,dd])=>`<div class="row"><span class="ic">${svg(k)}</span><span><b>${n}</b><small>${dd}</small></span><span class="pr" style="font-weight:600;color:var(--accent)">Map</span></div>`).join('')}</div><p class="note" style="margin:0">Sample distances. Your location is used only to sort and is never stored.</p>`;
  if (hubState.seg==='know') body = `<ul class="know">${s.know.map((k,i)=>`<li><b>${['Plan','Safety','Tip'][i]}</b>${k}</li>`).join('')}<li><b>Best time</b>${d.best}</li></ul>`;
  if (hubState.seg==='help') body = `<div class="rows"><div class="row"><span class="ic">${svg('phone')}</span><span><b>National emergency</b><small>Police, fire, ambulance</small></span><span class="pr" style="font-size:22px">999</span></div><div class="row"><span class="ic">${svg('lost')}</span><span><b>Lost and found</b><small>Report a lost item</small></span><span class="pr">${svg('arrow','style="width:20px;height:20px"')}</span></div><div class="row"><span class="ic">${svg('report')}</span><span><b>Report a problem</b><small>Overcharging, safety, listing</small></span><span class="pr">${svg('arrow','style="width:20px;height:20px"')}</span></div></div>`;
  $('#segbody').innerHTML = `<div class="seg-body">${body}</div>`;
}

/* ======================= HERO BEHAVIOUR ======================= */
function goSlide(i, fromEl){
  const layers = $$('#hero .layer'); if(!layers.length) return;
  if (i===heroIdx) return;
  const prev = layers[heroIdx], next = layers[i];
  if (fromEl){ const r = fromEl.getBoundingClientRect(), h = $('#hero').getBoundingClientRect(); next.style.setProperty('--cx', ((r.left+r.width/2-h.left)/h.width*100)+'%'); next.style.setProperty('--cy', ((r.top+r.height/2-h.top)/h.height*100)+'%'); }
  else { next.style.setProperty('--cx','78%'); next.style.setProperty('--cy','50%'); }
  layers.forEach(l=>l.classList.remove('leave'));
  prev.classList.remove('on'); prev.classList.add('leave');
  next.classList.remove('on'); void next.offsetWidth; next.classList.add('enter');
  const v = next.querySelector('video'); if (v) { v.currentTime = 0; v.play().catch(()=>{}); }
  setTimeout(()=>{ next.classList.remove('enter'); next.classList.add('on'); prev.classList.remove('leave'); const pv = prev.querySelector('video'); if (pv) pv.pause(); }, 1500);
  heroIdx = i;
  $$('#hero .rail button').forEach((b,j)=>b.setAttribute('aria-current', j===i));
  updatePlace();
  scheduleHero();
}
function updatePlace(){
  const s = SLIDES[heroIdx];
  const el = $('#placeName'); if(!el) return;
  el.innerHTML = `<div class="swap" style="display:flex;gap:14px;align-items:baseline;flex-wrap:wrap">${svg('pin','style="width:20px;height:20px;align-self:center;stroke:#E8A93A"')}<b>${s.name}</b><span>${s.bn}</span>${s.id!=='bd'?`<a href="#${s.id}" data-fly data-flyimg="${IMG(s.img)}" style="font-size:14px;font-weight:600;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.5);margin-left:6px">Explore ${s.name} →</a>`:''}</div>`;
  $$('[data-coord]').forEach(e=>e.textContent=s.coord);
  $$('[data-alt]').forEach(e=>e.textContent=s.alt);
  bindFly(el);
}
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)');
function scheduleHero(){ clearTimeout(heroTimer); if (heroPaused || REDUCED.matches) return; heroTimer = setTimeout(()=>goSlide((heroIdx+1)%SLIDES.length), HERO_DUR); }

let tcStart = Date.now(), tcLoop;
function startHud(d){
  if (d){ $$('[data-coord]').forEach(e=>e.textContent=d.coord); $$('[data-alt]').forEach(e=>e.textContent=d.alt); }
  clearInterval(tcLoop); tcStart = Date.now();
  tcLoop = setInterval(()=>{ const s = Math.floor((Date.now()-tcStart)/1000); const f = n=>String(n).padStart(2,'0'); $$('[data-tc]').forEach(e=>e.textContent=`${f(Math.floor(s/3600))}:${f(Math.floor(s/60)%60)}:${f(s%60)}`); }, 1000);
}

/* pointer parallax for stages and tilt cards */
function bindParallax(){
  $$('.stage').forEach(st=>{
    st.onpointermove = e=>{ const r = st.getBoundingClientRect(); st.style.setProperty('--px', ((e.clientX-r.left)/r.width-.5)*2); st.style.setProperty('--py', ((e.clientY-r.top)/r.height-.5)*2); };
    st.onpointerleave = ()=>{ st.style.setProperty('--px',0); st.style.setProperty('--py',0); };
  });
  $$('.tiltcard, .tilt').forEach(c=>{
    c.onpointermove = e=>{ const r = c.getBoundingClientRect(); c.style.setProperty('--tx', (((e.clientX-r.left)/r.width)-.5)*10); c.style.setProperty('--ty', (.5-((e.clientY-r.top)/r.height))*8); };
    c.onpointerleave = ()=>{ c.style.setProperty('--tx',0); c.style.setProperty('--ty',0); };
  });
}

/* map */
function selectPin(id){
  const d = DEST.find(x=>x.id===id);
  $$('.pin').forEach(p=>p.setAttribute('aria-pressed', p.dataset.pin===id));
  const card = $('#mapcard'); if(!card) return;
  card.href = '#'+d.id;
  const img = card.querySelector('.ph img');
  img.src = IMG(d.card||d.hero); img.classList.remove('swap-in'); void img.offsetWidth; img.classList.add('swap-in');
  card.querySelector('.ct').innerHTML = `<div class="swap"><span class="tag" style="background:${d.accent}">${d.kind}</span><h3>${d.name} <span class="bn" style="font-weight:500;opacity:.85;font-size:.7em">${d.bn}</span></h3>
    <div style="opacity:.9">${t(d.tag,d.tagBn)}</div>
    <div class="chips">${d.spots.map(s=>`<span class="chip">${s.name}</span>`).join('')}</div>
    <span class="btn btn-light">Drop into ${d.name} ${svg('arrow')}</span></div>`;
}

/* fly-through transition */
function flyFrom(el, href){
  const img = el.querySelector('img');
  const src = el.dataset.flyimg || (img && img.currentSrc);
  if (!src || matchMedia('(prefers-reduced-motion: reduce)').matches){ location.hash = href; return; }
  const r = (img||el).getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'fly';
  Object.assign(f.style, {left:r.left+'px', top:r.top+'px', width:r.width+'px', height:r.height+'px'});
  f.innerHTML = `<img src="${src}" alt="">`; document.body.appendChild(f);
  void f.offsetWidth; f.classList.add('full');
  setTimeout(()=>{ location.hash = href; window.scrollTo(0,0); setTimeout(()=>{ f.classList.add('out'); setTimeout(()=>f.remove(), 650); }, 250); }, 950);
}
function bindFly(root=document){
  $$('[data-fly]', root).forEach(a=>a.addEventListener('click', e=>{
    const href = a.getAttribute('href'); if(!href || !href.startsWith('#')) return;
    e.preventDefault(); flyFrom(a, href);
  }));
}

function bindCommon(){
  bindParallax(); bindFly();
  // reveal on scroll
  const io = new IntersectionObserver(es=>es.forEach(x=>{ if (x.isIntersecting){ x.target.classList.add('in'); io.unobserve(x.target); } }), {threshold:.12});
  $$('.reveal').forEach(el=>io.observe(el));
  // in-page scroll links
  $$('[data-scroll]').forEach(a=>a.onclick = e=>{ e.preventDefault(); const go = ()=>{ const tEl = document.getElementById(a.dataset.scroll); if (tEl) window.scrollTo({top:tEl.getBoundingClientRect().top+scrollY-90, behavior:'smooth'}); };
    if (!$('#'+a.dataset.scroll)) { location.hash = '#home'; setTimeout(go, 120); } else go();
    if (a.closest('.tabs')) { $$('.tabs a').forEach(x=>x.classList.remove('on')); a.classList.add('on'); } });
  applyLang();
}
function bindHome(){
  bindCommon();
  heroIdx = 0; updatePlace(); startHud(); scheduleHero();
  if (REDUCED.matches) $$('video').forEach(v=>{ v.removeAttribute('autoplay'); v.pause(); });
  $$('#hero .rail button').forEach(b=>b.onclick = ()=>goSlide(+b.dataset.go, b));
  const hero = $('#hero');
  hero.addEventListener('mouseenter', ()=>{});
  $('#search').onsubmit = e=>{ e.preventDefault(); const id = $('#q-where').value; const d = DEST.find(x=>x.id===id); const tmp = document.createElement('a'); tmp.dataset.flyimg = IMG(d.hero); tmp.style.cssText='position:fixed;inset:0'; document.body.appendChild(tmp); flyFrom(tmp, '#'+id); tmp.remove(); };
  $$('.pin').forEach(p=>{ p.onclick = ()=>selectPin(p.dataset.pin); p.onmouseenter = ()=>selectPin(p.dataset.pin); });
  selectPin('coxs');
  const pb = $('#heroPause');
  pb.onclick = ()=>{ heroPaused = !heroPaused; pb.setAttribute('aria-pressed', heroPaused); pb.querySelector('span').textContent = heroPaused ? 'Play' : 'Pause';
    pb.setAttribute('aria-label', heroPaused ? 'Play the moving background' : 'Pause the moving background');
    pb.querySelector('svg').innerHTML = heroPaused ? '<path d="M7 5l12 7-12 7z"/>' : '<path d="M8 5v14M16 5v14"/>';
    hero.classList.toggle('paused', heroPaused); $$('#hero video').forEach(v=> heroPaused ? v.pause() : (v.closest('.layer.on') && v.play().catch(()=>{})));
    if (heroPaused) clearTimeout(heroTimer); else scheduleHero(); };
  $$('#hero .rail').forEach(r=>{ r.onmouseenter=()=>{heroPaused=true; hero.classList.add('paused'); clearTimeout(heroTimer)}; r.onmouseleave=()=>{ if (pb.getAttribute('aria-pressed')==='true') return; heroPaused=false; hero.classList.remove('paused'); scheduleHero()}; });
  document.documentElement.style.setProperty('--accent', '#0E6E6A');
  const d = document.querySelector('#q-when'); if (d) d.valueAsDate = new Date();
}

/* nav, parallax bands */
function onScroll(){
  $('#nav').classList.toggle('solid', scrollY > innerHeight*0.7);
  $$('[data-parallax]').forEach(el=>{ const r = el.parentElement.getBoundingClientRect(); el.style.transform = `translate3d(0,${(r.top + r.height/2 - innerHeight/2) * -0.18}px,0)`; });
}
addEventListener('scroll', onScroll, {passive:true});

/* language */
function applyLang(){
  $$('[data-en]').forEach(el=>{ const v = LANG==='bn' ? el.dataset.bn : el.dataset.en; if (v) { el.textContent = v; el.classList.toggle('bn', LANG==='bn'); } });
  $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed', b.dataset.lang===LANG));
  document.documentElement.lang = LANG==='bn' ? 'bn' : 'en';
}
$$('[data-lang]').forEach(b=>b.onclick=()=>{ LANG = b.dataset.lang; try{localStorage.setItem('cl-lang',LANG)}catch(e){}; applyLang(); });
try{ LANG = localStorage.getItem('cl-lang') || 'en'; }catch(e){}

/* router */
function route(){
  clearTimeout(heroTimer);
  const h = location.hash.replace('#','');
  const d = DEST.find(x=>x.id===h);
  if (d) renderDest(d); else renderHome();
  onScroll();
}
addEventListener('hashchange', route);
route();
