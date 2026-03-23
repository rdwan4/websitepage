import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Book,
  Building2,
  Clock3,
  FileText,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  User,
  Users,
  X,
  ShieldCheck,
  LogIn,
  GraduationCap
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { isNativeApp } from '../lib/runtime';

const labels = {
  en: {
    home: 'Home',
    quran: 'Quran',
    prayer: 'Prayer',
    community: 'Community',
    academy: 'Academy',
    library: 'Library',
    articles: 'Articles',
    account: 'Account',
    admin: 'Admin Console',
    login: 'Sign In',
    logout: 'Logout',
    loading: 'Loading',
    more: 'More',
  },
  ar: {
    home: 'الرئيسية',
    quran: 'القرآن',
    prayer: 'الصلاة',
    community: 'المجتمع',
    academy: 'الأكاديمية',
    library: 'المكتبة',
    articles: 'المقالات',
    account: 'الحساب',
    admin: 'لوحة الإدارة',
    login: 'دخول',
    logout: 'تسجيل الخروج',
    loading: 'جار التحميل',
    more: 'المزيد',
  },
};

export const BottomNav = ({
  lang,
  onAuthClick,
}: {
  lang: 'en' | 'ar';
  onAuthClick: () => void;
}) => {
  const { profile, loading, logout } = useAuth();
  const nativeApp = isNativeApp();
  const location = useLocation();
  const t = labels[lang];
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Moved Prayer to primary links and Academy to the "More" menu
  const primaryLinks = [
    { name: t.home, path: '/', icon: Home },
    { name: t.quran, path: '/quran', icon: Book },
    { name: t.community, path: '/community', icon: Users },
    { name: t.prayer, path: '/prayer', icon: Clock3 },
  ];

  return (
    <>
      <div className={cn('fixed left-1/2 z-50 w-[94%] -translate-x-1/2 md:hidden', nativeApp ? 'bottom-2' : 'bottom-4')}>
        <div className={cn('glass border border-white/10 bg-app-card/90 backdrop-blur-2xl shadow-2xl', nativeApp ? 'rounded-[1.2rem] p-1' : 'rounded-[1.4rem] p-1.5')}>
          <div className="grid grid-cols-5 gap-1">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path} className={cn('flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 transition-all', isActive ? 'bg-app-accent text-app-bg shadow-lg' : 'text-app-muted')}>
                  <Icon className={cn(nativeApp ? 'h-4 w-4' : 'h-5 w-5')} />
                  <span className={cn('font-bold tracking-tight', nativeApp ? 'text-[7.5px]' : 'text-[9.5px]')}>{link.name}</span>
                </Link>
              );
            })}
            <button onClick={() => setIsMoreOpen(true)} className={cn('flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-app-muted')}>
              <Menu className={cn(nativeApp ? 'h-4 w-4' : 'h-5 w-5')} />
              <span className={cn('font-bold tracking-tight', nativeApp ? 'text-[7.5px]' : 'text-[9.5px]')}>{t.more}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMoreOpen(false)} className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm md:hidden" />
            <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className={cn('fixed left-1/2 z-[60] w-[94%] -translate-x-1/2 border border-white/10 bg-app-card shadow-2xl md:hidden', nativeApp ? 'bottom-[4.5rem] rounded-[1.4rem] p-4' : 'bottom-[5.2rem] rounded-[1.8rem] p-5')}>
              <div className="mb-4 flex items-center justify-between px-1">
                <span className="text-xs font-bold text-app-text tracking-widest uppercase">{t.more}</span>
                <button onClick={() => setIsMoreOpen(false)} className="rounded-full bg-white/5 p-1.5 text-app-muted"><X className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Link to="/academy" onClick={() => setIsMoreOpen(false)} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-[13px] font-bold text-app-text"><GraduationCap className="h-5 w-5 text-app-accent" /> {t.academy}</Link>

                <Link to="/articles" onClick={() => setIsMoreOpen(false)} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-[13px] font-bold text-app-text"><FileText className="h-5 w-5 text-app-accent" /> {t.articles}</Link>
                {profile?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setIsMoreOpen(false)} className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] font-black text-emerald-400"><ShieldCheck className="h-5 w-5" /> {t.admin}</Link>
                )}
                {profile ? (
                  <>
                    <Link to="/account" onClick={() => setIsMoreOpen(false)} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-[13px] font-bold text-app-text"><User className="h-5 w-5" /> {t.account}</Link>
                    <button onClick={async () => { await logout(); setIsMoreOpen(false); }} className="flex items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-3 text-[13px] font-bold text-red-300"><LogOut className="h-5 w-5" /> {t.logout}</button>
                  </>
                ) : (
                  <button onClick={() => { setIsMoreOpen(false); onAuthClick(); }} className="col-span-2 flex items-center justify-center gap-3 rounded-2xl bg-app-accent px-4 py-3 text-sm font-black text-app-bg shadow-lg shadow-app-accent/20"><LogIn className="h-5 w-5" /> {t.login}</button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
