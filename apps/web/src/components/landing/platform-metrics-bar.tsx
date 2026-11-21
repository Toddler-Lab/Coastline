'use client';

import React from 'react';

export function PlatformMetricsBar({ lang = 'en' }: { lang?: 'en' | 'bn' }) {
  const metrics = [
    {
      val: '120+',
      unit: 'km',
      label: lang === 'bn' ? 'অবিচ্ছিন্ন সৈকত' : 'Unbroken coastline',
      sub:
        lang === 'bn'
          ? 'কক্সবাজার মেরিন ড্রাইভ ও বালুকাবেলা'
          : "World's longest natural sea beach & Marine Drive",
    },
    {
      val: '5',
      unit: lang === 'bn' ? 'প্রকৃতি' : 'biomes',
      label: lang === 'bn' ? 'বৈচিত্র্যময় ভূপ্রকৃতি' : 'Diverse landscapes',
      sub:
        lang === 'bn'
          ? 'সমুদ্র, মেঘ-পাহাড়, জলাবন, হ্রদ ও ম্যানগ্রোভ'
          : 'Ocean shores, cloud peaks, lake tracts & mangroves',
    },
    {
      val: '100%',
      unit: '',
      label: lang === 'bn' ? 'স্বচ্ছ বুকিং ব্যবস্থা' : 'Transparent pricing',
      sub:
        lang === 'bn'
          ? 'সৈকতের ফটোগ্রাফারদের সিলড বিড ও নির্দিষ্ট রেট'
          : 'Sealed photographer bids, upfront prices & no surprise fees',
    },
    {
      val: '1-tap',
      unit: '',
      label: lang === 'bn' ? 'স্পট ডেস্ক ও সহায়তা' : 'Spot desks & safety',
      sub:
        lang === 'bn'
          ? 'স্পট ডেস্ক, লস্ট অ্যান্ড ফাউন্ড ও জাতীয় জরুরি নম্বর'
          : 'Dedicated spot desks, lost & found, emergency helpline numbers',
    },
  ];

  return (
    <section className="dl-metrics-strip" aria-label="Platform Highlights">
      <div className="dl-wrap">
        <div className="dl-metrics-grid">
          {metrics.map((m, idx) => (
            <div key={idx} className="dl-metric-item">
              <div className="dl-metric-val">
                {m.val}
                {m.unit && <span className="unit">{m.unit}</span>}
              </div>
              <div className="dl-metric-label">{m.label}</div>
              <div className="dl-metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

