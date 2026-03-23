import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, BookOpen, ScrollText, Heart, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { isNativeApp } from '../lib/runtime';

type Language = 'en' | 'ar';

const translations = {
  en: {
    hero: {
      badge: 'Smart Islamic Platform',
      title: 'Elevate your spirit through visionary knowledge.',
      subtitle: 'A premium ecosystem for Quran, precise prayer times, and community-driven wisdom.',
      cta1: 'Prayer Times',

    },
  },
  ar: {
    hero: {
      badge: 'منصة إسلامية ذكية',
      title: 'ارتقِ بروحك عبر رؤى المعرفة.',
      subtitle: 'نظام متكامل للقرآن، مواقيت الصلاة الدقيقة، والحكمة المجتمعية.',
      cta1: 'مواقيت الصلاة',

    },
  },
};

export const Hero = ({ lang }: { lang: Language }) => {
  const t = translations[lang].hero;
  const nativeApp = isNativeApp();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (nativeApp) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [nativeApp]);

  return (
    <section className={cn(
      'relative flex items-center overflow-hidden bg-app-bg',
      nativeApp ? 'min-h-[45svh] pt-20 pb-10' : 'min-h-[100svh] pt-32 pb-20'
    )}>

      {/* SMART DYNAMIC BACKGROUND */}
      {!nativeApp && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5, rotate: [0, 10, 0] }}
            className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full bg-app-accent/10 blur-[140px]"
          />
          <motion.div
            animate={{ x: -mousePos.x * 0.8, y: -mousePos.y * 0.8 }}
            className="absolute -bottom-48 -left-24 w-[800px] h-[800px] rounded-full bg-blue-500/5 blur-[160px]"
          />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-6">
        <div className={cn('grid grid-cols-1 items-center lg:grid-cols-12 gap-16', lang === 'ar' && 'flex-row-reverse')}>

          <div className={cn('lg:col-span-7', lang === 'ar' ? 'text-right' : 'text-left')}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                'inline-flex items-center gap-3 rounded-full border border-app-accent/20 bg-app-accent/10 px-6 py-2.5 font-black uppercase tracking-[0.25em] text-app-accent text-[10px]',
                nativeApp ? 'mb-4' : 'mb-8'
              )}
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              {t.badge}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'font-bold leading-[1.05] tracking-tighter text-app-text',
                nativeApp ? 'text-4xl' : 'text-6xl sm:text-7xl lg:text-8xl xl:text-[7.5rem]'
              )}
            >
              {lang === 'en' ? (
                <>Elevate your <span className="text-app-accent italic font-medium">Spirit</span></>
              ) : (
                <>ارتقِ بـ <span className="text-app-accent italic font-medium">روحك</span></>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className={cn('text-app-muted leading-relaxed max-w-2xl mt-8 font-medium', nativeApp ? 'text-base' : 'text-xl md:text-2xl')}
            >
              {t.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn('flex flex-col sm:flex-row gap-4 mt-12', lang === 'ar' && 'sm:flex-row-reverse justify-start')}
            >
              <Link to="/prayer" className="group flex items-center justify-center gap-4 rounded-2xl bg-app-accent px-10 py-5 font-black text-app-bg shadow-2xl shadow-app-accent/30 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest text-sm">
                {t.cta1}
                {lang === 'en' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
              </Link>

            </motion.div>

            {!nativeApp && (
              <div className={cn("mt-16 grid grid-cols-3 gap-8 border-t border-white/5 pt-12 max-w-xl", lang === 'ar' && "flex-row-reverse")}>
                <div className={cn(lang === 'ar' && "text-right")}>
                  <Heart className="h-6 w-6 text-app-accent mb-3" />
                  <p className="text-xs font-black text-app-text uppercase tracking-widest">Community</p>
                  <p className="text-[10px] text-app-muted font-bold">10k+ Members</p>
                </div>
                <div className={cn(lang === 'ar' && "text-right")}>
                  <ScrollText className="h-6 w-6 text-indigo-400 mb-3" />
                  <p className="text-xs font-black text-app-text uppercase tracking-widest">Articles</p>
                  <p className="text-[10px] text-app-muted font-bold">Daily Insights</p>
                </div>
                <div className={cn(lang === 'ar' && "text-right")}>
                  <ShieldCheck className="h-6 w-6 text-emerald-400 mb-3" />
                  <p className="text-xs font-black text-app-text uppercase tracking-widest">Verified</p>
                  <p className="text-[10px] text-app-muted font-bold">Authentic Sources</p>
                </div>
              </div>
            )}
          </div>

          {!nativeApp && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="hidden lg:block lg:col-span-5 relative"
            >
              <motion.div
                animate={{ x: mousePos.x * -0.4, y: mousePos.y * -0.4 }}
                className="relative z-20 aspect-[4/5] rounded-[4rem] border-[12px] border-white/5 glass shadow-2xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(21,195,154,0.28),_transparent_35%),linear-gradient(160deg,_rgba(6,18,46,0.2),_rgba(6,18,46,0.92))]" />
                <div className="absolute inset-x-8 top-10 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-app-accent">Islamic Light</p>
                  <p className="mt-3 text-2xl font-bold text-app-text">Quran, prayer, and clear Islamic learning.</p>
                  <p className="mt-3 text-sm leading-relaxed text-app-muted">A clearer public identity helps users trust the site and makes the platform look complete.</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent" />

                {/* FLOATING SMART CARD */}
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute bottom-10 left-8 right-10 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-app-accent flex items-center justify-center text-app-bg shadow-xl">
                      <BookOpen className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-app-accent">Featured Topic</p>
                      <p className="text-lg font-bold text-app-text">The Path of Wisdom</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              {/* ACCENT CIRCLE */}
              <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full border border-app-accent/20 animate-spin-slow -z-10" />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};
