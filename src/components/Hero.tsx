import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

type Language = 'en' | 'ar';

const translations = {
  en: {
    hero: {
      badge: 'Welcome to Islamic Vision',
      title: 'Nurturing the Heart and Mind through Knowledge.',
      subtitle: 'Explore a world of Islamic lessons, insightful articles, and timeless books. Join our community of learners and visionaries today.',
      cta1: 'Start Learning',
      cta2: 'Browse Library'
    }
  },
  ar: {
    hero: {
      badge: 'مرحباً بكم في رؤى إسلامية',
      title: 'تنمية القلب والعقل من خلال المعرفة.',
      subtitle: 'استكشف عالماً من الدروس الإسلامية، المقالات الملهمة، والكتب الخالدة. انضم إلى مجتمعنا من المتعلمين والمبدعين اليوم.',
      cta1: 'ابدأ التعلم',
      cta2: 'تصفح المكتبة'
    }
  }
};

export const Hero = ({ lang }: { lang: Language }) => {
  const t = translations[lang].hero;
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative pt-40 pb-32 overflow-hidden bg-app-bg min-h-screen flex items-center">
      <motion.div 
        animate={{ 
          x: mousePos.x * 0.2, 
          y: mousePos.y * 0.2,
          rotate: [0, 5, 0]
        }}
        className="absolute top-20 right-[10%] w-96 h-96 bg-app-accent/10 rounded-full blur-[120px] -z-10"
      />
      <motion.div 
        animate={{ 
          x: -mousePos.x * 0.3, 
          y: -mousePos.y * 0.3 
        }}
        className="absolute bottom-20 left-[5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] -z-10"
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-16 items-center", lang === 'ar' && "flex-row-reverse")}>
          <div className={cn("lg:col-span-7", lang === 'ar' ? "order-2 text-right lg:text-right" : "lg:text-left")}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-app-accent/10 text-app-accent text-xs font-bold uppercase tracking-[0.2em] mb-10 border border-app-accent/20"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {t.badge}
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-6xl md:text-[7.5rem] text-app-text leading-[0.9] mb-10 tracking-tight"
            >
              {lang === 'en' ? (
                <>Elevate your <span className="text-app-accent italic font-normal">Spirit</span> through <span className="relative inline-block">Visionary<motion.span className="absolute -bottom-2 left-0 w-full h-1 bg-gold/30 rounded-full" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 1, duration: 1 }} /></span> Knowledge.</>
              ) : (
                <>ارتقِ بـ <span className="text-app-accent italic font-normal">روحك</span> عبر <span className="relative inline-block">رؤى<motion.span className="absolute -bottom-2 right-0 w-full h-1 bg-gold/30 rounded-full" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ delay: 1, duration: 1 }} /></span> المعرفة.</>
              )}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-xl text-app-muted leading-relaxed mb-12 max-w-2xl"
            >
              {t.subtitle}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={cn("flex flex-wrap gap-6", lang === 'ar' && "justify-start flex-row-reverse")}
            >
              <Link to="/academy" className="bg-app-accent text-app-bg px-10 py-5 rounded-2xl font-bold hover:bg-app-accent-hover transition-all flex items-center gap-3 group shadow-2xl shadow-app-accent/20 text-lg">
                {t.cta1}
                {lang === 'en' ? <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
              </Link>
              <Link to="/library" className="bg-white/5 backdrop-blur-md text-app-text border border-white/10 px-10 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all text-lg">
                {t.cta2}
              </Link>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, rotateY: lang === 'en' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={cn("lg:col-span-5 relative", lang === 'ar' && "order-1")}
          >
            <div className="relative group">
              <motion.div 
                animate={{ 
                  x: -mousePos.x * 0.5, 
                  y: -mousePos.y * 0.5 
                }}
                className="relative aspect-[4/5] rounded-[4rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border-[12px] border-white/5 glass"
              >
                <img 
                  src="https://picsum.photos/seed/islamic-vision-hero/1200/1500" 
                  alt="Islamic Vision" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-app-bg/80 via-transparent to-transparent" />
                
                <motion.div 
                  animate={{ 
                    y: [0, -15, 0],
                    x: mousePos.x * 0.2
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute bottom-10 left-10 right-10 glass p-6 rounded-3xl flex items-center gap-5 border-white/10"
                >
                  <div className="w-14 h-14 bg-app-accent rounded-2xl flex items-center justify-center text-app-bg shadow-lg shadow-app-accent/30">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-app-accent uppercase tracking-widest mb-1">{lang === 'en' ? "Today's Hadith" : 'حديث اليوم'}</p>
                    <p className="text-base font-bold text-app-text leading-tight">
                      {lang === 'en' ? '"A good word is charity."' : '"الكلمة الطيبة صدقة"'}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
