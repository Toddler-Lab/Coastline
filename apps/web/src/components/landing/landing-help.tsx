'use client';

import React from 'react';
import Link from 'next/link';

export function LandingHelpSection({ lang = 'en' }: { lang?: 'en' | 'bn' }) {
  return (
    <section
      className="dl-sec"
      id="help"
      style={{ background: 'var(--card-bg, var(--surface))', borderTop: '1px solid var(--line)' }}
    >
      <div className="dl-wrap">
        <div>
          <div className="dl-eyebrow">{lang === 'bn' ? 'সহায়তা' : 'Help'}</div>
          <h2 className="dl-h2">
            <span>{lang === 'bn' ? 'সহায়তা' : 'Help is'}</span>{' '}
            <span className="serif">{lang === 'bn' ? 'এক ট্যাপ দূরে।' : 'one tap away.'}</span>
          </h2>
        </div>
        <div className="dl-help-grid">
          <div className="dl-help-card em">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <div className="big">999</div>
            <b>{lang === 'bn' ? 'জাতীয় জরুরি সেবা' : 'National emergency'}</b>
            <p>
              {lang === 'bn'
                ? 'পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স। কোস্টলাইন কেবল নম্বর ও নিকটস্থ স্বাস্থ্যসেবা কেন্দ্র প্রদর্শন করে; এটি উদ্ধারকারী দল পাঠায় না।'
                : 'Police, fire and ambulance. Coastline shows helpline numbers and nearby facilities; it does not dispatch emergency help.'}
            </p>
          </div>
          <Link className="dl-help-card" href="/help/lost-found">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
            <b style={{ fontSize: '20px' }}>{lang === 'bn' ? 'লস্ট অ্যান্ড ফাউন্ড' : 'Lost and found'}</b>
            <p>
              {lang === 'bn'
                ? 'হারানো জিনিস রিপোর্ট করুন। ডেস্ক স্টাফরা পাওয়া জিনিস তালিকাভুক্ত করেন এবং যাচাই শেষে তা হস্তান্তর করেন।'
                : 'Report a lost item. Desk staff log found items and check your answers before handing anything over.'}
            </p>
          </Link>
          <Link className="dl-help-card" href="/help/report">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <b style={{ fontSize: '20px' }}>{lang === 'bn' ? 'সমস্যার অভিযোগ' : 'Report a problem'}</b>
            <p>
              {lang === 'bn'
                ? 'অতিরিক্ত ভাড়া, নিরাপত্তা, পরিচ্ছন্নতা বা ভুল লিস্টিং — সমাধান না হওয়া পর্যন্ত আপনার অভিযোগ ট্র্যাক করুন।'
                : 'Overcharging, safety, cleanliness or a wrong listing — track your report until it is resolved.'}
            </p>
          </Link>
          <Link className="dl-help-card" href="/help">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 22h20" />
              <path d="M18 10h-3V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v3H6a2 2 0 0 0-2 2v10h16V12a2 2 0 0 0-2-2Z" />
              <path d="M12 7v6" />
              <path d="M9 10h6" />
            </svg>
            <b style={{ fontSize: '20px' }}>{lang === 'bn' ? 'কাছের সুবিধাসমূহ' : 'Nearby facilities'}</b>
            <p>
              {lang === 'bn'
                ? 'প্রতিটি স্পটের জন্য এটিএম, ফার্মেসি, হাসপাতাল, ওয়াশরুম ও নামাজের ঘর।'
                : 'ATM, pharmacy, hospital, washroom and prayer room for every spot.'}
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
