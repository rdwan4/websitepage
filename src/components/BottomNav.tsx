import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Book,
  Building2,
  FileText,
  Home,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  User,
  Users,
  Video,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const labels = {
  en: {
    home: 'Home',
    quran: 'Quran',
    academy: 'Academy',
    community: 'Community',
    library: 'Library',
    articles: 'Articles',
    account: 'Account',
    admin: 'Admin',
    login: 'Sign In',
    logout: 'Logout',
    loading: 'Loading',
    more: 'More',
  },
  ar: {
    home: '????????',
    quran: '??????',
    academy: '??????????',
    community: '???????',
    library: '???????',
    articles: '????????',
    account: '??????',
    admin: '???????',
    login: '????',
    logout: '????? ??????',
    loading: '???',
    more: '??????',
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
  const location = useLocation();
  const t = labels[lang];
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const accountLabel = profile?.display_name?.trim() || t.account;

  const primaryLinks = [
    { name: t.home, path: '/', icon: Home },
    { name: t.quran, path: '/quran', icon: Book },
    { name: t.academy, path: '/academy', icon: Video },
    { name: t.community, path: '/community', icon: Users },
  ];

  const moreLinks = useMemo(() => {
    const links: Array<{ name: string; path: string; icon: any }> = [
      { name: t.library, path: '/library', icon: Building2 },
      { name: t.articles, path: '/articles', icon: FileText },
    ];

    if (profile) {
      links.push({ name: accountLabel, path: '/account', icon: User });
    }

    if (profile?.role === 'admin') {
      links.push({ name: t.admin, path: '/admin', icon: LayoutDashboard });
    }

    return links;
  }, [accountLabel, profile, t.admin, t.articles, t.library]);

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 w-[96%] -translate-x-1/2 md:hidden">
        <div className="glass rounded-[1.4rem] border border-white/10 bg-app-card/90 p-2 shadow-2xl backdrop-blur-xl">
          <div className="grid grid-cols-5 gap-1">
            {primaryLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl p-2 transition-all',
                    isActive
                      ? 'bg-app-accent text-app-bg shadow-lg shadow-app-accent/20'
                      : 'text-app-muted hover:text-app-accent'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-bold">{link.name}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setIsMoreOpen(true)}
              className="flex flex-col items-center gap-1 rounded-xl p-2 text-app-muted transition-colors hover:text-app-accent"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-bold">{t.more}</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMoreOpen && (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreOpen(false)}
              className="fixed inset-0 z-[55] bg-black/45 md:hidden"
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="fixed bottom-24 left-1/2 z-[60] w-[96%] -translate-x-1/2 rounded-2xl border border-white/10 bg-app-card p-3 shadow-2xl md:hidden"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-bold text-app-text">{t.more}</span>
                <button onClick={() => setIsMoreOpen(false)} className="rounded-lg p-1 text-app-muted hover:text-app-text">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {moreLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-app-text"
                    >
                      <Icon className="h-4 w-4 text-app-accent" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}

                {!profile &&
                  (loading ? (
                    <div className="col-span-2 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-app-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t.loading}
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMoreOpen(false);
                        onAuthClick();
                      }}
                      className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-app-accent px-3 py-2 text-sm font-bold text-app-bg"
                    >
                      <User className="h-4 w-4" />
                      {t.login}
                    </button>
                  ))}

                {profile && (
                  <button
                    onClick={async () => {
                      await logout();
                      setIsMoreOpen(false);
                    }}
                    className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm font-bold text-red-300"
                  >
                    <LogOut className="h-4 w-4" />
                    {t.logout}
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
