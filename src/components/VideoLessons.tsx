import React from 'react';
import { motion } from 'motion/react';
import { Play, ArrowRight, ArrowLeft, Clock, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { Post } from '../types';

type Language = 'en' | 'ar';

const translations = {
  en: {
    lessons: {
      title: 'Vision Academy',
      subtitle: 'Immersive learning experiences designed to deepen your understanding.',
      viewAll: 'Explore Academy'
    }
  },
  ar: {
    lessons: {
      title: 'أكاديمية الرؤية',
      subtitle: 'تجارب تعليمية غامرة مصممة لتعميق فهمك.',
      viewAll: 'استكشف الأكاديمية'
    }
  }
};

export const VideoLessons = ({ lang, lessons }: { lang: Language, lessons: Post[] }) => {
  const t = translations[lang].lessons;
  
  const displayLessons = lessons.length > 0 ? lessons : [
    { title: lang === 'en' ? "Understanding Surah Al-Fatiha" : "فهم سورة الفاتحة", author_id: "system", duration: "15:20", views_count: 1200, image_url: "https://picsum.photos/seed/lesson1/800/600" },
    { title: lang === 'en' ? "The Life of the Prophet (PBUH)" : "سيرة النبي صلى الله عليه وسلم", author_id: "system", duration: "45:00", views_count: 3400, image_url: "https://picsum.photos/seed/lesson2/800/600" },
    { title: lang === 'en' ? "Islamic Ethics in Daily Life" : "الأخلاق الإسلامية في الحياة اليومية", author_id: "system", duration: "22:15", views_count: 850, image_url: "https://picsum.photos/seed/lesson3/800/600" },
  ];

  return (
    <section id="lessons" className="py-32 bg-app-bg relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className={cn("flex flex-col md:flex-row justify-between items-end mb-20 gap-8", lang === 'ar' && "md:flex-row-reverse text-right")}>
          <div className="max-w-2xl">
            <motion.span 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-app-accent font-bold uppercase tracking-widest text-xs mb-4 block"
            >
              {lang === 'en' ? 'Curated Content' : 'محتوى مختار'}
            </motion.span>
            <h2 className="font-serif text-5xl md:text-6xl text-app-text mb-6 leading-tight">{t.title}</h2>
            <p className="text-app-muted text-lg">{t.subtitle}</p>
          </div>
          <Link to="/academy" className={cn("group flex items-center gap-3 text-app-text font-bold text-lg hover:text-app-accent transition-all", lang === 'ar' && "flex-row-reverse")}>
            <span className="border-b-2 border-white/10 group-hover:border-app-accent transition-all pb-1">{t.viewAll}</span>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-app-accent group-hover:text-app-bg group-hover:border-app-accent transition-all">
              {lang === 'en' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {displayLessons.map((lesson: any, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={cn("group cursor-pointer", lang === 'ar' && "text-right")}
            >
              <div className="relative aspect-[4/3] rounded-[2.5rem] overflow-hidden mb-8 shadow-2xl shadow-black/20 border border-white/5">
                <img src={lesson.image_url} alt={lesson.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 bg-app-bg/0 group-hover:bg-app-bg/40 transition-all duration-500 flex items-center justify-center">
                  <div className="w-16 h-16 glass rounded-full flex items-center justify-center shadow-2xl transform scale-0 group-hover:scale-100 transition-all duration-500">
                    <Play className="w-6 h-6 text-app-accent fill-app-accent" />
                  </div>
                </div>
                {lesson.duration && (
                  <div className={cn("absolute top-6 bg-app-card/90 backdrop-blur-md text-app-text text-[10px] font-bold px-4 py-2 rounded-full shadow-sm border border-white/10", lang === 'en' ? "right-6" : "left-6")}>
                    {lesson.duration}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-app-text mb-3 group-hover:text-app-accent transition-colors leading-tight">{lesson.title}</h3>
              <div className={cn("flex items-center gap-4 text-sm text-app-muted", lang === 'ar' && "flex-row-reverse")}>
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-app-card" />
                  {lesson.author_name || (lang === 'en' ? 'Teacher' : 'معلم')}
                </span>
                <span className="w-1 h-1 bg-white/10 rounded-full" />
                <span>{lesson.views_count} {lang === 'en' ? 'views' : 'مشاهدة'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
