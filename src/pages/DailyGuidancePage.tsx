import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  BookOpen, 
  ImageIcon, 
  Loader2, 
  Plus, 
  Quote, 
  Sparkles, 
  Pencil, 
  Trash2,
  RefreshCw,
  Heart
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '../lib/utils';
import { isNativeApp } from '../lib/runtime';
import { Post, ContentCategory, GuidanceItem, DailyCollectionEntry } from '../types';
import { contentService } from '../services/contentService';
import { postService } from '../services/postService';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';
import { isLikelyRichTextHtml, sanitizePostHtml } from '../lib/postContent';

const copy = {
  en: {
    back: 'Back to Home',
    title: 'Daily Guidance',
    subtitle: 'A curated space for verified reflections, sacred texts, and spiritual focus.',
    source: 'Source',
    authenticity: 'Authenticity',
    emptyTitle: 'No items published yet',
    emptyBody: 'Publish content from the admin dashboard to populate this section.',
    dhikr: {
      title: 'Dhikr Focus',
      subtitle: 'A quiet space for continuous remembrance.',
      phrases: ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'La ilaha illallah', 'Astaghfirullah'],
      count: 'Count',
      reset: 'Reset',
      change: 'Change Phrase'
    },
    tabs: {
      inspiration: 'Inspiration',
      hadith: 'Hadith',
      dua: 'Dua',
      dhikr: 'Dhikr',
      others: 'Articles'
    }
  },
  ar: {
    back: 'العودة إلى الرئيسية',
    title: 'الهداية اليومية',
    subtitle: 'مساحة منتقاة للتأملات الموثقة والنصوص المقدسة والتركيز الروحي.',
    source: 'المصدر',
    authenticity: 'التوثيق',
    emptyTitle: 'لا توجد عناصر منشورة بعد',
    emptyBody: 'انشر محتوى من لوحة الإدارة ليظهر هنا.',
    dhikr: {
      title: 'ركن الذكر',
      subtitle: 'مساحة هادئة للذكر المستمر.',
      phrases: ['سبحان الله', 'الحمد لله', 'الله أكبر', 'لا إله إلا الله', 'أستغفر الله'],
      count: 'العدد',
      reset: 'إعادة ضبط',
      change: 'تغيير الذكر'
    },
    tabs: {
      inspiration: 'إلهام',
      hadith: 'حديث',
      dua: 'دعاء',
      dhikr: 'ذكر',
      others: 'مقالات'
    }
  },
};

export const DailyGuidancePage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const nativeApp = isNativeApp();
  const t = copy[lang];
  
  const currentTab = (searchParams.get('tab') || 'inspiration') as any;

  const [guidanceItems, setGuidanceItems] = useState<GuidanceItem[]>([]);
  const [dailyEntries, setDailyEntries] = useState<DailyCollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dhikr State
  const [dhikrCount, setDhikrCount] = useState(0);
  const [dhikrIndex, setDhikrIndex] = useState(0);

  // Admin States
  const [uploadCategory, setUploadCategory] = useState<ContentCategory | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (currentTab === 'others') {
        const data = await contentService.getGuidanceItems();
        setGuidanceItems(data);
      } else if (currentTab !== 'dhikr') {
        const set = await contentService.getDailyCollection(currentTab as ContentCategory);
        setDailyEntries(set.items);
      }
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load content.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [currentTab]);

  const handleDeleteEntry = async (id: string, isGuidance: boolean) => {
    if (!profile || deletingId) return;
    const confirmed = window.confirm(lang === 'en' ? 'Delete this item?' : 'هل تريد حذف هذا العنصر؟');
    if (!confirmed) return;

    try {
      setDeletingId(id);
      if (isGuidance) {
        await contentService.deleteGuidanceItem(id);
      } else {
        await contentService.deleteDailyContent(id);
      }
      await load();
    } catch (err) {
      console.error('Error deleting:', err);
      alert(lang === 'en' ? 'Failed to delete.' : 'فشل الحذف.');
    } finally {
      setDeletingId(null);
    }
  };

  const tabs = [
    { id: 'inspiration', label: t.tabs.inspiration, icon: Sparkles },
    { id: 'hadith', label: t.tabs.hadith, icon: BookOpen },
    { id: 'dua', label: t.tabs.dua, icon: Heart },
    { id: 'dhikr', label: t.tabs.dhikr, icon: Quote },
    { id: 'others', label: t.tabs.others, icon: ImageIcon },
  ];

  return (
    <div className={cn('min-h-screen bg-app-bg transition-all', nativeApp ? 'pt-16 pb-28' : 'pt-40 pb-20')}>
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <header className={cn('mb-10', lang === 'ar' && 'text-right')}>
          <div className={cn('flex items-center gap-4 mb-6', lang === 'ar' && 'flex-row-reverse')}>
             {!nativeApp && (
               <Link to="/" className="p-3 rounded-2xl bg-white/5 text-app-accent hover:bg-white/10 transition-all">
                  <ArrowLeft className={cn("h-5 w-5", lang === 'ar' && "rotate-180")} />
               </Link>
             )}
             <div>
               <h1 className="text-4xl md:text-5xl font-bold text-app-text tracking-tight">{t.title}</h1>
               <p className="text-app-muted mt-2 max-w-2xl">{t.subtitle}</p>
             </div>
          </div>

          {/* Tab Switcher */}
          <div className={cn("flex flex-wrap gap-2 p-1.5 rounded-[2rem] bg-app-card/30 border border-white/5 w-fit", lang === 'ar' && "ml-auto flex-row-reverse")}>
             {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSearchParams({ tab: tab.id })}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
                    currentTab === tab.id 
                      ? "bg-app-accent text-app-bg shadow-lg scale-105" 
                      : "text-app-muted hover:text-app-text hover:bg-white/5"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
             ))}
          </div>
        </header>

        {/* Content Area */}
        <main>
          {error && <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-app-accent" />
              <span className="text-xs font-bold uppercase tracking-widest text-app-muted animate-pulse">Loading Wisdom...</span>
            </div>
          ) : currentTab === 'dhikr' ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto py-12 text-center">
                <div className="mb-12 p-10 rounded-[4rem] bg-app-card border border-white/10 shadow-3xl">
                  <h3 className="text-xs font-black uppercase tracking-[0.3em] text-app-accent mb-4">{t.dhikr.title}</h3>
                  <div className="mb-10">
                    <motion.p key={dhikrIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-app-text mb-4">{t.dhikr.phrases[dhikrIndex]}</motion.p>
                    <button onClick={() => { setDhikrIndex((c) => (c + 1) % t.dhikr.phrases.length); setDhikrCount(0); }} className="mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-app-muted hover:text-app-accent transition-colors">
                      <RefreshCw className="h-3 w-3" /> {t.dhikr.change}
                    </button>
                  </div>

                  <div 
                    onClick={() => setDhikrCount(c => c + 1)}
                    className="mx-auto w-48 h-48 rounded-full border-8 border-app-accent/10 flex flex-col items-center justify-center cursor-pointer hover:bg-app-accent/5 active:scale-90 transition-all select-none"
                  >
                    <span className="text-6xl font-serif text-app-accent">{dhikrCount}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-app-accent/40">{t.dhikr.count}</span>
                  </div>

                  <button onClick={() => setDhikrCount(0)} className="mt-10 px-8 py-3 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-widest text-app-muted hover:text-red-400 transition-all border border-white/5">
                    {t.dhikr.reset}
                  </button>
                </div>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 items-start md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {/* Daily Entries (Inspiration, Hadith, Dua) */}
                {currentTab !== 'others' && dailyEntries.map((entry, idx) => (
                  <motion.div 
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="self-start p-8 rounded-[3rem] bg-app-card border border-white/5 shadow-xl group hover:border-app-accent/20 transition-all"
                  >
                     {entry.image_url && (
                       <div className="mb-6 overflow-hidden rounded-[2rem] border border-white/5">
                         <img src={entry.image_url} alt={lang === 'ar' ? entry.title_ar || entry.title : entry.title} className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                       </div>
                     )}
                     <div className={cn("flex items-center justify-between mb-6", lang === 'ar' && "flex-row-reverse")}>
                        <span className="px-4 py-1.5 rounded-full bg-app-accent/10 border border-app-accent/20 text-app-accent text-[10px] font-black uppercase tracking-widest">
                          {entry.source_type}
                        </span>
                        {profile?.role === 'admin' && (
                          <button onClick={() => handleDeleteEntry(entry.id, false)} className="p-2 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                     </div>
                     <h3 className={cn("text-2xl font-bold text-app-text mb-4 leading-tight", lang === 'ar' && "text-right")}>
                       {lang === 'ar' ? entry.title_ar || entry.title : entry.title}
                     </h3>
                     {isLikelyRichTextHtml(lang === 'ar' ? entry.arabic_text || entry.english_text : entry.english_text) ? (
                       <div
                         className={cn("post-content prose prose-invert max-w-none text-app-text/90 mb-8 leading-relaxed", lang === 'ar' && "text-right")}
                         dangerouslySetInnerHTML={{ __html: sanitizePostHtml(lang === 'ar' ? entry.arabic_text || entry.english_text : entry.english_text) }}
                       />
                     ) : (
                       <p className={cn("text-lg font-serif italic text-app-text/90 mb-8 leading-relaxed", lang === 'ar' && "text-right font-normal")}>
                          {lang === 'ar' ? entry.arabic_text || entry.english_text : entry.english_text}
                       </p>
                     )}
                     
                     <div className={cn("pt-6 border-t border-white/5 space-y-2", lang === 'ar' && "text-right")}>
                        <p className="text-xs text-app-muted leading-relaxed">
                          <span className="font-bold text-app-text opacity-50 uppercase tracking-tighter mr-2">{t.source}:</span>
                          {entry.source_reference}
                        </p>
                        {entry.authenticity_notes && (
                          <p className="text-xs text-app-muted leading-relaxed italic">
                            <span className="font-bold text-app-text opacity-50 uppercase tracking-tighter mr-2">{t.authenticity}:</span>
                            {entry.authenticity_notes}
                          </p>
                        )}
                     </div>
                  </motion.div>
                ))}

                {/* Legacy Guidance Items (Articles) */}
                {currentTab === 'others' && guidanceItems.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                    className="self-start overflow-hidden rounded-[3rem] bg-app-card border border-white/5 shadow-xl group"
                  >
                    {item.image_url && (
                        <div className="aspect-video overflow-hidden">
                          <img src={item.image_url} alt={item.title_en} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        </div>
                    )}
                    <div className="p-8">
                       <div className={cn("flex items-center justify-between mb-4", lang === 'ar' && "flex-row-reverse")}>
                          <span className="px-3 py-1 rounded-full bg-white/5 text-[10px] font-black uppercase tracking-widest text-app-muted">
                            {item.category}
                          </span>
                          {profile?.role === 'admin' && (
                            <button onClick={() => handleDeleteEntry(item.id, true)} className="p-2 rounded-xl bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                       </div>
                       <h3 className={cn("text-2xl font-bold text-app-text mb-3", lang === 'ar' && "text-right")}>
                         {lang === 'ar' ? item.title_ar : item.title_en}
                       </h3>
                       <p className={cn("text-app-text/80 text-sm leading-relaxed mb-6", lang === 'ar' && "text-right")}>
                         {lang === 'ar' ? item.summary_ar : item.summary_en}
                       </p>
                       <div className={cn("flex items-center gap-2 pt-6 border-t border-white/5", lang === 'ar' && "flex-row-reverse")}>
                         <div className="h-8 w-8 rounded-full bg-app-accent/10 flex items-center justify-center text-app-accent">
                            <Sparkles className="h-4 w-4" />
                         </div>
                         <span className="text-xs font-bold text-app-muted">{t.source}: {item.source_reference}</span>
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {!loading && currentTab !== 'dhikr' && (currentTab === 'others' ? guidanceItems.length === 0 : dailyEntries.length === 0) && (
            <div className="py-24 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white/5 text-app-muted mb-6">
                <Sparkles className="h-10 w-10 opacity-20" />
              </div>
              <h2 className="text-2xl font-bold text-app-text mb-2">{t.emptyTitle}</h2>
              <p className="text-app-muted">{t.emptyBody}</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Modals for Admin Creation */}
      <CreatePostModal
        isOpen={!!uploadCategory}
        onClose={() => setUploadCategory(null)}
        lang={lang}
        initialCategorySlug={uploadCategory}
        initialType="article"
        onSuccess={() => { setUploadCategory(null); void load(); }}
      />
    </div>
  );
};
