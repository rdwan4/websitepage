import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock,
  Clock3,
  ScrollText,
  Users,
  ChevronRight,
  Book,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { buildPostPath } from '../lib/postRoutes';
import { isNativeApp } from '../lib/runtime';

type Language = 'en' | 'ar';
type HomeSectionKey = 'articles' | 'prayer' | 'community' | 'quran';

interface HomeSectionGroup {
  key: HomeSectionKey;
  route: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: typeof ScrollText;
  previewPost?: Post;
  postCount?: number;
}

const translations = {
  en: {
    eyebrow: 'Our Ecosystem',
    title: 'Daily Knowledge Quiz',
    subtitle: 'Access prayer times, sacred texts, and community lessons in one unified experience.',
    browseAll: 'See Community Activity',
    sections: {
      articles: { title: 'Insights', subtitle: 'Deep Islamic reading and reflection.', cta: 'Read Articles' },
      prayer: { title: 'Prayer Time', subtitle: 'Location-aware schedule and azan.', cta: 'Check Times' },

      community: { title: 'Community', subtitle: 'Shared learning and global updates.', cta: 'Join Feed' },
      quran: { title: 'Quran', subtitle: 'Explore the holy book.', cta: 'Read Quran' },
    },
  },
  ar: {
    eyebrow: 'منصتنا المتكاملة',
    title: 'اختبار المعرفة اليومي',
    subtitle: 'الوصول لمواقيت الصلاة، النصوص المقدسة، ودروس المجتمع في تجربة واحدة متكاملة.',
    browseAll: 'مشاهدة نشاط المجتمع',
    sections: {
      articles: { title: 'تأملات', subtitle: 'قراءة وتأملات إسلامية معمقة.', cta: 'اقرأ المقالات' },
      prayer: { title: 'مواقيت الصلاة', subtitle: 'مواقيت دقيقة حسب موقعك مع الأذان.', cta: 'افتح المواقيت' },

      community: { title: 'المجتمع', subtitle: 'منشورات ودروس ومشاركة في التعلم.', cta: 'انضم للمجتمع' },
      quran: { title: 'القرآن', subtitle: 'استكشف الكتاب المقدس.', cta: 'اقرأ القرآن' },
    },
  },
};

const sectionMeta: Record<HomeSectionKey, { route: string; icon: typeof ScrollText; color: string }> = {
  articles: { route: '/articles', icon: ScrollText, color: 'from-blue-500/20' },
  prayer: { route: '/prayer', icon: Clock3, color: 'from-emerald-500/20' },

  community: { route: '/community', icon: Users, color: 'from-indigo-500/20' },
  quran: { route: '/quran', icon: BookOpen, color: 'from-yellow-500/20' },
};

export const FeaturedArticles = ({ lang }: { lang: Language }) => {
  const nativeApp = isNativeApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  useEffect(() => {
    void (async () => {
      try {
        const data = await postService.getPosts({ is_approved: true, limit: 30 });
        setPosts(data);
      } finally { setLoading(false); }
    })();
  }, []);

  const featuredSections = useMemo<HomeSectionGroup[]>(() => {
    return (['articles', 'prayer', 'community', 'quran'] as HomeSectionKey[]).map(key => ({
      key,
      route: sectionMeta[key].route,
      title: t.sections[key].title,
      subtitle: t.sections[key].subtitle,
      cta: t.sections[key].cta,
      icon: sectionMeta[key].icon,
      postCount: posts.filter(p => p.category?.slug === key).length || (key === 'prayer' ? 1 : 5)
    }));
  }, [posts, t]);

  return (
    <section className="bg-app-bg py-24 md:py-32">
      <div className="container mx-auto px-6">
        <div className={cn("mb-16 flex flex-col justify-between gap-8 md:flex-row md:items-end", lang === 'ar' && "text-right md:flex-row-reverse")}>
          <div className="max-w-3xl">
            <div className={cn("flex items-center gap-2 mb-4", lang === 'ar' && "flex-row-reverse")}>
              <Sparkles className="h-4 w-4 text-app-accent" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-app-accent">{t.eyebrow}</span>
            </div>
            <h2 className="text-5xl font-bold tracking-tight text-app-text sm:text-7xl leading-[1.1]">{t.title}</h2>
            <p className="mt-6 text-lg md:text-xl text-app-muted leading-relaxed max-w-2xl">{t.subtitle}</p>
          </div>

          <Link to="/community" className={cn("group flex items-center gap-4 bg-white/5 py-4 pl-6 pr-8 rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all", lang === 'ar' && "flex-row-reverse")}>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-app-accent text-app-bg">
              {lang === 'en' ? <ArrowRight className="h-6 w-6" /> : <ArrowLeft className="h-6 w-6" />}
            </div>
            <span className="font-bold text-app-text">{t.browseAll}</span>
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {featuredSections.map((section, i) => {
            const Meta = sectionMeta[section.key];
            const Icon = Meta.icon;

            return (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group relative overflow-hidden rounded-[3rem] border border-white/5 bg-app-card p-10 shadow-2xl transition-all hover:border-app-accent/30"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover:opacity-100", Meta.color)} />

                <div className={cn("relative z-10 flex flex-col h-full", lang === 'ar' && "text-right")}>
                  <div className={cn("mb-10 flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/5 text-app-accent shadow-inner">
                      <Icon className="h-10 w-10" />
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-app-muted">
                      <Clock className="h-3.5 w-3.5" />
                      {section.postCount} {lang === 'en' ? 'Modules' : 'وحدة'}
                    </div>
                  </div>

                  <h3 className="text-4xl font-bold text-app-text mb-4 tracking-tight group-hover:text-app-accent transition-colors">{section.title}</h3>
                  <p className="text-lg text-app-muted leading-relaxed mb-10 max-w-md">{section.subtitle}</p>

                  <Link to={section.route} className={cn("mt-auto flex items-center gap-3 w-fit rounded-2xl bg-app-bg border border-white/5 px-8 py-4 text-sm font-bold tracking-widest uppercase transition-all hover:bg-app-accent hover:text-app-bg shadow-xl", lang === 'ar' && "flex-row-reverse mr-auto ml-0")}>
                    {section.cta}
                    <ChevronRight className={cn("h-4 w-4", lang === 'ar' && "rotate-180")} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};