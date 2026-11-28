'use client';

import { useState, type FormEvent } from 'react';
import {
  Camera,
  Check,
  CheckCheck,
  Clock3,
  Heart,
  ImagePlus,
  Images,
  LockKeyhole,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Chip } from '@/components/ui/chip';
import { Avatar, Card, DetailRows, Money, Rating } from '@/components/ui/display';
import { Field, Input, Select, TextArea } from '@/components/ui/field';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { MEDIA_CREDITS } from '@/lib/media-credits';
import {
  estimatedTotal,
  galleryImages,
  packages,
  photographers,
  type Package,
  type Photographer,
} from './demo-data';

type View = 'discover' | 'requests' | 'shoots' | 'studio';
type RequestPreview = {
  location: string;
  date: string;
  time: string;
  people: string;
  style: string;
  count: number;
  budget: number;
  notes: string;
};
type Booking = {
  photographer: Photographer;
  pack: Package;
  date: string;
  time: string;
  total: number;
  deposit: number;
  awaitingApproval: boolean;
};
const photo = (name: string) => `/media/places/${name}.webp`;
const styles = ['All styles', 'Couple', 'Family', 'Solo', 'Drone'];
function localDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
function displayDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(`${date}T12:00:00+06:00`));
}

function SamplePhoto({ name, alt, className }: { name: string; alt: string; className?: string }) {
  // Existing licensed destination images stand in for a private photographer portfolio.
  return (
    <img src={photo(name)} alt={alt} className={cn('h-full w-full object-cover', className)} />
  );
}

export function PhotographerMarketplace() {
  const [view, setView] = useState<View>('discover');
  const [location, setLocation] = useState('All destinations');
  const [style, setStyle] = useState('All styles');
  const [search, setSearch] = useState('');
  const [budget, setBudget] = useState('all');
  const [sort, setSort] = useState('recommended');
  const [saved, setSaved] = useState<string[]>([]);
  const [profile, setProfile] = useState<Photographer | null>(null);
  const [pack, setPack] = useState(packages[0]);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('16:30');
  const [checkout, setCheckout] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [request, setRequest] = useState<RequestPreview | null>(null);
  const [requestClosed, setRequestClosed] = useState(false);
  const [acceptedRequest, setAcceptedRequest] = useState(false);
  const [fromBid, setFromBid] = useState(false);
  const [countered, setCountered] = useState<Record<string, number>>({});
  const [counterTarget, setCounterTarget] = useState<string | null>(null);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [message, setMessage] = useState('');
  const [selectedPhotos, setSelectedPhotos] = useState<number[]>(
    Array.from({ length: 20 }, (_, i) => i),
  );
  const [settled, setSettled] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [studioSaved, setStudioSaved] = useState(false);
  const [notice, setNotice] = useState('');
  const total = estimatedTotal(pack, pack.count);
  const visible = photographers
    .filter(
      (p) =>
        (location === 'All destinations' || p.location === location) &&
        (style === 'All styles' || p.style === style) &&
        `${p.name} ${p.spot} ${p.location}`.toLowerCase().includes(search.toLowerCase()) &&
        (budget !== 'under100' || p.id !== 'sami'),
    )
    .sort((a, b) =>
      sort === 'rating'
        ? b.rating - a.rating
        : sort === 'response'
          ? parseInt(a.response) - parseInt(b.response)
          : 0,
    );
  const jobPack = booking?.pack ?? packages[0];
  const selectedCount = selectedPhotos.length;
  const finalTotal = estimatedTotal(jobPack, selectedCount);
  const balance = finalTotal - (booking?.deposit ?? 2000);

  function openProfile(p: Photographer) {
    setProfile(p);
    setPack(p.id === 'sami' ? packages[2] : packages[0]);
    setCheckout(false);
    setFromBid(false);
  }
  function confirmBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setBooking({
      photographer: profile,
      pack,
      date: bookingDate,
      time: bookingTime,
      total,
      deposit: Math.round(total / 5),
      awaitingApproval: profile.mode === 'Request only',
    });
    setProfile(null);
    if (fromBid) setAcceptedRequest(true);
    setView('shoots');
    setPreviewReady(false);
    setSettled(false);
    setReviewed(false);
    setSelectedPhotos(Array.from({ length: 20 }, (_, i) => i));
    setNotice('Demo deposit recorded. No money moved. Your shoot is ready to preview.');
  }
  function postRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const end = event.currentTarget.elements.namedItem('end') as HTMLInputElement;
    if (String(data.get('end')) <= String(data.get('start'))) {
      end.setCustomValidity('End time must be after the start time.');
      end.reportValidity();
      return;
    }
    end.setCustomValidity('');
    setRequest({
      location: String(data.get('location')),
      date: String(data.get('date')),
      time: `${data.get('start')}–${data.get('end')}`,
      people: String(data.get('people')),
      style: String(data.get('style')),
      count: Number(data.get('count')),
      budget: Math.round(Number(data.get('budget')) * 100),
      notes: String(data.get('notes')),
    });
    setRequestClosed(false);
    setAcceptedRequest(false);
    setCountered({});
    setRequestOpen(false);
    setView('requests');
    setNotice(
      'Request preview created. The offers below are samples, not responses from real photographers.',
    );
  }
  function acceptBid(p: Photographer, price: number) {
    if (!request) return;
    const bidPack: Package = {
      ...packages[0],
      name: `${request.style} shoot`,
      count: request.count,
      extra: p.id === 'nila' ? 600 : 500,
      price,
    };
    setProfile(p);
    setPack(bidPack);
    setBookingDate(request.date);
    setBookingTime(request.time.split('–')[0]);
    setCheckout(true);
    setFromBid(true);
  }

  return (
    <div className="page space-y-8 pb-12 text-fg">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4 text-body-sm">
        <span className="flex flex-wrap items-center gap-2 text-muted">
          <Camera aria-hidden className="size-4 text-primary" /> Coastline experiences{' '}
          <span aria-hidden>/</span> <span className="text-fg">Photographers</span>
        </span>
        <Badge tone="info">Interactive UI preview</Badge>
      </div>

      <section
        className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12"
        aria-labelledby="photography-title"
      >
        <div className="py-2 lg:py-6">
          <span className="inline-flex items-center gap-2 text-label text-primary">
            <span className="h-px w-8 bg-primary" /> A place. A moment. Your story.
          </span>
          <h1
            id="photography-title"
            className="mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Be in the moment.
            <br />
            <span className="text-primary">Keep it forever.</span>
          </h1>
          <p className="mt-5 max-w-md text-body leading-relaxed text-muted">
            Find a local photographer who sees your kind of beautiful. Book a package, or tell us
            your idea and compare offers.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={() =>
                document.getElementById('marketplace')?.scrollIntoView({ behavior: 'instant' })
              }
            >
              <Search aria-hidden className="size-4" /> Find a photographer
            </Button>
            <Button size="lg" variant="secondary" onClick={() => setRequestOpen(true)}>
              Post a shoot request
            </Button>
          </div>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-muted">
            <span className="flex items-center gap-1.5">
              <ShieldCheck aria-hidden className="size-4 text-primary" /> Identity & portfolio
              checks
            </span>
            <span className="flex items-center gap-1.5">
              <Heart aria-hidden className="size-4 text-primary" /> Choose your keepers
            </span>
          </div>
        </div>
        <div
          className="relative grid h-72 grid-cols-[1.25fr_1fr] gap-3 sm:h-96 lg:h-[420px]"
          aria-label="Destination inspiration"
        >
          <div className="relative overflow-hidden rounded-2xl">
            <SamplePhoto name="coxs_inani" alt="Sunlight over the sandy shoreline at Inani Beach" />
            <span className="glass-card absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-body-sm">
              <MapPin aria-hidden className="mr-1 inline size-3.5 text-primary" /> Inani Beach
            </span>
          </div>
          <div className="grid min-h-0 grid-rows-2 gap-3">
            <div className="overflow-hidden rounded-2xl">
              <SamplePhoto name="sylhet_tea" alt="Rolling green tea gardens in Sylhet" />
            </div>
            <div className="relative overflow-hidden rounded-2xl">
              <SamplePhoto
                name="coxs_beach_waves"
                alt="Waves washing over the Cox’s Bazar shoreline"
              />
              <span className="glass-card absolute bottom-3 left-2 rounded-full px-2.5 py-1.5 text-caption sm:text-body-sm">
                <Sun aria-hidden className="mr-1 inline size-4 text-warn" /> Golden hour
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="glass-card grid gap-5 rounded-2xl p-5 md:grid-cols-3 md:gap-8">
        {[
          {
            icon: Search,
            title: 'Find your fit',
            text: 'Explore portfolios or get offers for your idea.',
          },
          {
            icon: Camera,
            title: 'Make the memories',
            text: 'Choose a time, meet your photographer, relax.',
          },
          {
            icon: Images,
            title: 'Keep what you love',
            text: 'Pick your favourites, settle up, get the originals.',
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
              <item.icon aria-hidden className="size-5" />
            </span>
            <div>
              <h2 className="text-title-sm">{item.title}</h2>
              <p className="mt-1 text-body-sm text-muted">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div id="marketplace" className="scroll-mt-28">
        <div
          className="flex flex-wrap gap-2 border-b border-line pb-4"
          role="group"
          aria-label="Photography workspace"
        >
          {(
            [
              { id: 'discover', label: 'Discover photographers', icon: Camera },
              { id: 'requests', label: 'My requests', icon: MessageSquare },
              { id: 'shoots', label: 'My shoots', icon: Images },
              { id: 'studio', label: 'For photographers', icon: ImagePlus },
            ] as const
          ).map((tab) => (
            <Chip
              key={tab.id}
              selected={view === tab.id}
              onClick={() => {
                setView(tab.id);
                setNotice('');
              }}
            >
              <tab.icon aria-hidden className="size-4" />
              {tab.label}
            </Chip>
          ))}
        </div>
        <p className="mt-4 text-body-sm text-muted">
          Demo profiles, ratings, offers and photos. Changes last for this visit only; no bookings,
          messages or payments are sent.
        </p>
        {notice && (
          <p
            role="status"
            className="mt-4 rounded-md border border-primary/25 bg-primary-soft p-4 text-body-sm text-primary"
          >
            {notice}
          </p>
        )}

        {view === 'discover' && (
          <div className="mt-6 space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-title-lg">Your people. Your perspective.</h2>
                <p className="mt-1 text-body-sm text-muted">
                  Local eyes for the places you’ll remember.
                </p>
              </div>
              <Field label="Sort by" htmlFor="photographer-sort">
                <Select
                  id="photographer-sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest rated</option>
                  <option value="response">Fastest response</option>
                </Select>
              </Field>
            </div>
            <div className="glass-card grid gap-4 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Destination" htmlFor="photo-destination">
                <Select
                  id="photo-destination"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  {['All destinations', 'Cox’s Bazar', 'Sylhet', 'Rangamati'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Preferred date"
                htmlFor="photo-date"
                hint="Carried into booking; not live availability."
              >
                <Input
                  id="photo-date"
                  type="date"
                  min={localDate()}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  aria-describedby="photo-date-hint"
                />
              </Field>
              <Field label="Name or spot" htmlFor="photo-search">
                <Input
                  id="photo-search"
                  placeholder="Try Laboni Beach…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Field>
              <Field label="Starting budget" htmlFor="photo-budget">
                <Select
                  id="photo-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                >
                  <option value="all">Any budget</option>
                  <option value="under100">Up to Tk 100 / package</option>
                </Select>
              </Field>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Shooting style">
                {styles.map((s) => (
                  <Chip key={s} selected={style === s} onClick={() => setStyle(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
              <span aria-live="polite" className="text-body-sm text-muted">
                {visible.length} demo photographers
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {visible.map((p) => (
                <article key={p.id} className="glass-card overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
                  <div className="relative h-56 overflow-hidden sm:h-64">
                    <SamplePhoto
                      name={p.image}
                      alt={`${p.spot} destination inspiration for ${p.style.toLowerCase()} photography`}
                    />
                    <div className="absolute left-4 top-4">
                      <Badge tone="primary">
                        <ShieldCheck aria-hidden className="size-3.5" /> Demo verified
                      </Badge>
                    </div>
                    <button
                      aria-label={`${saved.includes(p.id) ? 'Unsave' : 'Save'} ${p.name}`}
                      aria-pressed={saved.includes(p.id)}
                      onClick={() =>
                        setSaved(
                          saved.includes(p.id)
                            ? saved.filter((id) => id !== p.id)
                            : [...saved, p.id],
                        )
                      }
                      className="glass-card absolute right-4 top-4 grid size-11 place-items-center rounded-full text-primary"
                    >
                      <Heart
                        aria-hidden
                        className={cn('size-5', saved.includes(p.id) && 'fill-current')}
                      />
                    </button>
                    <span className="glass-card absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-body-sm">
                      {p.specialty}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} />
                        <div>
                          <h3 className="text-title-sm">{p.name}</h3>
                          <p className="text-body-sm text-muted">
                            {p.spot} · {p.location}
                          </p>
                        </div>
                      </div>
                      <Rating value={p.rating} count={p.reviews} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge>{p.style}</Badge>
                      <Badge>{p.mode}</Badge>
                      <span className="ml-auto inline-flex items-center gap-1 text-body-sm text-muted">
                        <Clock3 aria-hidden className="size-3.5" /> Replies in {p.response}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                      <p className="text-body-sm text-muted">
                        From{' '}
                        <Money
                          minor={p.id === 'sami' ? 150000 : 10000}
                          className="text-title-sm text-fg"
                        />{' '}
                        / {p.id === 'sami' ? 'hour' : '20 photos'}
                      </p>
                      <Button variant="secondary" onClick={() => openProfile(p)}>
                        View {p.name.split(' ')[0]}’s profile
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {visible.length === 0 && (
              <Card className="p-10 text-center">
                <SlidersHorizontal aria-hidden className="mx-auto mb-3 size-8 text-muted" />
                <h3 className="text-title">No matches this time</h3>
                <p className="mt-2 text-muted">Try another destination, style or budget.</p>
                <Button
                  className="mt-4"
                  variant="secondary"
                  onClick={() => {
                    setLocation('All destinations');
                    setStyle('All styles');
                    setSearch('');
                    setBudget('all');
                  }}
                >
                  Clear filters
                </Button>
              </Card>
            )}
            <Card className="flex flex-wrap items-center justify-between gap-5 bg-primary-soft p-6">
              <div>
                <h3 className="text-title">Have something special in mind?</h3>
                <p className="mt-1 text-body-sm text-muted">
                  Share your plan. Compare sealed offers at your own pace.
                </p>
              </div>
              <Button onClick={() => setRequestOpen(true)}>Create a shoot request</Button>
            </Card>
          </div>
        )}

        {view === 'requests' && (
          <section className="mt-6 space-y-5" aria-label="My requests">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-title-lg">A shoot, on your terms.</h2>
                <p className="mt-1 text-body-sm text-muted">
                  Only you can compare the offers on your request.
                </p>
              </div>
              <Button onClick={() => setRequestOpen(true)}>New request</Button>
            </div>
            {!request ? (
              <Card className="p-10 text-center">
                <MessageSquare aria-hidden className="mx-auto size-9 text-primary" />
                <h3 className="mt-4 text-title">Start with an idea</h3>
                <p className="mx-auto mt-2 max-w-md text-muted">
                  Tell photographers where you’re going, who’s coming and the photographs you’re
                  hoping for.
                </p>
                <Button className="mt-5" onClick={() => setRequestOpen(true)}>
                  Post your first request
                </Button>
              </Card>
            ) : (
              <>
                <Card className="p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <Badge tone="neutral">Sample request · PH-DEMO</Badge>
                      <h3 className="mt-3 text-title">
                        {request.style} shoot at {request.location}
                      </h3>
                      <p className="mt-2 text-body-sm text-muted">
                        {displayDate(request.date)} · {request.time} Asia/Dhaka · {request.people}{' '}
                        people · {request.count} photos
                      </p>
                      <p className="mt-1 text-body-sm text-muted">
                        Budget up to <Money minor={request.budget} /> · Bidding window: 1 hour
                        (preview)
                      </p>
                      {request.notes && <p className="mt-3 text-body-sm">{request.notes}</p>}
                    </div>
                    <StatusBadge
                      tone={requestClosed || acceptedRequest ? 'neutral' : 'info'}
                      label={
                        requestClosed
                          ? 'Closed'
                          : acceptedRequest
                            ? 'Accepted · other bids closed'
                            : 'Open for bids'
                      }
                    />
                  </div>
                  {!requestClosed && !acceptedRequest && (
                    <Button variant="text" className="mt-3" onClick={() => setRequestClosed(true)}>
                      Close request
                    </Button>
                  )}
                </Card>
                <p className="flex items-center gap-2 text-body-sm text-muted">
                  <LockKeyhole aria-hidden className="size-4" /> Sample sealed bids · photographers
                  would only see their own offer.
                </p>
                {!requestClosed &&
                  !acceptedRequest &&
                  photographers
                    .filter(
                      (p) =>
                        p.location ===
                        (request.location === 'Jaflong'
                          ? 'Sylhet'
                          : request.location === 'Kaptai Lake'
                            ? 'Rangamati'
                            : 'Cox’s Bazar'),
                    )
                    .map((p, index) => {
                      const price = request.count * (index === 0 ? 500 : 600);
                      return (
                        <Card key={p.id} className="p-5">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex gap-3">
                              <Avatar name={p.name} />
                              <div>
                                <h3 className="text-title-sm">{p.name}</h3>
                                <Rating value={p.rating} count={p.reviews} />
                                <p className="mt-2 text-body-sm text-muted">
                                  {request.count} edited JPEGs · 24-hour delivery · Replies in{' '}
                                  {p.response}
                                </p>
                                <p className="text-body-sm text-muted">
                                  Extra photos <Money minor={index === 0 ? 500 : 600} /> each
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-title">
                                <Money minor={price} />
                              </p>
                              <p className="text-body-sm text-muted">Comparable package total</p>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Button variant="secondary" onClick={() => openProfile(p)}>
                              Portfolio & packages
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={p.id in countered}
                              onClick={() => setCounterTarget(p.id)}
                            >
                              {p.id in countered
                                ? 'Counter sent · awaiting reply'
                                : 'Make one counter-offer'}
                            </Button>
                            <Button onClick={() => acceptBid(p, price)}>
                              Accept & review deposit
                            </Button>
                          </div>
                          {p.id in countered && (
                            <p className="mt-3 text-body-sm text-muted">
                              Your counter: <Money minor={countered[p.id]} />. One round per bid.
                              Acceptance still uses the original offer until the photographer
                              agrees.
                            </p>
                          )}
                        </Card>
                      );
                    })}
              </>
            )}
          </section>
        )}

        {view === 'shoots' && (
          <section className="mt-6 space-y-6" aria-label="My shoots">
            <div>
              <h2 className="text-title-lg">From first hello to favourite photo.</h2>
              <p className="mt-1 text-body-sm text-muted">
                Follow your shoot, choose your keepers and see the price before settling.
              </p>
            </div>
            {!booking ? (
              <Card className="p-10 text-center">
                <Images aria-hidden className="mx-auto size-9 text-primary" />
                <h3 className="mt-4 text-title">Your next memory starts here</h3>
                <p className="mt-2 text-muted">
                  Book a demo package to explore the deposit, gallery and settlement screens.
                </p>
                <Button className="mt-5" onClick={() => setView('discover')}>
                  Explore packages
                </Button>
              </Card>
            ) : (
              <>
                <Card className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <Avatar name={booking.photographer.name} />
                      <div>
                        <h3 className="text-title">{booking.pack.name}</h3>
                        <p className="mt-1 text-body-sm text-muted">
                          With {booking.photographer.name} · {booking.photographer.spot}
                        </p>
                        <p className="mt-1 text-body-sm text-muted">
                          {displayDate(booking.date)} · {booking.time} Asia/Dhaka
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      tone={settled ? 'success' : 'info'}
                      label={
                        reviewed
                          ? 'Reviewed'
                          : settled
                            ? 'Settled'
                            : previewReady
                              ? 'Preview delivered'
                              : booking.awaitingApproval
                                ? 'Awaiting photographer approval'
                                : 'Confirmed'
                      }
                    />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      'Deposit paid',
                      'Confirmed',
                      'Shoot completed',
                      'Preview delivered',
                      'Settled',
                    ].map((s, i) => (
                      <Badge
                        key={s}
                        tone={
                          i === 0 ||
                          (i === 1 && !booking.awaitingApproval) ||
                          (previewReady && i < 4) ||
                          settled
                            ? 'primary'
                            : 'neutral'
                        }
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-4 text-body-sm text-muted">
                    Deposit <Money minor={booking.deposit} /> ·{' '}
                    {settled ? 'Applied to final total' : 'Held (demo)'} · Provider: SANDBOX
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {!previewReady && (
                      <Button onClick={() => setPreviewReady(true)}>Preview completed shoot</Button>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => document.getElementById('shoot-message')?.focus()}
                    >
                      Booking messages
                    </Button>
                  </div>
                  <form
                    className="mt-4 flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setNotice(`Demo message saved: “${message}”. No message was sent.`);
                      setMessage('');
                    }}
                  >
                    <Field
                      label="Message your photographer (preview)"
                      htmlFor="shoot-message"
                      className="min-w-0 flex-1"
                    >
                      <Input
                        id="shoot-message"
                        required
                        maxLength={500}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Let’s meet by the beach entrance…"
                      />
                    </Field>
                    <Button type="submit" variant="secondary">
                      Preview send
                    </Button>
                  </form>
                </Card>
                {previewReady && (
                  <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
                    <div>
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-title">Your preview gallery</h3>
                        <span className="text-body-sm text-muted">
                          {selectedCount} selected · 24 sample previews
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {Array.from(
                          { length: 24 },
                          (_, i) => galleryImages[i % galleryImages.length],
                        ).map((image, i) => (
                          <button
                            key={`${image}-${i}`}
                            disabled={settled}
                            aria-label={`${selectedPhotos.includes(i) ? 'Deselect' : 'Select'} photo ${i + 1}`}
                            aria-pressed={selectedPhotos.includes(i)}
                            className={cn(
                              'relative aspect-[4/5] overflow-hidden rounded-md border-2 text-fg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary',
                              selectedPhotos.includes(i) ? 'border-primary' : 'border-transparent',
                            )}
                            onClick={() =>
                              setSelectedPhotos(
                                selectedPhotos.includes(i)
                                  ? selectedPhotos.filter((n) => n !== i)
                                  : [...selectedPhotos, i],
                              )
                            }
                          >
                            <SamplePhoto name={image} alt={`Destination gallery sample ${i + 1}`} />
                            {!settled && (
                              <span className="absolute inset-0 grid place-items-center bg-scrim/30 text-label text-on-primary">
                                <span className="-rotate-12 rounded-md bg-fg/70 px-2 py-1 text-center text-caption text-bg">
                                  COASTLINE · PREVIEW
                                </span>
                              </span>
                            )}
                            <span
                              className={cn(
                                'absolute right-2 top-2 grid size-7 place-items-center rounded-full',
                                selectedPhotos.includes(i)
                                  ? 'bg-action-bg text-action-fg'
                                  : 'border border-line bg-surface',
                              )}
                            >
                              {selectedPhotos.includes(i) && (
                                <Check aria-hidden className="size-4" />
                              )}
                            </span>
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-body-sm text-muted">
                        Destination photos stand in for a private gallery. Watermark removal and
                        file delivery here are visual previews only.
                      </p>
                    </div>
                    <Card className="p-5 lg:sticky lg:top-28">
                      <h3 className="text-title">
                        {settled ? 'Your demo receipt' : 'Your selection'}
                      </h3>
                      <p className="mt-1 text-body-sm text-muted">
                        {jobPack.unit === 'photo'
                          ? 'Per-photo pricing'
                          : jobPack.unit === 'hour'
                            ? 'One hour of coverage'
                            : `${jobPack.count} photos included`}
                      </p>
                      <DetailRows
                        className="mt-4"
                        rows={[
                          { label: 'Selected photos', value: selectedCount },
                          { label: 'Final total', value: <Money minor={finalTotal} /> },
                          { label: 'Deposit paid', value: <Money minor={booking.deposit} /> },
                          {
                            label: balance < 0 ? 'Demo refund' : 'Balance',
                            value: <Money minor={Math.abs(balance)} />,
                            strong: true,
                          },
                        ]}
                      />
                      <p className="mt-3 text-body-sm text-muted">
                        Provider: SANDBOX · No money moves.
                      </p>
                      {settled ? (
                        <>
                          <StatusBadge
                            className="mt-4"
                            tone="success"
                            label="Demo files unlocked"
                          />
                          <Button
                            variant="secondary"
                            className="mt-4 w-full"
                            onClick={() => {
                              const a = document.createElement('a');
                              a.href = photo(
                                galleryImages[(selectedPhotos[0] ?? 0) % galleryImages.length],
                              );
                              a.download = 'coastline-destination-sample.webp';
                              a.click();
                            }}
                          >
                            Download a sample photo
                          </Button>
                          {!reviewed ? (
                            <form
                              className="mt-5 space-y-3"
                              onSubmit={(e) => {
                                e.preventDefault();
                                setReviewed(true);
                                setNotice('Demo review saved for this completed shoot.');
                              }}
                            >
                              <Field label="Rate your shoot" htmlFor="shoot-rating">
                                <Select id="shoot-rating" defaultValue="5">
                                  {[5, 4, 3, 2, 1].map((n) => (
                                    <option key={n} value={n}>
                                      {n} stars
                                    </option>
                                  ))}
                                </Select>
                              </Field>
                              <Button type="submit" block>
                                Save demo review
                              </Button>
                            </form>
                          ) : (
                            <p className="mt-4 text-body-sm text-success">
                              Thanks — demo review saved.
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            className="mt-4 w-full"
                            disabled={!selectedCount}
                            onClick={() => {
                              setSettled(true);
                              setNotice(
                                'Selection settled in the preview. No payment or refund was processed.',
                              );
                            }}
                          >
                            {balance < 0
                              ? 'Preview refund & unlock'
                              : 'Settle demo balance & unlock'}
                          </Button>
                          <Button
                            variant="text"
                            className="mt-2 w-full"
                            onClick={() =>
                              setNotice(
                                'Dispute preview: in the full service, you can attach evidence and request an admin review before settlement. No dispute was submitted.',
                              )
                            }
                          >
                            Report a delivery problem
                          </Button>
                        </>
                      )}
                    </Card>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {view === 'studio' && (
          <section
            className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]"
            aria-label="Photographer setup"
          >
            <Card className="p-6">
              <Badge tone="primary">Photographer studio · UI preview</Badge>
              <h2 className="mt-4 text-title-lg">Turn your perspective into someone’s memory.</h2>
              <p className="mt-2 text-muted">
                Build your profile and package. In the full service, an identity and portfolio
                review comes before publishing or bidding.
              </p>
              <form
                className="mt-6 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  setStudioSaved(true);
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name" htmlFor="studio-name">
                    <Input id="studio-name" required placeholder="Your name or studio" />
                  </Field>
                  <Field label="Base destination" htmlFor="studio-location">
                    <Select id="studio-location">
                      <option>Cox’s Bazar</option>
                      <option>Sylhet</option>
                      <option>Rangamati</option>
                    </Select>
                  </Field>
                </div>
                <Field label="Your story" htmlFor="studio-bio">
                  <TextArea
                    id="studio-bio"
                    required
                    placeholder="Your approach, languages and favourite places to shoot…"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Shooting style" htmlFor="studio-style">
                    <Select id="studio-style">
                      {styles.slice(1).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Booking mode" htmlFor="studio-mode">
                    <Select id="studio-mode">
                      <option>Instant Book</option>
                      <option>Request only</option>
                    </Select>
                  </Field>
                  <Field label="Package name" htmlFor="studio-package">
                    <Input id="studio-package" required placeholder="Golden-hour portraits" />
                  </Field>
                  <Field label="Pricing model" htmlFor="studio-unit">
                    <Select id="studio-unit">
                      <option>Per package</option>
                      <option>Per photo</option>
                      <option>Per hour</option>
                    </Select>
                  </Field>
                  {[
                    { id: 'price', label: 'Price (Tk)', value: 100 },
                    { id: 'count', label: 'Included photos', value: 20 },
                    { id: 'extra', label: 'Extra photo (Tk)', value: 5 },
                    { id: 'duration', label: 'Duration (minutes)', value: 30 },
                  ].map((f) => (
                    <Field key={f.id} label={f.label} htmlFor={`studio-${f.id}`}>
                      <Input
                        id={`studio-${f.id}`}
                        type="number"
                        min={f.id === 'extra' ? 0 : 1}
                        required
                        defaultValue={f.value}
                      />
                    </Field>
                  ))}
                  <Field label="Delivery time" htmlFor="studio-delivery">
                    <Select id="studio-delivery">
                      <option>Within 24 hours</option>
                      <option>Within 48 hours</option>
                    </Select>
                  </Field>
                  <Field label="File format" htmlFor="studio-format">
                    <Select id="studio-format">
                      <option>Edited JPEG</option>
                      <option>Edited JPEG + RAW</option>
                    </Select>
                  </Field>
                </div>
                <Button type="submit">Preview profile draft</Button>
                {studioSaved && (
                  <p role="status" className="text-body-sm text-primary">
                    Draft preview complete. Nothing was uploaded, saved to an account or submitted
                    for verification.
                  </p>
                )}
              </form>
            </Card>
            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="text-title">Before you go live</h3>
                <ol className="mt-4 space-y-4">
                  {[
                    'Create your profile and choose your languages',
                    'Add a portfolio grouped by place or style',
                    'Complete Coastline identity and portfolio checks',
                    'Set packages, days and available time slots',
                    'Publish after approval',
                  ].map((item, i) => (
                    <li key={item} className="flex gap-3 text-body-sm">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                        {i + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </Card>
              <Card className="p-5">
                <Sun aria-hidden className="size-6 text-warn" />
                <h3 className="mt-3 text-title-sm">Make room for golden hour</h3>
                <p className="mt-2 text-body-sm text-muted">
                  Set your availability around the light you love. Schedule and upload tools will
                  connect when the photographer service is implemented.
                </p>
              </Card>
            </div>
          </section>
        )}
      </div>

      <section
        className="grid gap-6 border-t border-line pt-8 md:grid-cols-3"
        aria-label="Booking information"
      >
        {[
          {
            icon: ShieldCheck,
            title: 'Independent, local talent',
            text: 'Coastline checks identity and portfolios. A platform badge does not imply government or police endorsement.',
          },
          {
            icon: LockKeyhole,
            title: 'A clear price at every step',
            text: 'See included photos, extra-photo prices and your deposit before confirming. This preview uses SANDBOX only.',
          },
          {
            icon: CheckCheck,
            title: 'Your plans can change',
            text: 'Cancellation preview: full deposit refund before 12 hours; later, the deposit is kept. Provider cancellations receive a full refund.',
          },
        ].map((item) => (
          <div key={item.title}>
            <item.icon aria-hidden className="size-5 text-primary" />
            <h2 className="mt-3 text-title-sm">{item.title}</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-muted">{item.text}</p>
          </div>
        ))}
      </section>
      <details className="text-body-sm text-muted">
        <summary className="min-h-11 cursor-pointer py-3">
          Destination image credits · illustrative portfolios
        </summary>
        <ul className="space-y-2">
          {MEDIA_CREDITS.filter((c) =>
            [
              ...galleryImages,
              'sylhet_tea',
              'sylhet_jaflong',
              'rangamati_kaptai_lake',
              'rangamati_kaptai_islands',
            ].some((name) => c.file.includes(name)),
          ).map((c) => (
            <li key={c.file}>
              <a
                className="text-primary underline"
                href={c.source_url}
                target="_blank"
                rel="noreferrer"
              >
                {c.source_title}
              </a>{' '}
              · {c.author} · {c.license}
            </li>
          ))}
        </ul>
      </details>

      <Sheet
        open={profile !== null}
        onClose={() => setProfile(null)}
        title={
          profile ? (checkout ? 'Review your demo deposit' : profile.name) : 'Photographer profile'
        }
        description={
          checkout
            ? 'UI preview only. No reservation or payment will be submitted.'
            : 'Sample profile and destination portfolio'
        }
      >
        {profile && (
          <div className="space-y-5 pt-3">
            {!checkout && (
              <>
                <div className="grid h-40 grid-cols-2 gap-2 overflow-hidden rounded-md">
                  <SamplePhoto name={profile.image} alt={`${profile.spot} sample portfolio`} />
                  <SamplePhoto
                    name={profile.second}
                    alt={`${profile.location} destination inspiration`}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Rating value={profile.rating} count={profile.reviews} />
                  <Badge tone="primary">Demo verified</Badge>
                </div>
                <p className="text-body-sm text-muted">{profile.bio}</p>
                <p className="text-body-sm">
                  {profile.languages} · {profile.mode}
                </p>
                <div className="rounded-md bg-surface-alt p-3 text-body-sm">
                  <Star aria-hidden className="mr-1 inline size-4 text-warn" /> “A relaxed shoot and
                  lovely memories.”
                  <span className="mt-1 block text-muted">
                    Illustrative review from a completed demo booking
                  </span>
                </div>
                <fieldset>
                  <legend className="mb-3 text-title-sm">Choose your package</legend>
                  <div className="space-y-2">
                    {(profile.id === 'sami' ? [packages[2]] : packages).map((p) => (
                      <label
                        key={p.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 rounded-md border p-4',
                          pack.id === p.id ? 'border-primary bg-primary-soft' : 'border-line',
                        )}
                      >
                        <input
                          type="radio"
                          name="package"
                          checked={pack.id === p.id}
                          onChange={() => setPack(p)}
                          className="mt-1 size-4 accent-primary"
                        />
                        <span className="flex-1">
                          <span className="block text-label">{p.name}</span>
                          <span className="mt-1 block text-body-sm text-muted">
                            {p.count} {p.unit === 'photo' ? 'estimated' : 'included'} photos ·{' '}
                            {p.duration}
                          </span>
                          <span className="mt-1 block text-label">
                            <Money minor={p.price} /> / {p.unit}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </>
            )}
            <div>
              <h3 className="text-title-sm">{pack.name}</h3>
              <p className="mt-1 text-body-sm text-muted">
                {pack.count} photos · {pack.duration} · {pack.delivery} · {pack.format}
              </p>
              <p className="mt-1 text-body-sm text-muted">
                {pack.unit === 'hour' ? (
                  'One hour booked; extra time requires agreement.'
                ) : (
                  <>
                    Extra photos: <Money minor={pack.extra} /> each. Final price follows your
                    selection.
                  </>
                )}
              </p>
            </div>
            <form onSubmit={confirmBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Shoot date" htmlFor="booking-date">
                  <Input
                    id="booking-date"
                    type="date"
                    required
                    min={localDate()}
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                </Field>
                <Field label="Time · Asia/Dhaka" htmlFor="booking-time">
                  <Select
                    id="booking-time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  >
                    <option value="09:00">09:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:30">16:30 · Golden hour</option>
                    <option value="17:00">17:00 · Golden hour</option>
                    {!['09:00', '15:00', '16:30', '17:00'].includes(bookingTime) && (
                      <option value={bookingTime}>{bookingTime}</option>
                    )}
                  </Select>
                </Field>
              </div>
              <p className="flex gap-2 text-body-sm text-muted">
                <Sun aria-hidden className="size-4 shrink-0 text-warn" /> Suggested light, not live
                availability. Timing varies by location and season.
              </p>
              <DetailRows
                rows={[
                  { label: 'Estimated total', value: <Money minor={total} /> },
                  {
                    label: 'Demo deposit (20%)',
                    value: <Money minor={Math.round(total / 5)} />,
                    strong: true,
                  },
                  {
                    label: 'Estimated remaining',
                    value: <Money minor={total - Math.round(total / 5)} />,
                  },
                ]}
              />
              <p className="text-body-sm text-muted">
                Provider: SANDBOX ·{' '}
                {profile.mode === 'Request only'
                  ? 'Photographer approval is needed after the deposit.'
                  : 'Instant confirmation in this preview.'}
              </p>
              {checkout ? (
                <Button type="submit" block>
                  Confirm demo deposit
                </Button>
              ) : (
                <Button
                  block
                  onClick={(event) => {
                    const form = event.currentTarget.closest('form');
                    if (form?.reportValidity()) setCheckout(true);
                  }}
                >
                  Review deposit
                </Button>
              )}
            </form>
          </div>
        )}
      </Sheet>

      <Sheet
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Tell us about your shoot"
        description="Create a local preview and compare sample offers. Nothing is published."
      >
        <form onSubmit={postRequest} className="space-y-4 pt-4">
          <Field label="Location" htmlFor="request-location">
            <Select id="request-location" name="location">
              {['Laboni Beach', 'Inani Beach', 'Jaflong', 'Kaptai Lake'].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </Select>
          </Field>
          <Field label="Shoot date" htmlFor="request-date">
            <Input id="request-date" name="date" type="date" required min={localDate()} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From · Asia/Dhaka" htmlFor="request-start">
              <Input id="request-start" name="start" type="time" required defaultValue="16:30" />
            </Field>
            <Field label="Until · Asia/Dhaka" htmlFor="request-end">
              <Input
                id="request-end"
                name="end"
                type="time"
                required
                defaultValue="17:30"
                onChange={(e) => {
                  const start = e.currentTarget.form?.elements.namedItem(
                    'start',
                  ) as HTMLInputElement;
                  e.currentTarget.setCustomValidity(
                    e.currentTarget.value <= start.value
                      ? 'End time must be after the start time.'
                      : '',
                  );
                }}
              />
            </Field>
            <Field label="People" htmlFor="request-people">
              <Input
                id="request-people"
                name="people"
                type="number"
                min={1}
                max={30}
                required
                defaultValue={2}
              />
            </Field>
            <Field label="Shooting style" htmlFor="request-style">
              <Select id="request-style" name="style">
                {styles.slice(1).map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </Select>
            </Field>
            <Field label="Expected photos" htmlFor="request-count">
              <Input
                id="request-count"
                name="count"
                type="number"
                min={1}
                max={200}
                required
                defaultValue={20}
              />
            </Field>
            <Field label="Total budget (Tk)" htmlFor="request-budget">
              <Input
                id="request-budget"
                name="budget"
                type="number"
                min={1}
                max={100000}
                required
                defaultValue={150}
              />
            </Field>
          </div>
          <Field label="Your idea" htmlFor="request-notes" optional>
            <TextArea
              id="request-notes"
              name="notes"
              maxLength={500}
              placeholder="A relaxed couple shoot, a family reunion, a solo adventure…"
            />
          </Field>
          <p className="flex gap-2 rounded-md bg-surface-alt p-3 text-body-sm text-muted">
            <LockKeyhole aria-hidden className="size-5 shrink-0" /> Bids are sealed. You see your
            offers; photographers see only their own. One counter-offer is allowed per bid.
          </p>
          <Button type="submit" block>
            Create request preview
          </Button>
        </form>
      </Sheet>
      <Sheet
        open={counterTarget !== null}
        onClose={() => setCounterTarget(null)}
        title="Make a counter-offer"
        description="One counter per bid. This demo does not send an offer."
      >
        <form
          className="space-y-4 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            if (counterTarget)
              setCountered({
                ...countered,
                [counterTarget]: Math.round(Number(data.get('amount')) * 100),
              });
            setCounterTarget(null);
          }}
        >
          <Field label="Your proposed total (Tk)" htmlFor="counter-amount">
            <Input
              id="counter-amount"
              name="amount"
              type="number"
              min={1}
              max={
                request ? Math.ceil(request.count * (counterTarget === 'nila' ? 6 : 5)) - 1 : 100000
              }
              required
            />
          </Field>
          <Button type="submit" block>
            Preview counter-offer
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
