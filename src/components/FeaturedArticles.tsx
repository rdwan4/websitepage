import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Clock, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';

type Language = 'en' | 'ar';

const translations = {
  en: {
    articles: {
      title: 'Insightful Articles',
      subtitle: 'Deep dives into Islamic jurisprudence, history, and contemporary issues.',
      viewAll: 'Read All Articles'
    }
  },
  ar: {
    articles: {
      title: 'مقالات ملهمة',
      subtitle: 'تعمق في الفقه الإسلامي والتاريخ والقضايا المعاصرة.',
      viewAll: 'اقرأ جميع المقالات'
    }
  }
};

interface CourseGroup {
  key: string;
  title: string;
  posts: Post[];
  startPost: Post;
  previewPost: Post;
}

const isArticlesCategory = (post: Post) => {
  const value = (post.category?.slug || post.category?.name || post.category?.name_ar || '').trim().toLowerCase();
  return value === 'articles' || value === 'article' || value === 'مقالات' || value === 'المقالات';
};

export const FeaturedArticles = ({ lang }: { lang: Language }) => {
  const [articles, setArticles] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const t = translations[lang].articles;

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const data = await postService.getPosts({
          is_approved: true,
          limit: 24,
          orderBy: 'created_at',
        });
        setArticles(data.filter((item) => isArticlesCategory(item)));
      } catch (error) {
        console.error('Error fetching featured articles:', error);
      } finally {
        setLoading(false);
      }
    };
    void fetchArticles();
  }, []);

  const groupedCourses = useMemo<CourseGroup[]>(() => {
    const grouped = new Map<string, Post[]>();

    articles.forEach((post) => {
      const key =
        post.parent_post_id ||
        (post.series_slug
          ? `series:${post.series_slug}`
          : `category:${post.category?.slug || post.category_id || 'uncategorized'}`);
      const list = grouped.get(key) || [];
      list.push(post);
      grouped.set(key, list);
    });

    return Array.from(grouped.entries())
      .map(([key, posts]) => {
        const sorted = [...posts].sort((a, b) => {
          const orderA = a.lesson_order || 1;
          const orderB = b.lesson_order || 1;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const startPost = key.startsWith('post:') ? sorted[0] : sorted.find((item) => item.id === key) || sorted[0];
        const previewPost = sorted[0];

        return {
          key,
          title: previewPost.series_title || startPost.title,
          posts: sorted,
          startPost,
          previewPost,
        };
      })
      .slice(0, 3);
  }, [articles]);

  if (loading && groupedCourses.length === 0) return null;
  if (!loading && groupedCourses.length === 0) return null;

  return (
    <section className="py-32 bg-app-bg/50 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className={cn('flex flex-col md:flex-row justify-between items-end mb-20 gap-8', lang === 'ar' && 'md:flex-row-reverse text-right')}>
          <div className="max-w-2xl">
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-app-accent font-bold uppercase tracking-widest text-xs mb-4 block"
            >
              {lang === 'en' ? 'Knowledge Base' : 'قاعدة المعرفة'}
            </motion.span>
            <h2 className="font-serif text-5xl md:text-6xl text-app-text mb-6 leading-tight">{t.title}</h2>
            <p className="text-app-muted text-lg">{t.subtitle}</p>
          </div>
          <Link to="/articles" className={cn('group flex items-center gap-3 text-app-text font-bold text-lg hover:text-app-accent transition-all', lang === 'ar' && 'flex-row-reverse')}>
            <span className="border-b-2 border-white/10 group-hover:border-app-accent transition-all pb-1">{t.viewAll}</span>
            <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-app-accent group-hover:text-app-bg group-hover:border-app-accent transition-all">
              {lang === 'en' ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            </div>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {groupedCourses.map((course, i) => (
            <motion.div
              key={course.key}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={cn('group cursor-pointer bg-app-card rounded-[3rem] p-8 border border-white/5 hover:border-app-accent/30 transition-all shadow-xl', lang === 'ar' && 'text-right')}
            >
              <div className="relative aspect-video rounded-[2rem] overflow-hidden mb-8 border border-white/5">
                <img
                  src={course.previewPost.image_url || `https://picsum.photos/seed/${course.startPost.id}/800/600`}
                  alt={course.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className={cn('flex items-center gap-4 text-[10px] text-app-muted mb-4 uppercase tracking-widest font-bold', lang === 'ar' && 'flex-row-reverse')}>
                <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {course.posts.length} {lang === 'en' ? 'Lessons' : 'دروس'}</span>
                <span className="w-1 h-1 bg-white/10 rounded-full" />
                <span className="flex items-center gap-1.5"><User className="w-3 h-3 text-app-accent" /> {course.startPost.author_name || 'Scholar'}</span>
              </div>
              <h3 className="text-2xl font-bold text-app-text mb-4 group-hover:text-app-accent transition-colors leading-tight line-clamp-2">{course.title}</h3>
              <p className="text-app-muted text-sm line-clamp-3 mb-6 leading-relaxed">{course.previewPost.content}</p>
              <Link to="/articles" className="text-app-accent text-xs font-bold hover:underline flex items-center gap-2">
                {lang === 'en' ? 'Open Article' : 'فتح المقال'}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
