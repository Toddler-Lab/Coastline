'use client';

import React from 'react';
import Link from 'next/link';
import { Bus, Car, MapPin, PackageSearch, Phone, Plane, ShieldCheck } from 'lucide-react';
import type { DestinationDetailDto } from '@coastline/api-contracts';
import type { DroneDestination } from '@/lib/scenic-places-data';

export interface DestinationSupportProps {
  destination: DestinationDetailDto;
  nextDest: DroneDestination;
  lang: 'en' | 'bn';
}

export function DestinationSupport({ destination, nextDest, lang }: DestinationSupportProps) {
  return (
    <>
      <section className="dl-sec" id="transit">
        <div className="dl-wrap">
          <div>
            <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
              {lang === 'bn' ? 'ভ্রমণ সহায়িকা ও যাতায়াত' : "Traveler's Field Guide"}
            </div>
            <h2 className="dl-h2" style={{ marginBottom: '6px' }}>
              {lang === 'bn' ? 'কক্সবাজারে সহজে' : 'Getting around'}{' '}
              <span className="serif" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'চলাচল করুন।' : "Cox's Bazar."}
              </span>
            </h2>
            <p className="text-sm text-muted">
              {lang === 'bn'
                ? 'স্থানীয় যাতায়াত, সঠিক বাহন ও বিচ নিরাপত্তার অপরিহার্য তথ্য।'
                : 'Essential transit options, local fare guidance, and beach navigation advice.'}
            </p>
          </div>

          <div className="dl-guide-grid">
            <div className="dl-guide-card">
              <div className="dl-guide-icon text-emerald-600 bg-emerald-500/10">
                <Car className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'টমটম (ইজিবাইক)' : 'Town Auto-Rickshaw (TomTom)'}</h4>
              <p>
                {lang === 'bn'
                  ? 'লাবণী, সুগন্ধা ও কলাতলীর মধ্যে যাতায়াতের সবচেয়ে জনপ্রিয় ও সহজ মাধ্যম ব্যাটারিচালিত টমটম। প্রধান সড়কে শেয়ার্ড ভাড়া প্রতিজন ২০ থেকে ৪০ টাকা।'
                  : 'Battery-operated TomToms are the primary hop-on transit between Laboni, Sugandha, and Kolatoli. Shared rides cost Tk 20–40 per passenger.'}
              </p>
            </div>

            <div className="dl-guide-card">
              <div className="dl-guide-icon text-sky-600 bg-sky-500/10">
                <Bus className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'চান্দের গাড়ি (মেরিন ড্রাইভ)' : 'Chander Gari (Marine Drive)'}</h4>
              <p>
                {lang === 'bn'
                  ? 'মেরিন ড্রাইভ ধরে হিমছড়ি ও ইনানী সমুদ্রসৈকত দর্শনে খোলা জিপ বা চান্দের গাড়ি আদর্শ। যাত্রার শুরুতেই রাউন্ড-ট্রিপ ও অপেক্ষার সময় ঠিক করে নিন।'
                  : 'Iconic open-roof 4x4s for scenic day-trips along the 80km Marine Drive down to Himchari and Inani. Always agree on round-trip waiting times.'}
              </p>
            </div>

            <div className="dl-guide-card">
              <div className="dl-guide-icon text-indigo-600 bg-indigo-500/10">
                <Plane className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'বিমানবন্দর ও বাস টার্মিনাল' : 'Airport & Terminal Arrival'}</h4>
              <p>
                {lang === 'bn'
                  ? 'কক্সবাজার বিমানবন্দর (CXB) ও কলাতলী কেন্দ্রীয় বাস টার্মিনাল থেকে প্রধান হোটেল এলাকা মাত্র ১০-১৫ মিনিটের ড্রাইভ। গেটে সিএনজি ও অটোরিকশা সহজলভ্য।'
                  : 'Cox’s Bazar Airport (CXB) and Kolatoli Central Bus Station sit 10–15 minutes from the main beachfront hotel zone. CNGs wait at gates.'}
              </p>
            </div>

            <div className="dl-guide-card">
              <div className="dl-guide-icon text-amber-600 bg-amber-500/10">
                <ShieldCheck className="size-6" />
              </div>
              <h4>{lang === 'bn' ? 'সৈকত নিরাপত্তা প্রোটোকল' : 'Beach Safety Rules'}</h4>
              <p>
                {lang === 'bn'
                  ? 'সর্বদা লাইফগার্ড চিহ্নিত সীমানার ভেতর সাঁতার কাটুন। লাল পতাকা উড়লে সমুদ্রে নামা থেকে বিরত থাকুন এবং ভাটার সময় গভীর পানিতে যাবেন না।'
                  : 'Always swim within lifeguard-marked flag boundaries. Never swim past marked safety buoys or enter the water after sunset.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="dl-sec"
        id="dhelp"
        style={{ background: 'var(--card-bg, var(--surface))', borderTop: '1px solid var(--line)' }}
      >
        <div className="dl-wrap">
          <div>
            <div className="dl-eyebrow" style={{ color: 'var(--accent)' }}>
              {lang === 'bn'
                ? `${destination.nameBn || destination.name}-এ সরাসরি সহায়তা`
                : `Assistance in ${destination.name}`}
            </div>
            <h2 className="dl-h2">
              {lang === 'bn' ? 'নিরাপদ ভ্রমণ' : 'Safe trips'}{' '}
              <span className="serif" style={{ color: 'var(--accent)' }}>
                {lang === 'bn' ? 'শুরু হোক এখান থেকেই।' : 'start with real support.'}
              </span>
            </h2>
            <p className="text-sm text-muted">
              {lang === 'bn'
                ? 'সৈকতে কোনো সমস্যা, অভিযোগ বা হারানো জিনিসের জন্য কোস্টলাইন ডেস্ক কর্মী ও জরুরি নম্বরসমূহ প্রস্তুত।'
                : 'On-ground assistance, desk locations, and verified emergency helplines for peace of mind.'}
            </p>
          </div>

          <div className="dl-help-grid mt-6">
            <div className="dl-help-card" style={{ borderColor: 'var(--primary)' }}>
              <div className="flex items-center gap-2 text-primary mb-2">
                <MapPin className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'অন-গ্রাউন্ড ডেস্ক' : 'On-Ground Presence'}
                </span>
              </div>
              <b style={{ fontSize: '20px' }}>
                {lang === 'bn' ? 'কোস্টলাইন বিচ ডেস্ক' : 'Coastline Beach Desks'}
              </b>
              <p>
                {lang === 'bn'
                  ? 'সুগন্ধা পয়েন্ট ও লাবণী বিচ প্রবেশমুখে আমাদের ফিজিক্যাল ডেস্ক কর্মী রয়েছে। টিকিট যাচাই, হারানো জিনিস জমা ও তাৎক্ষণিক তথ্যের জন্য যোগাযোগ করুন।'
                  : 'Staffed physical kiosks located at Sugandha Point beach entrance and Laboni Pavilion for ticket verification, complaints, and immediate help.'}
              </p>
            </div>

            <a
              href="tel:01769690732"
              className="dl-help-card em"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center gap-2 text-rose-600 mb-2">
                <Phone className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'ট্যুরিস্ট পুলিশ' : 'Tourist Police'}
                </span>
              </div>
              <div className="big text-rose-600">01769-690732</div>
              <b>
                {lang === 'bn' ? 'কক্সবাজার ট্যুরিস্ট পুলিশ কন্ট্রোল রুম' : "Cox's Bazar Tourist Police"}
              </b>
              <p>
                {lang === 'bn'
                  ? 'সৈকতে নিরাপত্তা বিঘ্নিত হলে বা অতিরিক্ত ভাড়ার সমস্যায় সরাসরি কল করুন।'
                  : 'Direct 24/7 hotline for on-beach security, overcharging issues, and tourist protection.'}
              </p>
            </a>

            <a href="tel:999" className="dl-help-card" style={{ textDecoration: 'none' }}>
              <div className="flex items-center gap-2 text-muted mb-2">
                <Phone className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'জাতীয় জরুরি সেবা' : 'National Emergency'}
                </span>
              </div>
              <div className="big">999</div>
              <b>
                {lang === 'bn' ? 'পুলিশ · ফায়ার সার্ভিস · অ্যাম্বুলেন্স' : 'Police · Fire · Ambulance'}
              </b>
              <p>
                {lang === 'bn'
                  ? 'কোস্টলাইন কেবল জরুরি নম্বর প্রদর্শন করে; এটি উদ্ধারকারী দল পাঠায় না।'
                  : 'Coastline displays verified emergency helplines; it does not dispatch emergency services.'}
              </p>
            </a>

            <Link
              href="/help/lost-found"
              className="dl-help-card"
              style={{ textDecoration: 'none' }}
            >
              <div className="flex items-center gap-2 text-primary mb-2">
                <PackageSearch className="size-5" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  {lang === 'bn' ? 'হারানো জিনিস' : 'Lost & Found'}
                </span>
              </div>
              <b style={{ fontSize: '20px' }}>
                {lang === 'bn' ? 'কিছু হারিয়েছেন বা পেয়েছেন?' : 'Lost something on the sand?'}
              </b>
              <p>
                {lang === 'bn'
                  ? 'সৈকতে পাওয়া যেকোনো আইটেম ডেস্ক কর্মীরা লগ করে রাখেন। আপনার দাবিকৃত জিনিসের সাথে মেলাতে রিপোর্ট করুন।'
                  : 'Items turned in to beach desks are logged in real-time. File a quick report to cross-check matches.'}
              </p>
            </Link>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 clamp(60px, 8vw, 110px)' }}>
        <div className="dl-wrap">
          <Link
            className="dl-next"
            href={`/d/${nextDest.id}`}
            data-fly
            data-flyimg={`/media/places/${nextDest.hero}.webp`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/places/${nextDest.hero}.webp`} alt="" loading="lazy" />
            <div>
              <small>{lang === 'bn' ? 'পরবর্তী গন্তব্য দেখুন' : 'Explore neighboring destination'}</small>
              <h3>{lang === 'bn' ? `${nextDest.bn} →` : `${nextDest.name} →`}</h3>
              <p className="dl-bn" style={{ fontSize: '22px', margin: '8px 0 0' }}>
                {lang === 'bn' ? nextDest.name : nextDest.bn}
              </p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
