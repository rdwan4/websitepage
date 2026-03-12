import React from 'react';
import { Moon, Star, Youtube, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const translations = {
  en: {
    name: 'Islamic Vision',
    tagline: 'Islamic Visions',
    footer: {
      desc: 'A dedicated platform for spreading authentic Islamic knowledge through modern technology and community engagement.',
      resources: 'Resources',
      community: 'Community',
      rights: '© 2026 Islamic Vision. All rights reserved.',
      joinCommunity: 'Join Community',
      successStories: 'Success Stories',
      support: 'Support',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
    },
  },
  ar: {
    name: 'رؤى إسلامية',
    tagline: 'Islamic Vision',
    footer: {
      desc: 'منصة مخصصة لنشر المعرفة الإسلامية الموثوقة من خلال التكنولوجيا الحديثة والمشاركة المجتمعية.',
      resources: 'المصادر',
      community: 'المجتمع',
      rights: '© 2026 رؤى إسلامية. جميع الحقوق محفوظة.',
      joinCommunity: 'انضم للمجتمع',
      successStories: 'قصص النجاح',
      support: 'الدعم',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الاستخدام',
    },
  },
};

export const Footer = ({ lang }: { lang: Language }) => {
  const t = translations[lang].footer;
  const supportGmailCompose = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    siteLinks.supportEmail
  )}&su=${encodeURIComponent(lang === 'en' ? 'Support Request - Islamic Vision' : 'طلب دعم - رؤى إسلامية')}`;
  const socialLinks = [
    { href: siteLinks.social.youtube, label: 'YouTube', Icon: Youtube },
    { href: siteLinks.social.facebook, label: 'Facebook', Icon: Facebook },
    { href: siteLinks.social.instagram, label: 'Instagram', Icon: Instagram },
  ];

  return (
    <footer className="bg-app-card border-t border-white/5 py-20 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10">
        <div className={cn('grid grid-cols-1 md:grid-cols-12 gap-16 mb-20', lang === 'ar' && 'text-right')}>
          <div className="md:col-span-5">
            <div className={cn('flex items-center gap-3 mb-8', lang === 'ar' && 'flex-row-reverse')}>
              <div className="relative w-10 h-10 flex items-center justify-center">
                <Moon className="w-8 h-8 text-app-accent fill-app-accent" />
                <Star className="absolute top-1 right-1 w-3 h-3 text-gold fill-gold" />
              </div>
              <div className={cn('flex flex-col leading-none', lang === 'ar' ? 'items-end' : 'items-start')}>
                <span className="font-serif text-xl font-bold text-app-text">{translations[lang].name}</span>
                <span className="text-[10px] uppercase tracking-widest text-app-accent font-bold">{translations[lang].tagline}</span>
              </div>
            </div>
            <p className="text-app-muted leading-relaxed max-w-sm mb-10">{t.desc}</p>
            <div className={cn('flex items-center gap-4', lang === 'ar' && 'flex-row-reverse')}>
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  title={label}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-app-text/40 hover:text-app-accent hover:bg-app-accent/10 transition-all"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
            <div>
              <h4 className="text-app-text font-bold mb-8 uppercase tracking-widest text-xs">{t.resources}</h4>
              <ul className="space-y-4 text-app-muted text-sm">
                <li>
                  <Link to="/academy" className="hover:text-app-accent transition-colors">
                    Video Academy
                  </Link>
                </li>
                <li>
                  <Link to="/articles" className="hover:text-app-accent transition-colors">
                    Latest Articles
                  </Link>
                </li>
                <li>
                  <Link to="/library" className="hover:text-app-accent transition-colors">
                    Digital Library
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-app-text font-bold mb-8 uppercase tracking-widest text-xs">{t.community}</h4>
              <ul className="space-y-4 text-app-muted text-sm">
                <li>
                  <Link to="/community" className="hover:text-app-accent transition-colors">
                    {t.joinCommunity}
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="hover:text-app-accent transition-colors">
                    {t.successStories}
                  </Link>
                </li>
                <li>
                  <a href={supportGmailCompose} target="_blank" rel="noreferrer" className="hover:text-app-accent transition-colors">
                    {t.support}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-app-muted text-xs font-medium',
            lang === 'ar' && 'flex-row-reverse'
          )}
        >
          <p>{t.rights}</p>
          <div className={cn('flex items-center gap-8', lang === 'ar' && 'flex-row-reverse')}>
            <Link to="/privacy" className="hover:text-app-accent transition-colors">
              {t.privacy}
            </Link>
            <Link to="/terms" className="hover:text-app-accent transition-colors">
              {t.terms}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-app-accent/5 rounded-full blur-[120px]" />
    </footer>
  );
};
