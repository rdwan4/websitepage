import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, ImageIcon, Loader2, Plus, Quote, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { isNativeApp } from '../lib/runtime';
import { Post, ContentCategory, GuidanceItem } from '../types';
import { contentService } from '../services/contentService';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';

const copy = {
  en: {
    back: 'Back to Home',
    title: 'Daily Guidance',
    subtitle:
      'A curated space for verified reflections, visual reminders, and short readings that can be managed from the admin area.',
    source: 'Source',
    emptyTitle: 'No guidance cards published yet',
    emptyBody:
      'Publish curated guidance cards from the admin dashboard to populate this page.',
    categories: {
      reflection: 'Reflection',
      story: 'Story',
      gallery: 'Gallery',
      'daily-wisdom': 'Daily Wisdom',
    },
  },
  ar: {
    back: 'العودة إلى الرئيسية',
    title: 'الهداية اليومية',
    subtitle:
      'مساحة منتقاة للتأملات الموثقة والتذكير البصري والقراءات القصيرة، ويمكن إدارتها من لوحة التحكم.',
    source: 'المصدر',
    emptyTitle: 'لا توجد بطاقات منشورة بعد',
    emptyBody: 'انشر بطاقات الهداية من لوحة الإدارة حتى تظهر هنا.',
    categories: {
      reflection: 'تأمل',
      story: 'قصة',
      gallery: 'معرض',
      'daily-wisdom': 'حكمة يومية',
    },
  },
};

const getIcon = (category: GuidanceItem['category']) => {
  switch (category) {
    case 'gallery':
      return ImageIcon;
    case 'story':
      return BookOpen;
    case 'daily-wisdom':
      return Sparkles;
    default:
      return Quote;
  }
};

export const DailyGuidancePage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const { profile } = useAuth();
  const nativeApp = isNativeApp();
  const t = copy[lang];
  const [items, setItems] = useState<GuidanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadCategory, setUploadCategory] = useState<ContentCategory | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await contentService.getGuidanceItems();
      setItems(data);
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load guidance.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGuidance = async (item: GuidanceItem) => {
    if (!profile || deletingId) return;
    const confirmed = window.confirm(lang === 'en' ? 'Delete this item?' : 'هل تريد حذف هذا العنصر؟');
    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      await postService.deletePost(item.id);
      await load();
    } catch (error) {
      console.error('Error deleting guidance:', error);
      alert(lang === 'en' ? 'Failed to delete.' : 'فشل الحذف.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <>
      <div className={cn('min-h-screen bg-app-bg', nativeApp ? 'pt-24 pb-28 md:pb-20' : 'pt-32 pb-20')}>
        <div className="container mx-auto px-6">
          <div className={cn(nativeApp ? 'mb-8 max-w-4xl' : 'mb-14 max-w-4xl', lang === 'ar' && 'text-right mr-auto')}>
            {!nativeApp && (
              <Link
                to="/"
                className={cn(
                  'group mb-6 inline-flex items-center gap-2 text-app-accent hover:underline',
                  lang === 'ar' && 'flex-row-reverse'
                )}
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                {t.back}
              </Link>
            )}
            <h1 className={cn('font-serif leading-tight text-app-text', nativeApp ? 'mb-3 text-3xl md:text-4xl' : 'mb-5 text-6xl md:text-7xl')}>{t.title}</h1>
            {!nativeApp && <p className="max-w-3xl text-xl leading-relaxed text-app-muted">{t.subtitle}</p>}

            {profile?.role === 'admin' && (
              <div className={cn('flex flex-wrap gap-3', nativeApp ? 'mt-4' : 'mt-6')}>
                <button
                  onClick={() => setUploadCategory('inspiration')}
                  className={cn('inline-flex items-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/10 font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/20', nativeApp ? 'px-3 py-2 text-[11px]' : 'px-4 py-2 text-xs')}
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'en' ? 'Upload Inspiration' : 'رفع إلهام'}
                </button>
                <button
                  onClick={() => setUploadCategory('hadith')}
                  className={cn('inline-flex items-center gap-2 rounded-2xl border border-indigo-400/30 bg-indigo-400/10 font-bold uppercase tracking-widest text-indigo-300 hover:bg-indigo-400/20', nativeApp ? 'px-3 py-2 text-[11px]' : 'px-4 py-2 text-xs')}
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'en' ? 'Upload Hadith' : 'رفع حديث'}
                </button>
                <button
                  onClick={() => setUploadCategory('dua')}
                  className={cn('inline-flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 font-bold uppercase tracking-widest text-emerald-300 hover:bg-emerald-400/20', nativeApp ? 'px-3 py-2 text-[11px]' : 'px-4 py-2 text-xs')}
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'en' ? 'Upload Dua' : 'رفع دعاء'}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-app-accent" />
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-[3rem] border border-dashed border-white/10 bg-app-card p-12 text-center">
              <h2 className="mb-3 text-2xl font-bold text-app-text">{t.emptyTitle}</h2>
              <p className="text-app-muted">{t.emptyBody}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((item, index) => {
                const Icon = getIcon(item.category);
                const title = lang === 'ar' ? item.title_ar : item.title_en;
                const summary = lang === 'ar' ? item.summary_ar : item.summary_en;
                const body = lang === 'ar' ? item.body_ar : item.body_en;
                const accentLabel =
                  lang === 'ar'
                    ? item.accent_label_ar || t.categories[item.category]
                    : item.accent_label_en || t.categories[item.category];

                return (
                  <motion.article
                    key={item.id}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-app-card shadow-xl"
                  >
                    {item.image_url && (
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={item.image_url} alt={title} className="h-full w-full object-cover" />
                      </div>
                    )}

                    <div className="p-8">
                      <div
                        className={cn(
                          'mb-5 flex items-center justify-between gap-3',
                          lang === 'ar' && 'flex-row-reverse'
                        )}
                      >
                        <span className="rounded-full bg-app-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-app-accent">
                          {accentLabel}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-app-text">
                          <Icon className="h-5 w-5" />
                        </div>
                      </div>

                      <h2 className="mb-4 text-2xl font-bold text-app-text">{title}</h2>
                      <p className="mb-3 text-sm leading-relaxed text-app-muted">{summary}</p>
                      <div className="mb-6 whitespace-pre-line text-sm leading-7 text-app-text/90">{body}</div>

                      <div className={cn("flex items-center justify-between border-t border-white/5 pt-6", lang === 'ar' && "flex-row-reverse")}>
                        {item.source_reference ? (
                          <div className="text-xs text-app-muted font-bold">
                            <span className="text-app-text opacity-50">{t.source}: </span>
                            {item.source_reference}
                          </div>
                        ) : <div />}

                        {profile?.role === 'admin' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleDeleteGuidance(item)} disabled={deletingId === item.id} className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                              {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={!!uploadCategory}
        onClose={() => setUploadCategory(null)}
        lang={lang}
        initialCategorySlug={uploadCategory}
        initialType="article"
        onSuccess={() => {
          setUploadCategory(null);
          void load();
          window.dispatchEvent(new Event('posts-updated'));
        }}
      />

      {editingPost && (
        <CreatePostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          lang={lang}
          postToEdit={editingPost}
          categoryFilter="all"
          onSuccess={() => {
            setEditingPost(null);
            void load();
          }}
        />
      )}
    </>
  );
};
