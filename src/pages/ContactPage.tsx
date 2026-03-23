import React from 'react';
import { Mail, Globe } from 'lucide-react';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const text = {
  en: {
    title: 'Contact Us',
    intro: 'You can contact Islamic Light for support, corrections, privacy requests, or business inquiries.',
    email: 'Email',
    website: 'Website',
  },
  ar: {
    title: 'اتصل بنا',
    intro: 'يمكنك التواصل مع النور الإسلامي للدعم أو التصحيحات أو طلبات الخصوصية أو الاستفسارات العامة.',
    email: 'البريد الإلكتروني',
    website: 'الموقع الإلكتروني',
  },
};

export const ContactPage = ({ lang }: { lang: Language }) => {
  const t = text[lang];

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className={cn('mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-app-card p-8 md:p-12', lang === 'ar' && 'text-right')}>
          <h1 className="mb-4 text-4xl font-serif text-app-text">{t.title}</h1>
          <p className="mb-10 leading-relaxed text-app-muted">{t.intro}</p>

          <div className="grid gap-4">
            <a
              href={`mailto:${siteLinks.supportEmail}`}
              className={cn('flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-app-text transition-colors hover:border-app-accent/40', lang === 'ar' && 'flex-row-reverse')}
            >
              <Mail className="h-5 w-5 text-app-accent" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-app-muted">{t.email}</p>
                <p className="mt-1 text-sm font-bold">{siteLinks.supportEmail}</p>
              </div>
            </a>

            <a
              href={siteLinks.website}
              target="_blank"
              rel="noreferrer"
              className={cn('flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-app-text transition-colors hover:border-app-accent/40', lang === 'ar' && 'flex-row-reverse')}
            >
              <Globe className="h-5 w-5 text-app-accent" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-app-muted">{t.website}</p>
                <p className="mt-1 text-sm font-bold">{siteLinks.website}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
