import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, Clock, Play, ScrollText, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { buildPostPath } from '../lib/postRoutes';

type Language = 'en' | 'ar';
type HomeSectionKey = 'articles' | 'academy' | 'library' | 'community';

interface HomeSectionGroup {
  key: HomeSectionKey;
  route: string;
  title: string;
  subtitle: string;
  cta: string;
  icon: typeof ScrollText;
  posts: Post[];
  previewPost: Post;
}

const translations = {
  en: {
    eyebrow: 'Platform Preview',
    title: 'Explore the Main Sections',
    subtitle: 'A quick view of articles, academy lessons, library resources, and community posts so visitors understand the platform immediately.',
    browseAll: 'Open Full Platform',
    sections: {
      articles: {
        title: 'Articles',
        subtitle: 'Deep Islamic reading and reflection.',
        cta: 'Open Articles',
      },
      academy: {
        title: 'Academy',
        subtitle: 'Video and audio lessons organized as courses.',
        cta: 'Open Academy',
      },
      library: {
        title: 'Library',
        subtitle: 'Books, PDFs, and study audio in one place.',
        cta: 'Open Library',
      },
      community: {
        title: 'Community',
        subtitle: 'Posts, discussions, and shared learning.',
        cta: 'Open Community',
      },
    },
  },
  ar: {
    eyebrow: 'نظرة على المنصة',
    title: 'استكشف الأقسام الرئيسية',
    subtitle: 'عرض سريع للمقالات والأكاديمية والمكتبة والمجتمع حتى يفهم الزائر فكرة المنصة مباشرة.',
    browseAll: 'فتح المنصة كاملة',
    sections: {
      articles: {
        title: 'المقالات',
        subtitle: 'قراءة وتأملات إسلامية معمقة.',
        cta: 'فتح المقالات',
      },
      academy: {
        title: 'الأكاديمية',
        subtitle: 'دروس فيديو وصوت منظمة كدورات.',
        cta: 'فتح الأكاديمية',
      },
      library: {
        title: 'المكتبة',
        subtitle: 'كتب وملفات PDF ومواد صوتية في مكان واحد.',
        cta: 'فتح المكتبة',
      },
      community: {
        title: 'المجتمع',
        subtitle: 'منشورات ونقاشات ومشاركة في التعلم.',
        cta: 'فتح المجتمع',
      },
    },
  },
};

const sectionMeta: Record<HomeSectionKey, { route: string; icon: typeof ScrollText }> = {
  articles: { route: '/articles', icon: ScrollText },
  academy: { route: '/academy', icon: Play },
  library: { route: '/library', icon: BookOpen },
  community: { route: '/community', icon: Users },
};

const getCategorySlug = (post: Post) =>
  (post.category?.slug || post.category?.name || post.category?.name_ar || '').trim().toLowerCase();

const getSectionKey = (post: Post): HomeSectionKey | null => {
  const slug = getCategorySlug(post);
  if (slug === 'articles' || slug === 'article' || slug === 'المقالات' || slug === 'مقالات') return 'articles';
  if (slug === 'academy' || slug === 'الأكاديمية') return 'academy';
  if (slug === 'library' || slug === 'المكتبة') return 'library';
  if (slug === 'community' || slug === 'المجتمع') return 'community';
  return null;
};

const sortPosts = (posts: Post[]) =>
  [...posts].sort((a, b) => {
    const orderA = a.lesson_order || 1;
    const orderB = b.lesson_order || 1;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

export const FeaturedArticles = ({ lang }: { lang: Language }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[lang];

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const data = await postService.getPosts({
          is_approved: true,
          limit: 40,
          orderBy: 'created_at',
        });
        setPosts(data);
      } catch (error) {
        console.error('Error fetching homepage featured content:', error);
      } finally {
        setLoading(false);
      }
    };

    void fetchPosts();
  }, []);

  const featuredSections = useMemo<HomeSectionGroup[]>(() => {
    const grouped = new Map<HomeSectionKey, Post[]>();

    posts.forEach((post) => {
      const sectionKey = getSectionKey(post);
      if (!sectionKey) return;

      if (sectionKey === 'academy' && post.post_type !== 'video' && post.post_type !== 'audio') return;
      if (sectionKey === 'library' && post.post_type !== 'pdf' && post.post_type !== 'audio') return;

      const list = grouped.get(sectionKey) || [];
      list.push(post);
      grouped.set(sectionKey, list);
    });

    return (['articles', 'academy', 'library', 'community'] as HomeSectionKey[])
      .map((key) => {
        const sectionPosts = sortPosts(grouped.get(key) || []);
        if (sectionPosts.length === 0) return null;

        return {
          key,
          route: sectionMeta[key].route,
          title: t.sections[key].title,
          subtitle: t.sections[key].subtitle,
          cta: t.sections[key].cta,
          icon: sectionMeta[key].icon,
          posts: sectionPosts,
          previewPost: sectionPosts[0],
        };
      })
      .filter(Boolean) as HomeSectionGroup[];
  }, [posts, t]);

  if (loading && featuredSections.length === 0) return null;
  if (!loading && featuredSections.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-app-bg/50 py-32">
      <div className="container mx-auto px-6">
        <div
          className={cn(
            'mb-20 flex flex-col items-end justify-between gap-8 md:flex-row',
            lang === 'ar' && 'text-right md:flex-row-reverse'
          )}
        >
          <div className="max-w-3xl">
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="mb-4 block text-xs font-bold uppercase tracking-widest text-app-accent">
              {t.eyebrow}
            </motion.span>
            <h2 className="mb-6 font-serif text-5xl leading-tight text-app-text md:text-6xl">{t.title}</h2>
            <p className="text-lg text-app-muted">{t.subtitle}</p>
          </div>
          <Link
            to="/community"
            className={cn(
              'group flex items-center gap-3 text-lg font-bold text-app-text transition-all hover:text-app-accent',
              lang === 'ar' && 'flex-row-reverse'
            )}
          >
            <span className="border-b-2 border-white/10 pb-1 transition-all group-hover:border-app-accent">{t.browseAll}</span>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 transition-all group-hover:border-app-accent group-hover:bg-app-accent group-hover:text-app-bg">
              {lang === 'en' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 xl:grid-cols-4">
          {featuredSections.map((section, i) => {
            const SectionIcon = section.icon;
            return (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className={cn(
                  'group flex h-full flex-col rounded-[3rem] border border-white/5 bg-app-card p-8 shadow-xl transition-all hover:border-app-accent/30',
                  lang === 'ar' && 'text-right'
                )}
              >
                <div className="relative mb-8 aspect-video overflow-hidden rounded-[2rem] border border-white/5">
                  {section.previewPost.image_url ? (
                    <img
                      src={section.previewPost.image_url}
                      alt={section.previewPost.title}
                      className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-app-accent/10 via-white/5 to-app-bg">
                      <SectionIcon className="h-14 w-14 text-app-accent/70" />
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'mb-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-app-muted',
                    lang === 'ar' && 'flex-row-reverse'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <SectionIcon className="h-3.5 w-3.5 text-app-accent" />
                    {section.title}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/10" />
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {section.posts.length} {lang === 'en' ? 'items' : 'عناصر'}
                  </span>
                </div>

                <h3 className="mb-3 text-2xl font-bold leading-tight text-app-text transition-colors group-hover:text-app-accent">
                  {section.previewPost.series_title || section.previewPost.title}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-app-muted">{section.subtitle}</p>
                <p className="mb-8 line-clamp-4 flex-1 text-sm leading-relaxed text-app-muted">{section.previewPost.content}</p>

                <Link
                  to={buildPostPath(section.previewPost)}
                  className={cn(
                    'inline-flex items-center gap-2 text-xs font-bold text-app-accent hover:underline',
                    lang === 'ar' && 'flex-row-reverse justify-end'
                  )}
                >
                  {section.cta}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
