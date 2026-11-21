'use client';

import React from 'react';

export function PhotographerPromoSection({ lang = 'en' }: { lang?: 'en' | 'bn' }) {
  return (
    <section className="dl-sec" id="photo">
      <div className="dl-wrap dl-split">
        <div className="dl-photo-stack">
          <figure className="a">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/places/coxs_beach_waves.webp"
              alt="Aerial view of waves breaking on Saint Martin's Island"
              loading="lazy"
            />
          </figure>
          <figure className="b">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/places/rangamati_fishing_net.webp"
              alt="Aerial view of a fishing net on Kaptai Lake"
              loading="lazy"
            />
          </figure>
        </div>
        <div>
          <div className="dl-eyebrow">
            {lang === 'bn' ? 'বিশেষ · সৈকতের ফটোগ্রাফার' : 'Signature · Beach photographers'}
          </div>
          <h2 className="dl-h2">
            <span>{lang === 'bn' ? 'অনুরোধ দিন।' : 'Post a request.'}</span>{' '}
            <span className="serif">{lang === 'bn' ? 'দর বেছে নিন।' : 'Pick a bid.'}</span>
          </h2>
          <p className="dl-lead">
            {lang === 'bn'
              ? 'সৈকতে যেভাবে আসলে হয় সেভাবেই ফটোগ্রাফার নিন — ছবি প্রতি বা প্যাকেজ হিসেবে, আর শুধু পছন্দের ছবিগুলো রাখুন।'
              : 'Hire a photographer the way it really works on the beach — pay per photo or per package, and keep only the shots you want.'}
          </p>
          <div className="dl-rates">
            <div className="dl-rate">
              <b>{lang === 'bn' ? '৫ টাকা' : 'Tk 5'}</b> {lang === 'bn' ? '/ ছবি' : '/ photo'}
            </div>
            <div className="dl-rate">
              <b>{lang === 'bn' ? '১০০ টাকা' : 'Tk 100'}</b> {lang === 'bn' ? '/ ২০ ছবির প্যাকেজ' : '/ 20-photo package'}
            </div>
          </div>
          <p className="dl-note">
            {lang === 'bn'
              ? 'সৈকতের প্রচলিত দর উদাহরণ হিসেবে দেখানো হয়েছে; ফটোগ্রাফাররা নিজস্ব রেট নির্ধারণ করেন।'
              : 'Typical beach rates shown as an example; photographers set their own prices.'}
          </p>
          <ol className="dl-steps">
            <li>
              <span className="k">01</span>
              <div>
                <b>{lang === 'bn' ? 'অনুরোধ দিন' : 'Post your request'}</b>
                <span>
                  {lang === 'bn'
                    ? 'স্পট, সময়, দলের আকার এবং কতগুলো ছবি চান তা লিখুন।'
                    : 'Spot, time window, party size and how many photos you expect.'}
                </span>
              </div>
            </li>
            <li>
              <span className="k">02</span>
              <div>
                <b>{lang === 'bn' ? 'সিলড বিড পান' : 'Get sealed bids'}</b>
                <span>
                  {lang === 'bn'
                    ? 'নিকটস্থ ফটোগ্রাফাররা গোপনে বিড পাঠাবেন। আপনি প্রতি বিডে একবার পাল্টা অফার দিতে পারেন।'
                    : 'Photographers nearby bid privately. You can counter once per bid.'}
                </span>
              </div>
            </li>
            <li>
              <span className="k">03</span>
              <div>
                <b>{lang === 'bn' ? 'পছন্দের ছবি রাখুন' : 'Keep what you love'}</b>
                <span>
                  {lang === 'bn'
                    ? 'ওয়াটারমার্কযুক্ত ছবি থেকে বেছে নিন; কেবল যে ছবি রাখবেন তার বিল দিন।'
                    : 'Pick from watermarked previews; pay only for the photos you select.'}
                </span>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
