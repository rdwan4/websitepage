import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Book,
  Clock3,
  FileText,
  Languages,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Shield,
  Sun,
  Users,
  X,
  LogIn,
  Upload,
  UserCircle2,
  GraduationCap
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { isNativeApp } from '../lib/runtime';
import { ContentCategory } from '../types';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';
type Theme = 'light' | 'dark';

const translations = {
  en: {
    name: siteLinks.brand.shortEn,
    arabic: 'Arabic',
    english: 'English',
    signIn: 'Sign In',
    account: 'Account',
    publish: 'Publish',
    nav: {
      quran: 'Quran',
      prayer: 'Prayer',
      community: 'Community',
      academy: 'Academy',

      articles: 'Articles',
      admin: 'Dashboard'
    }
  },
  ar: {
    name: siteLinks.brand.shortAr,
    arabic: 'العربية',
    english: 'English',
    signIn: 'دخول',
    account: 'الحساب',
    publish: 'نشر',
    nav: {
      quran: 'القرآن',
      prayer: 'الصلاة',
      community: 'المجتمع',
      academy: 'الأكاديمية',

      articles: 'المقالات',
      admin: 'الإدارة'
    }
  },
};

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
  onCreatePost: (category?: string, filter?: 'sidebar' | 'non-sidebar' | 'all') => void;
}) => {
  const { profile, logout } = useAuth();
  const nativeApp = isNativeApp();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const location = useLocation();
  const t = translations[lang];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // APP VERSION: Clean floating buttons
  if (nativeApp) {
    return (
      <div className="fixed top-4 left-0 right-0 z-50 px-4 flex items-center justify-between pointer-events-none">
        <Link to="/" className="pointer-events-auto h-10 w-10 flex items-center justify-center rounded-xl bg-app-card/40 backdrop-blur-md border border-white/10 shadow-lg">
          <img src="/favicon.svg" alt="Logo" className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-2 pointer-events-auto">
          <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="h-10 px-3 rounded-xl bg-app-card/40 backdrop-blur-md border border-white/10 text-[10px] font-black text-app-text shadow-lg active:scale-95">{lang === 'en' ? 'AR' : 'EN'}</button>
          <button onClick={toggleTheme} className="h-10 w-10 flex items-center justify-center rounded-xl bg-app-card/40 backdrop-blur-md border border-white/10 text-app-accent shadow-lg active:scale-95">{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
        </div>
      </div>
    );
  }

  // WEBSITE VERSION: Full professional navbar
  const navLinks = [
    { name: t.nav.quran, path: '/quran', icon: Book },
    { name: t.nav.prayer, path: '/prayer', icon: Clock3 },
    { name: t.nav.community, path: '/community', icon: Users },
    { name: t.nav.academy, path: '/academy', icon: GraduationCap },

    { name: t.nav.articles, path: '/articles', icon: FileText },
  ];

  return (
    <nav className={cn('fixed left-1/2 z-50 w-full max-w-[96%] -translate-x-1/2 transition-all duration-500', isScrolled ? 'top-4' : 'top-8')}>
      <div className={cn('relative flex items-center justify-between transition-all duration-500 shadow-2xl p-4 md:px-10 rounded-[2.5rem]', isScrolled ? 'glass py-5' : 'bg-white/[0.02] border border-white/5 py-7')}>

        {/* LOGO */}
        <Link to="/" className={cn('flex items-center gap-4', lang === 'ar' && 'flex-row-reverse')}>
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-app-card/80 p-1.5 shadow-lg"><img src="/favicon.svg" className="h-full w-full object-contain" /></div>
          <div className={cn("flex flex-col leading-none", lang === 'ar' && "items-end")}>
            <span className="font-serif text-xl font-black text-app-text tracking-tight">{t.name}</span>
            <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-app-accent">{siteLinks.brand.taglineEn}</span>
          </div>
        </Link>

        {/* DESKTOP LINKS */}
        <div className={cn('hidden items-center gap-6 xl:gap-8 lg:flex', lang === 'ar' && 'flex-row-reverse')}>
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} className={cn('text-[13px] xl:text-[14px] font-bold transition-all hover:text-app-accent flex items-center gap-2', location.pathname === link.path ? 'text-app-accent' : 'text-app-text/60')}>
              {link.name}
            </Link>
          ))}
          {profile?.role === 'admin' && (
            <Link to="/admin" className="flex items-center gap-2 rounded-xl bg-app-accent/10 px-4 py-2 text-[13px] font-black text-app-accent border border-app-accent/20"><Shield className="h-4 w-4" />{t.nav.admin}</Link>
          )}
        </div>

        {/* RIGHT ACTIONS */}
        <div className={cn('flex items-center gap-4', lang === 'ar' && 'flex-row-reverse')}>
          <div className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-2xl bg-white/5 border border-white/5">
            <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="h-10 px-4 text-xs font-black text-app-text hover:text-app-accent">{lang === 'en' ? 'AR' : 'EN'}</button>
            <div className="w-px h-4 bg-white/10" />
            <button onClick={toggleTheme} className="h-10 w-10 flex items-center justify-center text-app-accent">{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
          </div>

          {/* ADMIN PUBLISH BUTTON */}
          {profile?.role === 'admin' && (
            <div className="relative">
              <button onClick={() => setIsPublishOpen(!isPublishOpen)} className="flex items-center gap-2 rounded-xl bg-app-accent px-5 py-3 text-xs font-black text-app-bg shadow-lg shadow-app-accent/20 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest">
                <Upload className="h-4 w-4" />{t.publish}
              </button>
              <AnimatePresence>
                {isPublishOpen && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={cn("absolute top-full mt-3 w-56 rounded-2xl bg-app-card border border-white/10 p-2 shadow-2xl z-[60]", lang === 'ar' ? 'left-0' : 'right-0')}>
                    <div className="px-3 py-1.5 text-[9px] font-black uppercase text-app-muted/50 tracking-widest border-b border-white/5 mb-1">Sidebar Sections</div>
                    <button onClick={() => { onCreatePost('hadith', 'sidebar'); setIsPublishOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-bold text-app-text">📜 Daily Hadith</button>
                    <button onClick={() => { onCreatePost('dua', 'sidebar'); setIsPublishOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-bold text-app-text">🤲 Daily Dua</button>
                    <button onClick={() => { onCreatePost('inspiration', 'sidebar'); setIsPublishOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-bold text-app-text">✨ Inspiration</button>

                    <div className="px-3 py-1.5 text-[9px] font-black uppercase text-app-muted/50 tracking-widest border-y border-white/5 my-1">Page Sections</div>
                    <button onClick={() => { onCreatePost('articles', 'non-sidebar'); setIsPublishOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-bold text-app-text">📝 Articles</button>
                    <button onClick={() => { onCreatePost('academy', 'non-sidebar'); setIsPublishOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-bold text-app-text">🎓 Academy</button>
                    <button onClick={() => { onCreatePost('community', 'non-sidebar'); setIsPublishOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-bold text-app-text">🤝 Community</button>
                    <button onClick={() => { onCreatePost(undefined, 'all'); setIsPublishOpen(false); }} className="w-full text-left p-2.5 rounded-xl hover:bg-white/5 text-[13px] font-bold text-app-text italic">🌐 Custom / All</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {profile ? (
            <Link to="/account" className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 pl-2 pr-5 py-2 hover:bg-white/10">
              <div className="h-10 w-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-black shadow-lg">{profile.display_name?.[0]}</div>
              <span className="hidden md:block text-sm font-bold text-app-text">{t.account}</span>
            </Link>
          ) : (
            <button onClick={onAuthClick} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-6 py-3.5 text-sm font-bold text-app-text hover:bg-white/10 active:scale-95 transition-all"><LogIn className="h-5 w-5" />{t.signIn}</button>
          )}

          <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-app-text lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
        </div>
      </div>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }} className="fixed inset-0 z-40 bg-app-bg flex flex-col p-10 lg:hidden">
            <div className="flex justify-between items-center mb-10">
              <span className="text-2xl font-serif font-black">{t.name}</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 rounded-xl bg-white/5"><X className="h-6 w-6" /></button>
            </div>
            <div className="flex flex-col gap-6">
              {navLinks.map(link => (
                <Link key={link.path} to={link.path} onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-app-text/80 hover:text-app-accent">{link.name}</Link>
              ))}
              {profile?.role === 'admin' && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="text-2xl font-bold text-app-accent">{t.nav.admin}</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
