import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Book,
  FileText,
  Languages,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Star,
  Sun,
  Upload,
  Users,
  Video,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { ContentCategory } from '../types';

type Language = 'en' | 'ar';
type Theme = 'light' | 'dark';

const translations = {
  en: {
    name: 'Islamic Vision',
    tagline: 'Islamic learning hub',
    nav: {
      academy: 'Academy',
      articles: 'Articles',
      library: 'Library',
      quran: 'Quran',
      dashboard: 'Admin',
      community: 'Community',
      reminders: 'Reminders',
      account: 'Account',
      signIn: 'Sign In',
      publish: 'Publish',
      publishPost: 'Publish Post',
      publishInspiration: 'Inspiration',
      publishHadith: 'Hadith',
      publishDua: 'Dua',
      logout: 'Logout',
      loading: 'Loading',
      arabic: 'Arabic',
      english: 'English',
    },
  },
  ar: {
    name: 'رؤى إسلامية',
    tagline: 'منصة معرفة إسلامية',
    nav: {
      academy: 'الأكاديمية',
      articles: 'المقالات',
      library: 'المكتبة',
      quran: 'القرآن',
      dashboard: 'لوحة الإدارة',
      community: 'المجتمع',
      reminders: 'التذكيرات',
      account: 'الحساب',
      signIn: 'تسجيل الدخول',
      publish: 'نشر',
      publishPost: 'نشر محتوى',
      publishInspiration: 'Inspiration',
      publishHadith: 'Hadith',
      publishDua: 'Dua',
      logout: 'تسجيل الخروج',
      loading: 'جار التحميل',
      arabic: 'العربية',
      english: 'English',
    },
  },
};

const Logo = ({ lang }: { lang: Language }) => (
  <Link to="/" className={cn('flex items-center gap-3', lang === 'ar' ? 'flex-row-reverse' : 'flex-row')}>
    <div className="relative flex h-10 w-10 items-center justify-center">
      <Moon className="h-8 w-8 fill-app-accent text-app-accent" />
      <Star className="absolute right-1 top-1 h-3 w-3 fill-gold text-gold" />
    </div>
    <div className={cn('flex flex-col leading-none', lang === 'ar' ? 'items-end' : 'items-start')}>
      <span className="font-serif text-xl font-bold text-app-text">{translations[lang].name}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest text-app-accent">
        {translations[lang].tagline}
      </span>
    </div>
  </Link>
);

export const Navbar = ({
  lang,
  setLang,
  theme,
  toggleTheme,
  onAuthClick,
  onCreatePost,
}: {
  lang: Language;
  setLang: (language: Language) => void;
  theme: Theme;
  toggleTheme: () => void;
  onAuthClick: () => void;
  onCreatePost: (category?: ContentCategory) => void;
}) => {
  const { profile, loading, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPublishMenuOpen, setIsPublishMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const location = useLocation();
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalScroll > 0 ? (window.scrollY / totalScroll) * 100 : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
    setIsPublishMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: t.nav.quran, path: '/quran', icon: <Book className="h-4 w-4" /> },
    { name: t.nav.academy, path: '/academy', icon: <Video className="h-4 w-4" /> },
    { name: t.nav.community, path: '/community', icon: <Users className="h-4 w-4" /> },
    { name: t.nav.library, path: '/library', icon: <Book className="h-4 w-4" /> },
    { name: t.nav.articles, path: '/articles', icon: <FileText className="h-4 w-4" /> },
  ];

  if (profile?.role === 'admin') {
    navLinks.unshift({
      name: t.nav.dashboard,
      path: '/admin',
      icon: <LayoutDashboard className="h-4 w-4" />,
    });
  }

  return (
    <nav
      className={cn(
        'fixed left-1/2 top-6 z-50 w-[95%] max-w-7xl -translate-x-1/2 transition-all duration-500',
        isScrolled ? 'top-4' : 'top-6'
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-between rounded-3xl px-6 py-4 transition-all duration-500 md:px-8',
          isScrolled ? 'glass' : 'bg-transparent'
        )}
      >
        <div
          className="absolute bottom-0 left-0 h-1 rounded-full bg-app-accent transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />

        <Logo lang={lang} />

        <div className={cn('hidden items-center gap-6 md:flex', lang === 'ar' && 'flex-row-reverse')}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'flex items-center gap-2 text-sm font-medium transition-colors',
                location.pathname === link.path ? 'text-app-accent' : 'text-app-text/70 hover:text-app-accent'
              )}
            >
              {link.name}
            </Link>
          ))}

          <div className="h-4 w-px bg-app-border" />

          <div className={cn('flex items-center gap-3', lang === 'ar' && 'flex-row-reverse')}>
            <button
              onClick={toggleTheme}
              className="rounded-xl border border-app-border bg-app-card/50 p-2.5 text-app-accent transition-all hover:bg-app-accent/10"
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>

            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 rounded-xl border border-app-accent/20 px-4 py-2.5 text-xs font-bold text-app-accent transition-all hover:bg-app-accent/10"
            >
              <Languages className="h-3.5 w-3.5" />
              {lang === 'en' ? t.nav.arabic : t.nav.english}
            </button>

            {profile?.role === 'admin' && (
              <div className="relative">
                <button
                  onClick={() => setIsPublishMenuOpen((current) => !current)}
                  className="flex items-center gap-2 rounded-xl border border-app-accent/20 bg-app-accent/10 px-4 py-2.5 text-xs font-bold text-app-accent transition-all hover:bg-app-accent/20"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t.nav.publish}
                </button>

                <AnimatePresence>
                  {isPublishMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className={cn(
                        'absolute top-full z-[70] mt-2 w-44 rounded-2xl border border-white/10 bg-app-card p-2 shadow-2xl',
                        lang === 'ar' ? 'left-0' : 'right-0'
                      )}
                    >
                      <button
                        onClick={() => {
                          onCreatePost('inspiration');
                          setIsPublishMenuOpen(false);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-app-text transition-colors hover:bg-white/5"
                      >
                        {t.nav.publishInspiration}
                      </button>
                      <button
                        onClick={() => {
                          onCreatePost('hadith');
                          setIsPublishMenuOpen(false);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-app-text transition-colors hover:bg-white/5"
                      >
                        {t.nav.publishHadith}
                      </button>
                      <button
                        onClick={() => {
                          onCreatePost('dua');
                          setIsPublishMenuOpen(false);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-app-text transition-colors hover:bg-white/5"
                      >
                        {t.nav.publishDua}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {profile ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen((current) => !current)}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 py-2 pl-2 pr-4 transition-all hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-app-accent font-bold text-app-bg">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      profile.display_name?.[0]
                    )}
                  </div>
                  <div className={cn('leading-tight', lang === 'ar' ? 'text-right' : 'text-left')}>
                    <span className="block text-sm font-medium text-app-text">{profile.display_name}</span>
                    <span className="block text-[11px] text-app-muted">{profile.email}</span>
                  </div>
                </button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={cn(
                        'absolute top-full z-[60] mt-2 w-64 rounded-2xl border border-white/10 bg-app-card p-2 shadow-2xl',
                        lang === 'ar' ? 'left-0' : 'right-0'
                      )}
                    >
                      <div className="border-b border-white/5 px-4 py-3">
                        <div
                          className={cn(
                            'flex items-center gap-2 font-semibold text-app-text',
                            lang === 'ar' && 'flex-row-reverse justify-end'
                          )}
                        >
                          {profile.role === 'admin' && <Shield className="h-4 w-4 text-app-accent" />}
                          {profile.display_name}
                        </div>
                        <div className="mt-1 text-xs text-app-muted">{profile.email}</div>
                      </div>

                      <Link
                        to="/account"
                        onClick={() => setIsUserMenuOpen(false)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-app-text transition-all hover:bg-white/5',
                          lang === 'ar' && 'flex-row-reverse justify-end'
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        {t.nav.account}
                      </Link>
                      <button
                        onClick={async () => {
                          await logout();
                          setIsUserMenuOpen(false);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-red-400 transition-all hover:bg-red-500/10',
                          lang === 'ar' && 'flex-row-reverse justify-end'
                        )}
                      >
                        <LogOut className="h-4 w-4" />
                        {t.nav.logout}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : loading ? (
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm text-app-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.nav.loading}
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="flex items-center gap-2 rounded-xl bg-app-accent px-6 py-2.5 text-sm font-bold text-app-bg shadow-lg shadow-app-accent/20 transition-all hover:bg-app-accent-hover"
              >
                <Users className="h-4 w-4" />
                {t.nav.signIn}
              </button>
            )}
          </div>
        </div>

        <button className="text-app-text md:hidden" onClick={() => setIsMenuOpen((current) => !current)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'absolute left-0 right-0 top-full mt-2 flex flex-col gap-4 rounded-3xl border-b border-white/10 bg-app-card p-6 shadow-xl md:hidden',
              lang === 'ar' && 'items-end text-right'
            )}
          >
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'flex items-center gap-3 text-lg font-medium text-app-text/70',
                  lang === 'ar' && 'flex-row-reverse'
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}

            <button
              onClick={() => {
                setLang(lang === 'en' ? 'ar' : 'en');
                setIsMenuOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 text-lg font-bold text-app-accent',
                lang === 'ar' && 'flex-row-reverse'
              )}
            >
              <Languages className="h-5 w-5" />
              {lang === 'en' ? t.nav.arabic : t.nav.english}
            </button>

            <button
              onClick={toggleTheme}
              className={cn(
                'flex items-center gap-3 text-lg font-bold text-app-text',
                lang === 'ar' && 'flex-row-reverse'
              )}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              {theme === 'light'
                ? lang === 'en'
                  ? 'Dark mode'
                  : 'الوضع الداكن'
                : lang === 'en'
                  ? 'Light mode'
                  : 'الوضع الفاتح'}
            </button>

            {profile ? (
              <div className="mt-4 flex w-full flex-col gap-2">
                <Link
                  to="/account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-semibold text-app-text"
                >
                  <Settings className="h-4 w-4" />
                  {t.nav.account}
                </Link>
                {profile.role === 'admin' && (
                  <button
                    onClick={() => {
                      onCreatePost();
                      setIsMenuOpen(false);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-app-accent px-6 py-4 text-sm font-bold text-app-bg"
                  >
                    <Upload className="h-4 w-4" />
                    {t.nav.publishPost}
                  </button>
                )}
                <button
                  onClick={async () => {
                    await logout();
                    setIsMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-6 py-4 text-sm font-semibold text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  {t.nav.logout}
                </button>
              </div>
            ) : loading ? (
              <div className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-app-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t.nav.loading}
              </div>
            ) : (
              <button
                onClick={() => {
                  onAuthClick();
                  setIsMenuOpen(false);
                }}
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-app-accent px-6 py-4 text-sm font-semibold text-app-bg"
              >
                <Users className="h-4 w-4" />
                {t.nav.signIn}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
