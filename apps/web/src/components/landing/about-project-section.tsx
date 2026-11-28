'use client';

import React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  Lock,
  QrCode,
  ShieldCheck,
  Sparkles,
  Users,
  ArrowRight,
} from 'lucide-react';

export function AboutProjectSection({ lang = 'en' }: { lang?: 'en' | 'bn' }) {
  return (
    <section className="dl-sec py-16 md:py-24" id="about">
      <div className="dl-wrap">
        {/* Section Header */}
        <div className="max-w-2xl">
          <div className="dl-eyebrow">
            {lang === 'bn' ? 'প্রকল্প পরিচিতি ও দর্শন' : 'About Coastline Project'}
          </div>
          <h2 className="dl-h2 mb-4">
            <span>{lang === 'bn' ? 'বাংলাদেশের পর্যটকদের জন্য' : 'Built for Bangladesh,'}</span>{' '}
            <span className="serif">
              {lang === 'bn' ? 'একটি আধুনিক ও স্বচ্ছ প্ল্যাটফর্ম।' : 'designed for honest travel.'}
            </span>
          </h2>
          <p className="dl-lead text-sm text-muted">
            {lang === 'bn'
              ? 'কোস্টলাইন একটি সম্পূর্ণ স্বাধীন প্ল্যাটফর্ম যা পর্যটকদের সরাসরি স্থানীয় অনুমোদিত হোটেল, সানবেড অ্যাটেনডেন্ট, রেস্তোরাঁ ও ফটোগ্রাফারদের সাথে যুক্ত করে।'
              : 'Coastline is an independent travel platform built to make exploring Bangladesh effortless, transparent, and fair for both travelers and local hosts.'}
          </p>
        </div>

        {/* 4 Core Pillars of Coastline */}
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5">
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-fg">
                {lang === 'bn' ? 'স্বতন্ত্র ও অনুমোদিত' : '100% Independent'}
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                {lang === 'bn'
                  ? 'আমরা কোনো সরকারি প্রতিষ্ঠান নই; আমরা স্বাধীন বুকিং প্ল্যাটফর্ম যা স্বচ্ছ কমিশনের মাধ্যমে পরিচালিত হয়।'
                  : 'An independent commission platform. Every host, hotel, and attendant is verified before being listed.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line/50 text-[11px] font-semibold text-primary">
              {lang === 'bn' ? 'স্বচ্ছ নীতিমালা ✓' : 'Transparent policies ✓'}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5">
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
                <Sparkles className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-fg">
                {lang === 'bn' ? 'অতিরিক্ত ভাড়া মুক্ত' : 'Fair Beach Pricing'}
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                {lang === 'bn'
                  ? 'সৈকতে দরাদরি বা অতিরিক্ত মূল্যের ঝুঁকি নেই। ঘণ্টাপ্রতি নির্ধারিত রেট ও ফটোগ্রাফারদের জন্য সিলড বিডিং।'
                  : 'No tourist markups on the beach. Published hourly rates for loungers and sealed bidding for beach photographers.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line/50 text-[11px] font-semibold text-primary">
              {lang === 'bn' ? 'সিলড বিডিং ও সঠিক দর ✓' : 'Sealed competitive bids ✓'}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5">
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
                <QrCode className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-fg">
                {lang === 'bn' ? 'অফলাইন ডিজিটাল পাস' : 'Offline Digital Pass'}
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                {lang === 'bn'
                  ? 'সৈকতে দুর্বল নেটওয়ার্কেও টিকিট খোলে। সহজ QR কোড ও ছোট রেফারেন্স নম্বর অ্যাটেনডেন্ট তাৎক্ষণিক স্ক্যান করতে পারেন।'
                  : 'Tickets open offline without mobile reception. Attendants scan high-contrast QR passes right at the sunbed.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line/50 text-[11px] font-semibold text-primary">
              {lang === 'bn' ? 'অফলাইনে কাজ করে ✓' : 'Works without internet ✓'}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-0.5">
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/12 text-primary">
                <Lock className="size-6" />
              </div>
              <h3 className="mt-4 text-base font-bold text-fg">
                {lang === 'bn' ? 'নিরাপদ পেমেন্ট ব্যবস্থা' : 'Zero Card Risk'}
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                {lang === 'bn'
                  ? 'আমরা কখনোই আপনার কার্ড নম্বর, সিভিভি বা গোপন পিন সংরক্ষণ করি না। লেনদেন সুরক্ষিত ও নিয়ন্ত্রিত পেমেন্ট পোর্টে পরিচালিত।'
                  : 'We never store card numbers, CVVs, or wallet PINs. All payments, commissions, and refunds are immutable.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-line/50 text-[11px] font-semibold text-primary">
              {lang === 'bn' ? 'স্যান্ডবক্স ও নিরাপত্তা ✓' : 'Protected payment port ✓'}
            </div>
          </div>
        </div>

        {/* Responsible Tourism & Community Callout */}
        <div className="mt-10 glass-card rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h4 className="text-base font-bold text-fg">
              {lang === 'bn'
                ? 'দায়িত্বশীল পর্যটন ও পরিবেশ রক্ষা'
                : 'Responsible Tourism & Environmental Standards'}
            </h4>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              {lang === 'bn'
                ? 'সেন্ট মার্টিন্স প্রবাল প্রাচীর, লাল কাঁকড়ার প্রজনন এলাকা এবং সুন্দরবন ম্যানগ্রোভ সুরক্ষায় প্রতিটি স্পটের জন্য পরিবেশগত নির্দেশনা মেনে চলুন।'
                : 'Coastline promotes sustainable exploration. We enforce zero-litter policies and support local communities across Saint Martin coral reefs, Ratargul swamp, and Kaptai Lake.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/about"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface-alt px-4 py-2.5 text-xs font-bold text-fg hover:border-primary transition-colors"
            >
              <FileText className="size-3.5" />
              {lang === 'bn' ? 'সম্পূর্ণ বিবরণ' : 'Full Project Spec'}
            </Link>
            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 rounded-xl bg-action-bg px-5 py-2.5 text-xs font-bold text-action-fg shadow-md hover:bg-action-bg/90 transition-colors"
            >
              {lang === 'bn' ? 'গন্তব্যগুলো দেখুন' : 'Explore Territories'} <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
