import React from 'react';
import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

type Language = 'en' | 'ar';

const translations = {
  en: {
    title: 'Read Quran',
    subtitle: 'Explore the Holy Quran with smooth 3D page-flip transitions.',
    button: 'Start Reading',
  },
  ar: {
    title: 'اقرأ القرآن',
    subtitle: 'اكتشف القرآن الكريم مع انتقال سلس للصفحات ثلاثية الأبعاد.',
    button: 'ابدأ القراءة',
  },
};

export const QuranPromptCard = ({ lang }: { lang: Language }) => {
  const t = translations[lang];

  return (
    <Link to="/quran" className="group relative flex flex-col items-center justify-center rounded-[2.5rem] border border-white/5 bg-app-card p-8 text-center shadow-2xl transition-all hover:border-app-accent/30 active:scale-95">
      <div className="absolute inset-0 z-0 overflow-hidden rounded-[2.5rem] opacity-50">
        <img src="/images/quran-bg.jpg" alt="Quran background" className="h-full w-full object-cover" />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-app-accent/10 text-app-accent shadow-inner">
          <BookOpen className="h-7 w-7" />
        </div>
        <h3 className="mb-2 font-serif text-3xl font-black text-app-text tracking-tight">{t.title}</h3>
        <p className="mb-6 max-w-sm text-sm text-app-muted leading-relaxed">{t.subtitle}</p>
        <span className="inline-flex items-center gap-2 rounded-xl bg-app-accent px-6 py-3 text-sm font-bold uppercase tracking-widest text-app-bg shadow-lg shadow-app-accent/20 transition-all group-hover:scale-105 group-active:scale-95">
          {t.button}
        </span>
      </div>
    </Link>
  );
};
