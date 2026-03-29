import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  ExternalLink,
  Heart,
  Loader2,
  Plus,
  Quote,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { contentService } from '../services/contentService';
import { postService } from '../services/postService';
import { ContentCategory, DailyCollectionEntry, DailyContentSet, Post } from '../types';
import { useLocation, useNavigate } from 'react-router-dom';
import { isNativeApp } from '../lib/runtime';

type Language = 'en' | 'ar';
type ActionId = ContentCategory | 'dhikr';

const translations = {
  en: {
    inspiration: { title: 'Daily Inspiration' },
    hadith: { title: 'Daily Hadith' },
    dua: { title: 'Daily Dua' },
    dhikr: {
      title: 'Daily Dhikr Focus',
      phrases: ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah'],
      count: 'Count',
      reset: 'Reset Counter',
      change: 'Change Phrase',
      subtitle: 'A calmer daily dhikr space.',
    },
    latestPosts: 'Latest Posts',
    createHere: 'Add To This Section',
    emptyPosts: 'No posts have been published in this section yet.',
    openPdf: 'Open PDF',
    watchVideo: 'Watch Video',
    viewMedia: 'Open Media',
    source: 'Source',
    authenticity: 'Authenticity',
    empty: 'No verified entries are published for today yet.',
  },
  ar: {
    inspiration: { title: 'إلهام اليوم' },
    hadith: { title: 'حديث اليوم' },
    dua: { title: 'دعاء اليوم' },
    dhikr: {
      title: 'ذكر اليوم',
      phrases: ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله'],
      count: 'العدد',
      reset: 'إعادة الضبط',
      change: 'تغيير الذكر',
      subtitle: 'ركن يومي خفيف يركز على الذكر بدون ازدحام في الشاشة.',
    },
    latestPosts: 'أحدث المنشورات',
    createHere: 'أضف إلى هذا القسم',
    emptyPosts: 'لا توجد منشورات منشورة في هذا القسم بعد.',
    openPdf: 'فتح PDF',
    watchVideo: 'مشاهدة الفيديو',
    viewMedia: 'فتح الوسائط',
    source: 'المصدر',
    authenticity: 'التوثيق',
    empty: 'لا توجد مواد موثقة منشورة لهذا اليوم بعد.',
  },
};

const actionToCategory: Record<ContentCategory, keyof typeof translations.en> = {
  inspiration: 'inspiration',
  hadith: 'hadith',
  dua: 'dua',
};

const getEntryTitle = (entry: DailyCollectionEntry, lang: Language) =>
  lang === 'ar' ? entry.title_ar || entry.title : entry.title;

const getEntryBody = (entry: DailyCollectionEntry, lang: Language) =>
  lang === 'ar' ? entry.arabic_text || entry.english_text : entry.english_text;

const getPostActionLabel = (post: Post, lang: Language) => {
  if (post.post_type === 'pdf') return translations[lang].openPdf;
  if (post.post_type === 'video') return translations[lang].watchVideo;
  return translations[lang].viewMedia;
};

const groupSidebarPosts = (items: Post[]): Post[] => {
  const grouped = new Map<string, Post[]>();

  items.forEach((post) => {
    const key = post.parent_post_id || post.series_slug || post.id;
    const list = grouped.get(key) || [];
    list.push(post);
    grouped.set(key, list);
  });

  return Array.from(grouped.entries()).map(([key, posts]) => {
    const sorted = [...posts].sort((a, b) => {
      const orderA = a.lesson_order || 1;
      const orderB = b.lesson_order || 1;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return sorted.find((item) => item.id === key) || sorted[0];
  });
};

export const SidebarQuickActions = ({
  lang,
  onCreatePost,
  onCreateQuiz,
}: {
  lang: Language;
  onCreatePost: (category?: string, filter?: 'sidebar' | 'non-sidebar' | 'all') => void;
  onCreateQuiz: () => void;
}) => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const nativeApp = isNativeApp();
  
  const [categoryPosts, setCategoryPosts] = useState<Record<ContentCategory, Post[]>>({
    inspiration: [],
    hadith: [],
    dua: [],
  });
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const t = translations[lang];

  const actions = useMemo(() => {
    const baseActions = [
      { id: 'inspiration' as const, icon: Sparkles, color: 'text-app-accent', bg: 'bg-app-accent/10' },
      { id: 'hadith' as const, icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
      { id: 'dua' as const, icon: Heart, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
      { id: 'dhikr' as const, icon: Quote, color: 'text-gold', bg: 'bg-gold/10' },
    ];

    if (profile?.role === 'admin') {
      return [
        { id: 'create_post' as const, icon: Plus, color: 'text-green-400', bg: 'bg-green-400/10' },
        { id: 'create_quiz' as const, icon: Sparkles, color: 'text-teal-400', bg: 'bg-teal-400/10' },
        ...baseActions,
      ];
    }

    return baseActions;
  }, [profile?.role]);

  const loadSidebarPosts = async () => {
    setLoadingPosts(true);
    try {
      const posts = await postService.getPosts({ is_approved: true, orderBy: 'created_at' });
      setCategoryPosts({
        inspiration: groupSidebarPosts(posts.filter((post) => post.category?.slug === 'inspiration')),
        hadith: groupSidebarPosts(posts.filter((post) => post.category?.slug === 'hadith')),
        dua: groupSidebarPosts(posts.filter((post) => post.category?.slug === 'dua')),
      });
    } catch (error: any) {
      setLoadError(error.message || 'Failed to load posts.');
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    void loadSidebarPosts();
  }, []);

  useEffect(() => {
    const handlePostsUpdated = () => {
      void loadSidebarPosts();
    };

    window.addEventListener('posts-updated', handlePostsUpdated);
    return () => window.removeEventListener('posts-updated', handlePostsUpdated);
  }, []);

  const handleDeleteSidebarPost = async (postId: string) => {
    if (!profile || profile.role !== 'admin' || deletingPostId) return;

    const confirmed = window.confirm(lang === 'en' ? 'Delete this sidebar post?' : 'هل تريد حذف منشور الشريط الجانبي هذا؟');
    if (!confirmed) return;

    try {
      setDeletingPostId(postId);
      await postService.deletePost(postId);
      await loadSidebarPosts();
      window.dispatchEvent(new Event('posts-updated'));
    } catch (error) {
      console.error('Error deleting sidebar post:', error);
      window.alert(lang === 'en' ? 'Unable to delete this post. Please check permissions and try again.' : 'تعذر حذف المنشور. يرجى التحقق من الصلاحيات والمحاولة مرة أخرى.');
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          'glass fixed z-[100] rounded-2xl border border-white/10 p-2',
          'top-1/2 -translate-y-1/2 flex-col gap-2 flex xl:gap-3 max-md:scale-90 max-md:opacity-80 hover:max-md:opacity-100 transition-all',
          (location.pathname === '/prayer' || location.pathname === '/academy') && 'hidden',
          lang === 'ar' ? 'left-2 xl:left-6' : 'right-2 xl:right-6'
        )}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.id === 'create_post') return onCreatePost(undefined, 'all');
              if (action.id === 'create_quiz') return onCreateQuiz();
              // Navigate to Daily Guidance page for these categories
              if (action.id === 'dhikr') {
                navigate('/guidance?tab=dhikr');
              } else {
                navigate(`/guidance?tab=${action.id}`);
              }
            }}
            className={cn(
              'flex items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95',
              nativeApp ? 'h-11 w-11' : 'h-10 w-10 xl:h-12 xl:w-12',
              action.bg,
              action.color
            )}
          >
            <action.icon className={cn(nativeApp ? 'h-[18px] w-[18px]' : 'h-5 w-5 xl:h-6 xl:w-6')} />
          </button>
        ))}
      </div>

    </>
  );
};
