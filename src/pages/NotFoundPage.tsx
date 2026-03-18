import React from 'react';
import { Link } from 'react-router-dom';

type Language = 'en' | 'ar';

const translations = {
  en: {
    label: '404',
    title: 'Page not found',
    body: 'The page you opened does not exist or the link is outdated.',
    home: 'Go Home',
    quran: 'Open Quran',
    prayer: 'Open Prayer Time',
  },
  ar: {
    label: '404',
    title: 'الصفحة غير موجودة',
    body: 'الصفحة التي فتحتها غير موجودة أو أن الرابط قديم.',
    home: 'العودة للرئيسية',
    quran: 'فتح القرآن',
    prayer: 'فتح مواقيت الصلاة',
  },
};

export const NotFoundPage = ({ lang }: { lang: Language }) => {
  const t = translations[lang];

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center justify-center px-6 pt-32 pb-16">
      <div className="w-full rounded-[2rem] border border-white/10 bg-app-card/80 p-8 text-center shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.35em] text-app-accent">{t.label}</div>
        <h1 className="mb-4 font-serif text-4xl font-bold text-app-text sm:text-5xl">{t.title}</h1>
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-7 text-app-muted sm:text-base">{t.body}</p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="w-full rounded-2xl bg-app-accent px-6 py-3 text-sm font-bold text-app-bg transition hover:bg-app-accent-hover sm:w-auto"
          >
            {t.home}
          </Link>
          <Link
            to="/prayer"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-app-text transition hover:bg-white/10 sm:w-auto"
          >
            {t.prayer}
          </Link>
          <Link
            to="/quran"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-app-text transition hover:bg-white/10 sm:w-auto"
          >
            {t.quran}
          </Link>
        </div>
      </div>
    </div>
  );
};
