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
      subtitle: 'A calmer replacement for the old prayer-time widget.',
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
    minimumWarning: 'Verified dataset below recommended minimum. Import 50+ entries for stable rotation.',
  },

  ar: {
    inspiration: { title: 'إلهام اليوم' },
    hadith: { title: 'حديث اليوم' },
    dua: { title: 'دعاء اليوم' },
    dhikr: {
      title: 'ذكر اليوم',
      phrases: ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله'],
      count: 'العدد',
      reset: 'إعادة ضبط',
      change: 'تغيير الذكر',
      subtitle: 'بديل يومي هادئ بدلاً من واجهة مواقيت الصلاة القديمة.',
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
    minimumWarning: 'قاعدة البيانات الموثقة أقل من الحد الموصى به. أضف 50+ مادة لتدوير ثابت.',
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
  if (post.post_type === 'pdf') {
    return translations[lang].openPdf;
  }
  if (post.post_type === 'video') {
    return translations[lang].watchVideo;
  }
  return translations[lang].viewMedia;
};

const groupSidebarPosts = (items: Post[]): Post[] => {
  const grouped = new Map<string, Post[]>();

  items.forEach((post) => {
    const key =
      post.parent_post_id
        ? `parent:${post.parent_post_id}`
        : post.series_slug
          ? `series:${post.series_slug}`
          : `post:${post.id}`;
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

    if (key.startsWith('post:')) {
      return sorted[0];
    }

    if (key.startsWith('parent:')) {
      const parentId = key.replace('parent:', '');
      return sorted.find((item) => item.id === parentId) || sorted[0];
    }

    return sorted[0];
  });
};

export const SidebarQuickActions = ({
  lang,
  onCreatePost,
  onCreateQuiz,
}: {
  lang: Language;
  onCreatePost: (category?: ContentCategory) => void;
  onCreateQuiz: () => void;
}) => {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState<ActionId | null>(null);
  const [dailySets, setDailySets] = useState<Record<ContentCategory, DailyContentSet | null>>({
    inspiration: null,
    hadith: null,
    dua: null,
  });
  const [categoryPosts, setCategoryPosts] = useState<Record<ContentCategory, Post[]>>({
    inspiration: [],
    hadith: [],
    dua: [],
  });
  const [loadingCategory, setLoadingCategory] = useState<ContentCategory | null>(null);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [dhikrCount, setDhikrCount] = useState(0);
  const [dhikrIndex, setDhikrIndex] = useState(0);
  const [contentIndex, setContentIndex] = useState(0);
  const [postIndex, setPostIndex] = useState(0);
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

  const selectedSet = useMemo(
    () => (isOpen && isOpen !== 'dhikr' ? dailySets[isOpen] : null),
    [dailySets, isOpen]
  );

  const selectedPosts = useMemo(
    () => (isOpen && isOpen !== 'dhikr' ? categoryPosts[isOpen] : []),
    [categoryPosts, isOpen]
  );

  const selectedTitle =
    isOpen && isOpen !== 'dhikr'
      ? (t[actionToCategory[isOpen]] as { title: string }).title
      : '';

  const ensureCategory = async (category: ContentCategory) => {
    if (dailySets[category]) return;

    setLoadingCategory(category);
    setLoadError('');
    try {
      const set = await contentService.getDailyCollection(category);
      setDailySets((current) => ({ ...current, [category]: set }));
    } catch (error: any) {
      setLoadError(error.message || 'Failed to load daily content.');
    } finally {
      setLoadingCategory(null);
    }
  };

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
    void Promise.all([ensureCategory('inspiration'), ensureCategory('hadith'), ensureCategory('dua')]);
    void loadSidebarPosts();
  }, []);

  useEffect(() => {
    const handlePostsUpdated = () => {
      void loadSidebarPosts();
    };

    window.addEventListener('posts-updated', handlePostsUpdated);
    return () => window.removeEventListener('posts-updated', handlePostsUpdated);
  }, []);

  const handleAction = (id: ActionId) => {
    setIsOpen(id);
    setContentIndex(0);
    setPostIndex(0);
    if (id !== 'dhikr') {
      void ensureCategory(id);
    }
  };

  const nextContent = () => {
    if (selectedSet?.items.length) {
      setContentIndex((current) => (current + 1) % selectedSet.items.length);
    }

    if (selectedPosts.length) {
      setPostIndex((current) => (current + 1) % selectedPosts.length);
    }
  };

  const handleDeleteSidebarPost = async (postId: string) => {
    if (!profile || profile.role !== 'admin' || deletingPostId) return;

    const confirmed = window.confirm(
      lang === 'en' ? 'Delete this sidebar post?' : 'هل تريد حذف منشور الشريط الجانبي هذا؟'
    );
    if (!confirmed) return;

    try {
      setDeletingPostId(postId);
      await postService.deletePost(postId);
      await loadSidebarPosts();
      setPostIndex(0);
      window.dispatchEvent(new Event('posts-updated'));
    } catch (error) {
      console.error('Error deleting sidebar post:', error);
      window.alert(
        lang === 'en'
          ? 'Unable to delete this post. Please check permissions and try again.'
          : 'تعذر حذف المنشور. يرجى التحقق من الصلاحيات والمحاولة مرة أخرى.'
      );
    } finally {
      setDeletingPostId(null);
    }
  };

  return (
    <>
      <div
        className={cn(
          'glass fixed z-[100] flex rounded-2xl border border-white/10 p-2',
          'top-1/2 -translate-y-1/2 flex-col gap-2',
          'lg:gap-3',
          lang === 'ar' ? 'left-3 lg:left-6' : 'right-3 lg:right-6'
        )}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              if (action.id === 'create_post') {
                onCreatePost();
                return;
              }
              if (action.id === 'create_quiz') {
                onCreateQuiz();
                return;
              }
              handleAction(action.id as ActionId);
            }}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:scale-110 active:scale-95 lg:h-12 lg:w-12',
              action.bg,
              action.color
            )}
          >
            <action.icon className="h-5 w-5 lg:h-6 lg:w-6" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(null)}
              className="absolute inset-0 bg-app-bg/80 backdrop-blur-xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[3rem] border border-white/10 bg-app-card p-10 shadow-2xl"
            >
              <button
                onClick={() => setIsOpen(null)}
                className="absolute right-6 top-6 rounded-full p-2 text-app-text/40 transition-all hover:bg-white/5 hover:text-app-text"
              >
                <X className="h-5 w-5" />
              </button>

              {isOpen === 'dhikr' ? (
                <div className="text-center">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-gold">{t.dhikr.title}</h3>
                  <p className="mx-auto mb-8 max-w-lg text-sm text-app-muted">{t.dhikr.subtitle}</p>
                  <div className="mb-10">
                    <p className="mb-2 text-3xl font-bold text-app-text">{t.dhikr.phrases[dhikrIndex]}</p>
                    <button
                      onClick={() => {
                        setDhikrIndex((current) => (current + 1) % t.dhikr.phrases.length);
                        setDhikrCount(0);
                      }}
                      className="mx-auto flex items-center justify-center gap-2 text-xs text-app-muted transition-colors hover:text-gold"
                    >
                      <RefreshCw className="h-3 w-3" />
                      {t.dhikr.change}
                    </button>
                  </div>
                  <div
                    onClick={() => setDhikrCount((current) => current + 1)}
                    className="group mx-auto flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-full border-4 border-gold/20 transition-all hover:bg-gold/5 active:scale-95"
                  >
                    <span className="mb-1 font-serif text-5xl text-gold">{dhikrCount}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gold/40 group-hover:text-gold/60">
                      {t.dhikr.count}
                    </span>
                  </div>
                  <button
                    onClick={() => setDhikrCount(0)}
                    className="mt-8 text-xs text-app-muted transition-colors hover:text-red-400"
                  >
                    {t.dhikr.reset}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-8 text-center">
                    <h3
                      className={cn(
                        'mb-3 text-xs font-bold uppercase tracking-[0.2em]',
                        isOpen === 'inspiration'
                          ? 'text-app-accent'
                          : isOpen === 'hadith'
                            ? 'text-indigo-400'
                            : 'text-emerald-400'
                      )}
                    >
                      {selectedTitle}
                    </h3>
                    {profile?.role === 'admin' && (
                      <button
                        onClick={() => onCreatePost(isOpen)}
                        className="rounded-2xl border border-app-accent/20 bg-app-accent/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-app-accent transition-all hover:bg-app-accent/20"
                      >
                        {t.createHere}
                      </button>
                    )}
                  </div>

                  {loadingCategory === isOpen ? (
                    <div className="flex justify-center py-16">
                      <Loader2 className="h-8 w-8 animate-spin text-app-accent" />
                    </div>
                  ) : loadError ? (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
                      {loadError}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {selectedSet?.items.length ? (
                        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`${isOpen}-${contentIndex}`}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="min-h-[220px]"
                            >
                              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-app-accent">
                                {getEntryTitle(selectedSet.items[contentIndex], lang)}
                              </p>
                              <p className="mb-6 text-xl font-bold leading-relaxed text-app-text">
                                {getEntryBody(selectedSet.items[contentIndex], lang)}
                              </p>
                              <div className="space-y-2 rounded-2xl border border-white/10 bg-app-card p-4 text-left">
                                <p className="text-sm text-app-muted">
                                  <span className="font-semibold text-app-text">{t.source}: </span>
                                  {selectedSet.items[contentIndex].source_reference}
                                </p>
                                {selectedSet.items[contentIndex].authenticity_notes && (
                                  <p className="text-sm text-app-muted">
                                    <span className="font-semibold text-app-text">{t.authenticity}: </span>
                                    {selectedSet.items[contentIndex].authenticity_notes}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          </AnimatePresence>

                          

                          <button
                            onClick={nextContent}
                            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-app-card py-4 text-sm font-bold text-app-text transition-all hover:bg-white/10"
                          >
                            <RefreshCw className="h-4 w-4" />
                            {lang === 'en' ? 'Next daily item' : '\u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u064a\u0648\u0645\u064a \u0627\u0644\u062a\u0627\u0644\u064a'}
                          </button>
                        </section>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-app-muted">
                          {t.empty}
                        </div>
                      )}

                      <section>
                        <div className="mb-4 flex items-center justify-between">
                          <h4 className="text-lg font-bold text-app-text">{t.latestPosts}</h4>
                          <div className="flex items-center gap-3">
                            {loadingPosts && <Loader2 className="h-4 w-4 animate-spin text-app-accent" />}
                            <button
                              onClick={() => {
                                void loadSidebarPosts();
                                nextContent();
                              }}
                              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-app-text transition-all hover:bg-white/10"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              {lang === 'en' ? 'Refresh' : '\u062a\u062d\u062f\u064a\u062b'}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {selectedPosts.length ? (
                            <AnimatePresence mode="wait">
                              <motion.article
                                key={`${isOpen}-post-${postIndex}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="rounded-[2rem] border border-white/10 bg-white/5 p-5"
                              >
                                <div className="mb-3 flex items-center justify-between gap-4">
                                  <div>
                                    <h5 className="font-bold text-app-text">{selectedPosts[postIndex]?.title}</h5>
                                    <p className="text-xs text-app-muted">{selectedPosts[postIndex]?.author_name || 'Admin'}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {profile?.role === 'admin' && (
                                      <button
                                        onClick={() => void handleDeleteSidebarPost(selectedPosts[postIndex].id)}
                                        disabled={deletingPostId === selectedPosts[postIndex].id}
                                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-all hover:bg-red-500/20 disabled:opacity-50"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        {lang === 'en' ? 'Delete' : 'حذف'}
                                      </button>
                                    )}
                                    {selectedPosts[postIndex]?.media_url && (
                                      <a
                                        href={selectedPosts[postIndex].media_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-app-accent transition-all hover:bg-white/10"
                                      >
                                        {getPostActionLabel(selectedPosts[postIndex], lang)}
                                        <ExternalLink className="h-3.5 w-3.5" />
                                      </a>
                                    )}
                                  </div>
                                </div>

                                {selectedPosts[postIndex]?.image_url && (
                                  <img
                                    src={selectedPosts[postIndex].image_url}
                                    alt={selectedPosts[postIndex].title}
                                    className="mb-4 h-48 w-full rounded-2xl object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                )}

                                <p className="whitespace-pre-wrap text-sm leading-relaxed text-app-muted">
                                  {selectedPosts[postIndex]?.content}
                                </p>
                              </motion.article>
                            </AnimatePresence>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-app-muted">
                              {t.emptyPosts}
                            </div>
                          )}
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
