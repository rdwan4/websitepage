import React from 'react';
import { Youtube, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const translations = {
  en: {
    name: siteLinks.brand.shortEn,
    tagline: siteLinks.brand.taglineEn,
    footer: {
      desc: 'Islamic Light is a bilingual platform for Quran, prayer times, articles, and trusted Islamic learning resources.',
      resources: 'Resources',
      community: 'Community',
      company: 'Company',
      rights: '© 2026 Islamic Light. All rights reserved.',
      joinCommunity: 'Join Community',
      successStories: 'Success Stories',
      support: 'Support',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      about: 'About Us',
      contact: 'Contact Us',
      prayer: 'Prayer Time',
      articles: 'Latest Articles',
    },
  },
  ar: {
    name: siteLinks.brand.shortAr,
    tagline: siteLinks.brand.taglineAr,
    footer: {
      desc: 'النور الإسلامي منصة ثنائية اللغة للقرآن ومواقيت الصلاة والمقالات وموارد المعرفة الإسلامية الموثوقة.',
      resources: 'الموارد',
      community: 'المجتمع',
      company: 'الموقع',
      rights: '© 2026 النور الإسلامي. جميع الحقوق محفوظة.',
      joinCommunity: 'انضم للمجتمع',
      successStories: 'قصص مميزة',
      support: 'الدعم',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الخدمة',
      about: 'من نحن',
      contact: 'اتصل بنا',
      prayer: 'مواقيت الصلاة',
      articles: 'أحدث المقالات',
    },
  },
};

export const Footer = ({ lang }: { lang: Language }) => {
  const t = translations[lang].footer;
  const websiteLabel = siteLinks.website.replace(/^https?:\/\//, '');
  const supportGmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    siteLinks.supportEmail
  )}&su=${encodeURIComponent(lang === 'en' ? 'Support Request - Islamic Light' : 'طلب دعم - النور الإسلامي')}`;

  const socialLinks = [
    { href: siteLinks.social.youtube, label: 'YouTube', Icon: Youtube },
    { href: siteLinks.social.facebook, label: 'Facebook', Icon: Facebook },
    { href: siteLinks.social.instagram, label: 'Instagram', Icon: Instagram },
  ].filter((link) => Boolean(link.href));

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-app-card py-20">
      <div className="container relative z-10 mx-auto px-6">
        <div className={cn('mb-20 grid grid-cols-1 gap-16 md:grid-cols-12', lang === 'ar' && 'text-right')}>
          <div className="md:col-span-5">
            <div className={cn('mb-8 flex items-center gap-3', lang === 'ar' && 'flex-row-reverse')}>
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-app-card/70 p-1">
                <img src="/favicon.svg" alt={translations[lang].name} className="h-full w-full object-contain" />
              </div>
              <div className={cn('flex flex-col leading-none', lang === 'ar' ? 'items-end' : 'items-start')}>
                <span className="font-serif text-xl font-bold text-app-text">{translations[lang].name}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-app-accent">{translations[lang].tagline}</span>
              </div>
            </div>
            <p className="mb-10 max-w-sm leading-relaxed text-app-muted">{t.desc}</p>
            <a
              href={siteLinks.website}
              target="_blank"
              rel="noreferrer"
              className="mb-8 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-app-muted transition-colors hover:text-app-accent"
            >
              {websiteLabel}
            </a>
            {socialLinks.length > 0 && (
              <div className={cn('flex items-center gap-4', lang === 'ar' && 'flex-row-reverse')}>
                {socialLinks.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    title={label}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-app-text/40 transition-all hover:bg-app-accent/10 hover:text-app-accent"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-12 md:col-span-7 md:grid-cols-3">
            <div>
              <h4 className="mb-8 text-xs font-bold uppercase tracking-widest text-app-text">{t.resources}</h4>
              <ul className="space-y-4 text-sm text-app-muted">
                <li><Link to="/prayer" className="transition-colors hover:text-app-accent">{t.prayer}</Link></li>
                <li><Link to="/articles" className="transition-colors hover:text-app-accent">{t.articles}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-8 text-xs font-bold uppercase tracking-widest text-app-text">{t.community}</h4>
              <ul className="space-y-4 text-sm text-app-muted">
                <li><Link to="/community" className="transition-colors hover:text-app-accent">{t.joinCommunity}</Link></li>
                <li><Link to="/community" className="transition-colors hover:text-app-accent">{t.successStories}</Link></li>
                <li><a href={supportGmailCompose} target="_blank" rel="noreferrer" className="transition-colors hover:text-app-accent">{t.support}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-8 text-xs font-bold uppercase tracking-widest text-app-text">{t.company}</h4>
              <ul className="space-y-4 text-sm text-app-muted">
                <li><Link to="/about" className="transition-colors hover:text-app-accent">{t.about}</Link></li>
                <li><Link to="/contact" className="transition-colors hover:text-app-accent">{t.contact}</Link></li>
                <li><Link to="/privacy" className="transition-colors hover:text-app-accent">{t.privacy}</Link></li>
                <li><Link to="/terms" className="transition-colors hover:text-app-accent">{t.terms}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className={cn('flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-12 text-xs font-medium text-app-muted md:flex-row', lang === 'ar' && 'md:flex-row-reverse')}>
          <p>{t.rights}</p>
          <div className={cn('flex items-center gap-8', lang === 'ar' && 'flex-row-reverse')}>
            <Link to="/about" className="transition-colors hover:text-app-accent">{t.about}</Link>
            <Link to="/contact" className="transition-colors hover:text-app-accent">{t.contact}</Link>
            <Link to="/privacy" className="transition-colors hover:text-app-accent">{t.privacy}</Link>
            <Link to="/terms" className="transition-colors hover:text-app-accent">{t.terms}</Link>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-app-accent/5 blur-[120px]" />
    </footer>
  );
};
