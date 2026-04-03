import React, { useEffect, useMemo, useState } from 'react';
import {
  Loader2,
  Pencil,
  Shield,
  Trash2,
  UserCog,
  BarChart3,
  Send,
  Plus,
  Search,
  Users,
  BookOpen,
  Layers,
  Calendar,
  MessageSquare,
  ChevronRight,
  Clock,
  Languages,
  Upload,
  X,
  CheckCircle2,
  Globe,
  LayoutGrid,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { CreateQuizQuestionModal } from '../components/CreateQuizQuestionModal';
import { RichTextEditor } from '../components/RichTextEditor';
import {
  BroadcastAdminMetrics,
  BroadcastNotification,
  BroadcastNotificationType,
  ContentCategory,
  DailyCollectionEntry,
  GuidanceItem,
  Profile,
  QuizQuestion,
  QuizQuestionOption,
  SourceType,
  Post,
  Category
} from '../types';
import { authService } from '../services/authService';
import { contentService } from '../services/contentService';
import { postService } from '../services/postService';
import { supabase } from '../supabaseClient.js';

type Tab = 'overview' | 'users' | 'guidance' | 'daily' | 'quiz' | 'community' | 'broadcast';

type GuidanceForm = Omit<GuidanceItem, 'created_at' | 'updated_at' | 'image_url' | 'accent_label_en' | 'accent_label_ar' | 'source_reference' | 'source_type' | 'summary_en' | 'summary_ar'> & { accent_label_en: string; accent_label_ar: string; source_reference: string; source_type: SourceType; image_url: string; summary_en: string; summary_ar: string };
type DailyForm = Omit<DailyCollectionEntry, 'created_at' | 'updated_at' | 'tags' | 'title_ar' | 'arabic_text' | 'transliteration' | 'authenticity_notes' | 'image_url'> & { title_ar: string; arabic_text: string; transliteration: string; authenticity_notes: string; image_url: string; tags: string };
type CommunityForm = Partial<Post> & { category_id: string };
type BroadcastForm = {
  id?: string;
  type: BroadcastNotificationType;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  scheduleDate: string;
  scheduleTime: string;
  is_active: boolean;
  sendNow: boolean;
};

const text = {
  en: { title: 'Admin Console', subtitle: 'Global control center', users: 'Users', guidance: 'Guidance', daily: 'Daily', quiz: 'Quiz', community: 'Community', broadcast: 'Broadcasts', overview: 'Stats', search: 'Search entries...', save: 'Save Changes', create: 'Create New', edit: 'Edit', delete: 'Delete', setAdmin: 'Promote', setUser: 'Demote', published: 'Live', verified: 'Verified', uploadImage: 'Upload Media', approve: 'Approve', reject: 'Reject', cancelEditing: 'Cancel Editing' },
  ar: { title: 'Ù„ÙˆØ­Ø© Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©', subtitle: 'Ù…Ø±ÙƒØ² Ø§Ù„ØªØ­ÙƒÙ… Ø§Ù„Ø´Ø§Ù…Ù„', users: 'Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙˆÙ†', guidance: 'Ø§Ù„Ù‡Ø¯Ø§ÙŠØ©', daily: 'Ø§Ù„Ù…Ø­ØªÙˆÙ‰', community: 'Ø§Ù„Ù…Ø¬ØªÙ…Ø¹', broadcast: 'Ø§Ù„Ø¨Ø«', overview: 'Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª', search: 'Ø¨Ø­Ø«...', save: 'Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª', create: 'Ø¥Ù†Ø´Ø§Ø¡ Ø¬Ø¯ÙŠØ¯', edit: 'ØªØ¹Ø¯ÙŠÙ„', delete: 'Ø­Ø°Ù', setAdmin: 'ØªØ±Ù‚ÙŠØ©', setUser: 'ØªØ®ÙÙŠØ¶', published: 'Ù…Ù†Ø´ÙˆØ±', verified: 'Ù…ÙˆØ«Ù‚', uploadImage: 'Ø±ÙØ¹ ÙˆØ³Ø§Ø¦Ø·', approve: 'Ù‚Ø¨ÙˆÙ„', reject: 'Ø±ÙØ¶', cancelEditing: 'Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„' },
};

const toCategoryKey = (value?: string | null) => (value || '').trim().toLowerCase();

const getPostDefaultSourceType = (category?: Category | null): SourceType => {
  const key = toCategoryKey(category?.slug || category?.name || category?.name_ar);

  if (key === 'hadith') return 'hadith';
  if (key === 'dua') return 'quran';
  return 'scholar';
};

const getDailyDefaultSourceType = (category: ContentCategory): SourceType => {
  if (category === 'hadith') return 'hadith';
  if (category === 'dua') return 'quran';
  return 'scholar';
};

const emptyGuidance: GuidanceForm = { id: '', slug: '', title_en: '', title_ar: '', summary_en: '', summary_ar: '', body_en: '', body_ar: '', image_url: '', accent_label_en: '', accent_label_ar: '', source_reference: '', source_type: 'quran', category: 'reflection', position: 0, is_published: true };
const emptyDaily: DailyForm = { id: '', category: 'hadith', title: '', title_ar: '', english_text: '', arabic_text: '', transliteration: '', source_type: 'hadith', source_reference: '', authenticity_notes: '', image_url: '', tags: '', is_published: true, is_verified: true };
const emptyCommunity: CommunityForm = { title: '', content: '', image_url: '', category_id: '', post_type: 'image', is_approved: true, source_type: 'scholar', source_reference: '' };
const getEmptyBroadcast = (): BroadcastForm => ({
  type: 'general',
  title_en: '',
  title_ar: '',
  body_en: '',
  body_ar: '',
  scheduleDate: new Date().toISOString().split('T')[0],
  scheduleTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().split('T')[1].slice(0, 5),
  is_active: true,
  sendNow: false,
});

const emptyBroadcast = getEmptyBroadcast();

// Removed brittle global cache
const ADMIN_DRAFT_KEY = 'admin_dashboard_draft';


const readAdminDraft = () => {
  try {
    const stored = window.sessionStorage.getItem(ADMIN_DRAFT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const sanitizeBroadcastDraft = (draft: Partial<BroadcastForm> | null | undefined): BroadcastForm => {
  if (!draft || typeof draft !== 'object') {
    return emptyBroadcast;
  }

  const hasMeaningfulContent = Boolean(
    draft.title_en?.trim() ||
    draft.title_ar?.trim() ||
    draft.body_en?.trim() ||
    draft.body_ar?.trim()
  );

  // If a persisted draft contains an old edited broadcast id but no real content,
  // reset it to a fresh broadcast so the "Send Now" flow stays accessible.
  if (draft.id && !hasMeaningfulContent) {
    return emptyBroadcast;
  }

  return {
    ...emptyBroadcast,
    ...draft,
    id: hasMeaningfulContent ? draft.id : undefined,
  };
};

const clearAdminDraft = () => {
  try {
    window.sessionStorage.removeItem(ADMIN_DRAFT_KEY);
  } catch (e) {}
};

export const AdminDashboard = ({ lang }: { lang: 'en' | 'ar' }) => {
  const adminDraft = readAdminDraft();
  const t = text[lang];
  const [tab, setTab] = useState<Tab>(adminDraft?.tab || 'overview');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState(adminDraft?.query || '');

  const [users, setUsers] = useState<Profile[]>([]);
  const [guidance, setGuidance] = useState<GuidanceItem[]>([]);
  const [daily, setDaily] = useState<DailyCollectionEntry[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastNotification[]>([]);
  const [broadcastMetrics, setBroadcastMetrics] = useState<BroadcastAdminMetrics | null>(null);
  const [pushDiagnostics, setPushDiagnostics] = useState<{ total_with_tokens: number; recipients: any[] } | null>(null);

  const [guidanceForm, setGuidanceForm] = useState<GuidanceForm>(adminDraft?.guidanceForm || emptyGuidance);
  const [dailyForm, setDailyForm] = useState<DailyForm>(adminDraft?.dailyForm || emptyDaily);
  const [communityForm, setCommunityForm] = useState<CommunityForm>(adminDraft?.communityForm || emptyCommunity);
  const [broadcastForm, setBroadcastForm] = useState<BroadcastForm>(sanitizeBroadcastDraft(adminDraft?.broadcastForm) || getEmptyBroadcast());
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const hasHydratedData =
    users.length > 0 ||
    guidance.length > 0 ||
    daily.length > 0 ||
    questions.length > 0 ||
    posts.length > 0 ||
    categories.length > 0 ||
    broadcasts.length > 0;

  const filteredQuestions = useMemo(
    () =>
      questions.filter((question) =>
        !query ||
        question.question_en.toLowerCase().includes(query.toLowerCase()) ||
        (question.question_ar || '').includes(query)
      ),
    [questions, query]
  );

  const quizStats = useMemo(() => {
    const bilingualCount = questions.filter((question) => question.question_en && question.question_ar).length;
    const arabicOnlyCount = questions.filter((question) => !question.question_en && question.question_ar).length;
    const englishOnlyCount = questions.filter((question) => question.question_en && !question.question_ar).length;
    const publishedCount = questions.filter((question) => question.is_published).length;
    const verifiedCount = questions.filter((question) => question.is_verified).length;
    const averageOptions = questions.length
      ? (questions.reduce((total, question) => total + question.options.length, 0) / questions.length).toFixed(1)
      : '0.0';

    return {
      total: questions.length,
      published: publishedCount,
      verified: verifiedCount,
      bilingual: bilingualCount,
      arabicOnly: arabicOnlyCount,
      englishOnly: englishOnlyCount,
      averageOptions,
    };
  }, [questions]);

  const refreshData = async (force = false) => {
    setLoading(true);
    try {
      const runSafe = async (p: any, fallback: any) => {
        try { return await p; } catch (e) { console.error('Admin sync error:', e); return fallback; }
      };

      const [u, g, d, q, p, c, b, bm, pd] = await Promise.all([
        runSafe(authService.getAllProfiles(), []),
        runSafe(contentService.getGuidanceItems(false), []),
        runSafe(contentService.listDailyContent(), []),
        runSafe(contentService.listQuestions(), []),
        runSafe(postService.getPosts({ limit: 100 }), []),
        runSafe(postService.getCategories(), []),
        runSafe(postService.getBroadcastNotifications(), []),
        runSafe(postService.getBroadcastAdminMetrics(), null),
        runSafe(postService.getPushDiagnostics(), null),
      ]);
      setUsers(u); setGuidance(g); setDaily(d); setQuestions(q); setPosts(p); setCategories(c); setBroadcasts(b); setBroadcastMetrics(bm); setPushDiagnostics(pd);
    } catch (err: any) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    void refreshData();

    // Subscribe to realtime updates for broadcasts so the list isn't "static"
    const channel = supabase
      .channel('broadcast-admin-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'broadcast_notifications' },
        () => {
          console.log('Admin: Broadcast update detected, refreshing...');
          void refreshData(true);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(
        ADMIN_DRAFT_KEY,
        JSON.stringify({
          tab,
          query,
          guidanceForm,
          dailyForm,
          communityForm,
          broadcastForm,
        })
      );
    } catch (e) {}
  }, [tab, query, guidanceForm, dailyForm, communityForm, broadcastForm]);

  useEffect(() => {
    if (loading) return;
    // Removed stale session caching
  }, [loading, users, guidance, daily, questions, posts, categories, broadcasts, broadcastMetrics, pushDiagnostics]);

  const runSave = async (task: () => Promise<void>) => {
    setSaving(true); setError('');
    try { await task(); } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const saveGuidance = () => runSave(async () => {
    const saved = await contentService.saveGuidanceItem(guidanceForm);
    setGuidance(prev => [saved, ...prev.filter(g => g.id !== saved.id)]);
    setGuidanceForm(emptyGuidance);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const saveDaily = () => runSave(async () => {
    const normalizedSourceReference = dailyForm.source_reference.trim();
    if (!normalizedSourceReference) {
      throw new Error(lang === 'en' ? 'Source reference is required for daily content.' : 'Ø§Ù„Ù…ØµØ¯Ø± Ù…Ø·Ù„ÙˆØ¨ Ù„Ù„Ù…Ø­ØªÙˆÙ‰ Ø§Ù„ÙŠÙˆÙ…ÙŠ.');
    }

    const payload = {
      ...dailyForm,
      source_type: dailyForm.source_type || getDailyDefaultSourceType(dailyForm.category),
      source_reference: normalizedSourceReference,
      tags: dailyForm.tags ? dailyForm.tags.split(',').map(s => s.trim()) : []
    };
    const saved = await contentService.saveDailyContent(payload);
    setDaily(prev => [saved, ...prev.filter(d => d.id !== saved.id)]);
    setDailyForm(emptyDaily);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const saveCommunityPost = () => runSave(async () => {
    const normalizedSourceReference = typeof communityForm.source_reference === 'string'
      ? communityForm.source_reference.trim()
      : '';

    const payload: CommunityForm = {
      ...communityForm,
      title: (communityForm.title || '').trim(),
      content: communityForm.content || '',
      source_type: normalizedSourceReference
        ? (communityForm.source_type || getPostDefaultSourceType(categories.find((category) => category.id === communityForm.category_id)))
        : null,
      source_reference: normalizedSourceReference || null,
    };

    if (communityForm.id) {
      const saved = await postService.updatePost(communityForm.id, payload);
      setPosts(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);
    } else {
      const saved = await postService.createPost(payload);
      setPosts(prev => [saved, ...prev]);
    }
    setCommunityForm(emptyCommunity);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const deletePost = (id: string) => runSave(async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await postService.deletePost(id);
    setPosts(prev => prev.filter(p => p.id !== id));
  });

  const approvePost = (id: string) => runSave(async () => {
    const updated = await postService.setPostApproval(id, true);
    setPosts(prev => prev.map(p => p.id === id ? { ...p, is_approved: true } : p));
  });

  const deleteDaily = (id: string) => runSave(async () => {
    if (!confirm('Are you sure?')) return;
    await contentService.deleteDailyContent(id);
    setDaily(prev => prev.filter(d => d.id !== id));
  });

  const deleteGuidance = (id: string) => runSave(async () => {
    if (!confirm('Are you sure?')) return;
    await contentService.deleteGuidanceItem(id);
    setGuidance(prev => prev.filter(g => g.id !== id));
  });

  const deleteQuizQuestion = (id: string) => runSave(async () => {
    if (!confirm(lang === 'en' ? 'Delete this question?' : 'Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ø³Ø¤Ø§Ù„ØŸ')) return;
    await contentService.deleteQuestion(id);
    setQuestions(prev => prev.filter(question => question.id !== id));
    if (editingQuestion?.id === id) {
      setEditingQuestion(null);
      setIsQuizModalOpen(false);
    }
  });

  const handleImageUpload = async (file: File, folder: string, bucket = 'content-media') => {
    try {
      setSaving(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const saveBroadcast = async () => runSave(async () => {
    let effectiveSendAt = new Date().toISOString();
    if (!broadcastForm.sendNow) {
      effectiveSendAt = new Date(`${broadcastForm.scheduleDate}T${broadcastForm.scheduleTime}`).toISOString();
    }
    const payload = {
      type: broadcastForm.type,
      title_en: broadcastForm.title_en || '',
      title_ar: broadcastForm.title_ar || '',
      body_en: broadcastForm.body_en || '',
      body_ar: broadcastForm.body_ar || '',
      send_at: effectiveSendAt,
      is_active: true,
    };

    let saved;
    if (broadcastForm.id) {
      saved = await postService.updateBroadcastNotification(broadcastForm.id, payload);
    } else {
      saved = await postService.createBroadcastNotification(payload);
    }

    let hasPushError: Error | null = null;
    if (broadcastForm.sendNow) {
      try {
        await postService.sendBroadcastNow(saved.id);
      } catch (sendError: any) {
        hasPushError = new Error(
          `${lang === 'en' ? 'Broadcast saved, but push delivery failed' : 'ØªÙ… Ø­ÙØ¸ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ù„ÙƒÙ† ÙØ´Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„'}: ${sendError.message}`
        );
      }
    }

    setBroadcasts(prev => [saved, ...prev.filter(b => b.id !== saved.id)]);
    const resetForm = getEmptyBroadcast();
    setBroadcastForm(resetForm);
    clearAdminDraft(); // Wipe the draft so it doesn't reappear on reload

    await refreshData(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Throw the error *after* clearing the form so that the UI resets but still shows the warning toast.
    if (hasPushError) {
      throw hasPushError;
    }
  });

  const selectedCommunityCategory = useMemo(
    () => categories.find((category) => category.id === communityForm.category_id) || null,
    [categories, communityForm.category_id]
  );

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20 md:pt-40">
      <div className="container mx-auto px-4 md:px-6">
        <div className={cn("mb-12 flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between px-2", lang === 'ar' && "lg:flex-row-reverse")}>
          <div className={cn(lang === 'ar' && "text-right")}>
            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.4em] text-app-accent opacity-60">System Core</p>
            <h1 className="text-4xl font-black tracking-tighter text-app-text sm:text-6xl lg:text-7xl">{t.title}</h1>
            <p className="mt-4 text-sm text-app-muted font-medium">{t.subtitle}</p>
          </div>
          <div className="relative w-full max-w-md group">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 h-5 w-5 text-app-muted group-focus-within:text-app-accent transition-colors", lang === 'ar' ? "right-5" : "left-5")} />
            <input 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
              placeholder={t.search} 
              className={cn(
                "w-full rounded-[2rem] bg-white/[0.03] border border-white/10 py-5 text-sm text-app-text outline-none focus:border-app-accent/40 focus:bg-white/[0.05] transition-all shadow-xl", 
                lang === 'ar' ? "pr-14 pl-6" : "pl-14 pr-6"
              )} 
            />
          </div>
        </div>

        <div className="mb-8 overflow-x-auto pb-4 no-scrollbar">
          <div className={cn("flex min-w-max gap-3", lang === 'ar' && "flex-row-reverse")}>
            {(['overview', 'users', 'guidance', 'daily', 'quiz', 'community', 'broadcast'] as Tab[]).map((id) => (
              <button key={id} onClick={() => setTab(id)} className={cn("rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all", tab === id ? "bg-app-accent text-app-bg shadow-lg shadow-app-accent/20" : "bg-white/5 text-app-muted hover:bg-white/10")}>
                {id === 'quiz' ? (lang === 'en' ? 'Quiz' : 'Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±') : t[id]}
              </button>
            ))}
          </div>
        </div>

        {!hasHydratedData && loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-app-accent" />
            <p className="text-app-muted font-black animate-pulse uppercase tracking-[0.2em] text-xs">Syncing Live Systems...</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {error && (
              <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-6 flex flex-col gap-2">
                <p className="text-red-400 font-black uppercase text-xs tracking-widest">System Sync Warning</p>
                <p className="text-app-text/80 text-sm font-bold">{error}</p>
                <button onClick={() => void refreshData(true)} className="mt-2 text-xs font-black uppercase text-red-400 underline tracking-widest w-fit">Recalibrate Sync</button>
              </div>
            )}
            {loading && hasHydratedData && (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-app-muted">
                <Loader2 className="h-4 w-4 animate-spin text-app-accent" />
                <span>{lang === 'en' ? 'Refreshing in background' : 'Refreshing in background'}</span>
              </div>
            )}
            {tab === 'overview' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard icon={Users} label="Users" value={users.length} color="text-blue-400" />
                <StatCard icon={BookOpen} label="Library" value={guidance.length} color="text-purple-400" />
                <StatCard icon={Globe} label="Community" value={posts.length} color="text-emerald-400" />
                <StatCard icon={Send} label="Broadcasts" value={broadcasts.length} color="text-indigo-400" />
              </div>
            )}

            {tab === 'community' && (
              <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-[480px_1fr]">
                <div className="space-y-6">
                  <div className="rounded-[2.5rem] border border-white/5 bg-app-card p-6 md:p-10 shadow-2xl">
                    <h3 className="mb-8 text-2xl font-bold text-app-text flex items-center gap-3">
                      <LayoutGrid className="h-6 w-6 text-app-accent" />
                      {communityForm.id ? 'Edit Content' : 'Create Content'}
                    </h3>
                    <div className="grid gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-app-muted ml-2">{t.uploadImage}</label>
                        <div className="relative group aspect-video rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-app-accent/50">
                          {communityForm.image_url ? (
                            <>
                              <img src={communityForm.image_url} className="h-full w-full object-cover" />
                              <button onClick={() => setCommunityForm({ ...communityForm, image_url: '' })} className="absolute top-4 right-4 p-3 bg-black/60 rounded-2xl text-white hover:bg-black/80 transition-all"><X className="h-5 w-5" /></button>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center p-6 text-center">
                              <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4"><Upload className="h-6 w-6 text-app-muted" /></div>
                              <span className="text-xs font-bold text-app-muted">Tap to upload image/video</span>
                              <input type="file" accept="image/*,video/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await handleImageUpload(file, 'community', 'media');
                                  if (url) setCommunityForm({ ...communityForm, image_url: url, post_type: file.type.startsWith('video/') ? 'video' : 'image' });
                                }
                              }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-4">
                        <select
                          value={communityForm.category_id || ''}
                          onChange={e => {
                            const nextCategoryId = e.target.value;
                            const nextCategory = categories.find((category) => category.id === nextCategoryId) || null;

                            setCommunityForm({
                              ...communityForm,
                              category_id: nextCategoryId,
                              source_type: communityForm.source_reference
                                ? communityForm.source_type
                                : getPostDefaultSourceType(nextCategory),
                            });
                          }}
                          className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text outline-none focus:border-app-accent/50"
                        >
                          <option value="">Choose Section...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input
                          value={communityForm.title || ''}
                          onChange={e => setCommunityForm({ ...communityForm, title: e.target.value })}
                          placeholder="Title"
                          className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text outline-none focus:border-app-accent/50"
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                          <select
                            value={communityForm.source_type || getPostDefaultSourceType(selectedCommunityCategory)}
                            onChange={e => setCommunityForm({ ...communityForm, source_type: e.target.value as SourceType })}
                            className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text outline-none focus:border-app-accent/50"
                          >
                            <option value="quran">Quran</option>
                            <option value="hadith">Hadith</option>
                            <option value="athar">Athar</option>
                            <option value="scholar">Scholar</option>
                          </select>
                          <input
                            value={communityForm.source_reference || ''}
                            onChange={e => setCommunityForm({ ...communityForm, source_reference: e.target.value })}
                            placeholder="Source reference..."
                            className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text outline-none focus:border-app-accent/50"
                          />
                        </div>
                        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-4">
                          <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-app-muted">
                            Rich Content
                          </p>
                          <RichTextEditor
                            value={communityForm.content || ''}
                            onChange={(value) => setCommunityForm({ ...communityForm, content: value })}
                            placeholder="Body content..."
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                          />
                        </div>
                      </div>
                      <button onClick={() => void saveCommunityPost()} disabled={saving || !(communityForm.title || '').trim()} className="mt-4 w-full rounded-2xl bg-app-accent py-5 font-black text-app-bg shadow-xl shadow-app-accent/20 active:scale-95 disabled:opacity-50 transition-all uppercase tracking-[0.2em] text-xs">
                        {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (communityForm.id ? 'Save Changes' : 'Publish Content')}
                      </button>
                      {communityForm.id && <button onClick={() => setCommunityForm(emptyCommunity)} className="text-[10px] font-black uppercase text-app-muted hover:text-white transition-colors text-center mt-2">Cancel Editing</button>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-4 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">Recent Community Posts</p>
                    <button onClick={() => void refreshData(true)} className="text-[10px] font-black uppercase text-app-accent hover:underline">Refresh</button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {posts.filter(p => !query || p.title.toLowerCase().includes(query.toLowerCase())).map(p => (
                      <div key={p.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl transition-all hover:border-app-accent/30">
                        <div className="flex items-center gap-5">
                          <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/5 overflow-hidden border border-white/10 flex items-center justify-center">
                            {p.image_url ? <img src={p.image_url} className="h-full w-full object-cover" /> : <Globe className="h-6 w-6 text-app-muted" />}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-app-text leading-tight mb-1">{p.title}</h4>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest", p.is_approved ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400 border border-amber-500/20")}>
                                {p.is_approved ? t.published : 'Pending Review'}
                              </span>
                              <span className="text-[10px] text-app-muted font-bold uppercase tracking-widest">â€¢ {p.category?.name || 'Uncategorized'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 md:opacity-0 group-hover:md:opacity-100 transition-opacity justify-end border-t border-white/5 pt-4 md:border-0 md:pt-0">
                          {!p.is_approved && (
                            <button onClick={() => approvePost(p.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/20 hover:bg-emerald-500/20 transition-all">
                              <CheckCircle2 className="h-4 w-4" /> {t.approve}
                            </button>
                          )}
                          <button onClick={() => setCommunityForm(p as CommunityForm)} className="p-3 rounded-xl bg-white/5 text-app-muted hover:text-app-accent hover:bg-white/10 transition-all">
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button onClick={() => deletePost(p.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'guidance' && (
              <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-[480px_1fr]">
                <div className="space-y-6">
                  <div className="rounded-[2.5rem] border border-white/5 bg-app-card p-6 md:p-10 shadow-2xl">
                    <h3 className="mb-8 text-2xl font-bold text-app-text">{guidanceForm.id ? 'Edit Guidance' : 'Create Guidance'}</h3>
                    <div className="grid gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-app-muted ml-2">{t.uploadImage}</label>
                        <div className="relative group aspect-video rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-app-accent/50">
                          {guidanceForm.image_url ? (
                            <>
                              <img src={guidanceForm.image_url} className="h-full w-full object-cover" />
                              <button onClick={() => setGuidanceForm({ ...guidanceForm, image_url: '' })} className="absolute top-4 right-4 p-3 bg-black/60 rounded-2xl text-white"><X className="h-5 w-5" /></button>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center p-6 text-center">
                              <Upload className="h-8 w-8 text-app-muted mb-2" />
                              <span className="text-xs font-bold text-app-muted">Tap to upload cover image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await handleImageUpload(file, 'guidance');
                                  if (url) setGuidanceForm({ ...guidanceForm, image_url: url });
                                }
                              }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                          <p className="text-[10px] font-black uppercase text-app-accent mb-2">English Info</p>
                          <input value={guidanceForm.title_en} onChange={e => setGuidanceForm({ ...guidanceForm, title_en: e.target.value })} placeholder="English Title" className="w-full bg-transparent p-2 text-sm text-app-text outline-none" />
                          <textarea value={guidanceForm.body_en} onChange={e => setGuidanceForm({ ...guidanceForm, body_en: e.target.value })} placeholder="English Body..." rows={3} className="w-full bg-transparent p-2 text-sm text-app-text outline-none" />
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                          <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 text-right">Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠ</p>
                          <input value={guidanceForm.title_ar} onChange={e => setGuidanceForm({ ...guidanceForm, title_ar: e.target.value })} placeholder="Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠ" className="w-full bg-transparent p-2 text-sm text-app-text outline-none text-right" />
                          <textarea value={guidanceForm.body_ar} onChange={e => setGuidanceForm({ ...guidanceForm, body_ar: e.target.value })} placeholder="Ø§Ù„Ù†Øµ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠ..." rows={3} className="w-full bg-transparent p-2 text-sm text-app-text outline-none text-right" />
                        </div>
                      </div>
                      <button
                        onClick={() => void saveGuidance()}
                        disabled={saving || (!guidanceForm.title_en && !guidanceForm.title_ar)}
                        className="mt-4 w-full rounded-2xl bg-app-accent py-5 font-black text-app-bg shadow-xl shadow-app-accent/20 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Save Guidance Item'}
                      </button>
                      {guidanceForm.id && <button onClick={() => setGuidanceForm(emptyGuidance)} className="text-[10px] font-black uppercase text-app-muted hover:text-white transition-colors text-center">{t.cancelEditing}</button>}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {guidance.filter(g => !query || g.title_en.toLowerCase().includes(query.toLowerCase()) || g.title_ar.toLowerCase().includes(query.toLowerCase())).map(g => (
                    <div key={g.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl transition-all hover:border-app-accent/30">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-white/5 overflow-hidden border border-white/10">
                          {g.image_url && <img src={g.image_url} className="h-full w-full object-cover" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-app-text leading-tight">{g.title_en || g.title_ar}</h4>
                          <p className="text-[10px] text-app-muted font-black uppercase tracking-widest mt-1">{g.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setGuidanceForm({ ...g, image_url: g.image_url || '' } as GuidanceForm)} className="p-3 rounded-xl bg-white/5 text-app-muted hover:text-app-accent hover:bg-white/10 transition-all"><Pencil className="h-5 w-5" /></button>
                        <button onClick={() => deleteGuidance(g.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'daily' && (
              <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-[480px_1fr]">
                <div className="space-y-6">
                  <div className="rounded-[2.5rem] border border-white/5 bg-app-card p-6 md:p-10 shadow-2xl">
                    <h3 className="mb-8 text-2xl font-bold text-app-text">{dailyForm.id ? 'Edit Daily' : 'Create Daily'}</h3>
                    <div className="grid gap-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-app-muted ml-2">{t.uploadImage}</label>
                        <div className="relative group aspect-video rounded-3xl border-2 border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-app-accent/50">
                          {dailyForm.image_url ? (
                            <>
                              <img src={dailyForm.image_url} className="h-full w-full object-cover" />
                              <button onClick={() => setDailyForm({ ...dailyForm, image_url: '' })} className="absolute top-4 right-4 p-3 bg-black/60 rounded-2xl text-white hover:bg-black/80 transition-all"><X className="h-5 w-5" /></button>
                            </>
                          ) : (
                            <label className="cursor-pointer flex flex-col items-center p-6 text-center">
                              <Upload className="h-8 w-8 text-app-muted mb-2" />
                              <span className="text-xs font-bold text-app-muted">Tap to upload daily cover image</span>
                              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = await handleImageUpload(file, 'daily');
                                  if (url) setDailyForm({ ...dailyForm, image_url: url });
                                }
                              }} />
                            </label>
                          )}
                        </div>
                      </div>
                      <select
                        value={dailyForm.category}
                        onChange={e => {
                          const nextCategory = e.target.value as ContentCategory;
                          setDailyForm({ ...dailyForm, category: nextCategory, source_type: getDailyDefaultSourceType(nextCategory) });
                        }}
                        className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text focus:border-app-accent/50"
                      >
                        <option value="hadith">Hadith</option>
                        <option value="dua">Dua</option>
                        <option value="inspiration">Inspiration</option>
                      </select>
                      <div className="grid gap-4 md:grid-cols-2">
                        <select
                          value={dailyForm.source_type}
                          onChange={e => setDailyForm({ ...dailyForm, source_type: e.target.value as SourceType })}
                          className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text focus:border-app-accent/50"
                        >
                          <option value="quran">Quran</option>
                          <option value="hadith">Hadith</option>
                          <option value="athar">Athar</option>
                          <option value="scholar">Scholar</option>
                        </select>
                        <input
                          value={dailyForm.source_reference}
                          onChange={e => setDailyForm({ ...dailyForm, source_reference: e.target.value })}
                          placeholder="Source reference"
                          className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text outline-none focus:border-app-accent/50"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                          <p className="text-[10px] font-black uppercase text-app-accent mb-2">English Version</p>
                          <input value={dailyForm.title} onChange={e => setDailyForm({ ...dailyForm, title: e.target.value })} placeholder="Title" className="w-full bg-transparent p-2 text-sm text-app-text outline-none" />
                          <div className="mt-3">
                            <RichTextEditor value={dailyForm.english_text} onChange={value => setDailyForm({ ...dailyForm, english_text: value })} placeholder="Text Content..." dir="ltr" />
                          </div>
                        </div>
                        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                          <p className="text-[10px] font-black uppercase text-indigo-400 mb-2 text-right">Ø§Ù„Ù†Ø³Ø®Ø© Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</p>
                          <input value={dailyForm.title_ar} onChange={e => setDailyForm({ ...dailyForm, title_ar: e.target.value })} placeholder="Ø§Ù„Ø¹Ù†ÙˆØ§Ù†" className="w-full bg-transparent p-2 text-sm text-app-text outline-none text-right" />
                          <div className="mt-3">
                            <RichTextEditor value={dailyForm.arabic_text} onChange={value => setDailyForm({ ...dailyForm, arabic_text: value })} placeholder="نص المحتوى..." dir="rtl" />
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <input
                          value={dailyForm.transliteration}
                          onChange={e => setDailyForm({ ...dailyForm, transliteration: e.target.value })}
                          placeholder="Transliteration (optional)"
                          className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text outline-none focus:border-app-accent/50"
                        />
                        <input
                          value={dailyForm.authenticity_notes}
                          onChange={e => setDailyForm({ ...dailyForm, authenticity_notes: e.target.value })}
                          placeholder="Authenticity / notes"
                          className="w-full rounded-2xl bg-white/5 border border-white/10 p-5 text-sm text-app-text outline-none focus:border-app-accent/50"
                        />
                      </div>
                      <button
                        onClick={() => void saveDaily()}
                        disabled={saving || (!dailyForm.title && !dailyForm.title_ar) || !dailyForm.source_reference.trim()}
                        className="mt-4 w-full rounded-2xl bg-app-accent py-5 font-black text-app-bg shadow-xl shadow-app-accent/20 transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Save Daily Content'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {daily.filter(d => !query || d.title.toLowerCase().includes(query.toLowerCase()) || (d.title_ar || '').includes(query)).map(d => (
                    <div key={d.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl">
                      <div>
                        <h4 className="text-lg font-bold text-app-text leading-tight">{d.title || d.title_ar}</h4>
                        <p className="text-[10px] text-app-muted font-black uppercase tracking-widest mt-1">{d.category}</p>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => setDailyForm({ ...d, tags: d.tags?.join(',') || '' } as any)} className="p-3 rounded-xl bg-white/5 text-app-muted hover:text-app-accent transition-all"><Pencil className="h-5 w-5" /></button>
                        <button onClick={() => deleteDaily(d.id)} className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"><Trash2 className="h-5 w-5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'quiz' && (
              <div className="grid gap-6">
                <div className="flex items-center justify-between rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl">
                  <div>
                    <h3 className="text-2xl font-bold text-app-text">{lang === 'en' ? 'Quiz Questions' : 'Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ø§Ø®ØªØ¨Ø§Ø±'}</h3>
                    <p className="mt-1 text-xs font-bold uppercase tracking-widest text-app-muted">
                      {lang === 'en' ? 'Create, edit, and remove saved questions' : 'Ø¥Ù†Ø´Ø§Ø¡ ÙˆØªØ¹Ø¯ÙŠÙ„ ÙˆØ­Ø°Ù Ø§Ù„Ø£Ø³Ø¦Ù„Ø© Ø§Ù„Ù…Ø­ÙÙˆØ¸Ø©'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingQuestion(null);
                      setIsQuizModalOpen(true);
                    }}
                    className="flex items-center gap-2 rounded-2xl bg-app-accent px-5 py-3 text-xs font-black uppercase tracking-widest text-app-bg shadow-lg shadow-app-accent/20"
                  >
                    <Plus className="h-4 w-4" />
                    {lang === 'en' ? 'New Question' : 'Ø³Ø¤Ø§Ù„ Ø¬Ø¯ÙŠØ¯'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard icon={MessageSquare} label={lang === 'en' ? 'Questions' : 'Ø§Ù„Ø£Ø³Ø¦Ù„Ø©'} value={quizStats.total} color="text-cyan-400" />
                  <StatCard icon={CheckCircle2} label={lang === 'en' ? 'Verified' : 'Ø§Ù„Ù…ÙˆØ«Ù‚'} value={`${quizStats.verified}/${quizStats.total}`} color="text-emerald-400" />
                  <StatCard icon={Languages} label={lang === 'en' ? 'Both Languages' : 'ÙƒÙ„ØªØ§ Ø§Ù„Ù„ØºØªÙŠÙ†'} value={quizStats.bilingual} color="text-indigo-400" />
                  <StatCard icon={Layers} label={lang === 'en' ? 'Avg Options' : 'Ù…ØªÙˆØ³Ø· Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª'} value={quizStats.averageOptions} color="text-amber-400" />
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <div className="rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">{lang === 'en' ? 'Question Bank' : 'Ø¨Ù†Ùƒ Ø§Ù„Ø£Ø³Ø¦Ù„Ø©'}</p>
                    <div className="mt-4 grid gap-3 text-sm text-app-text">
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'Published' : 'Ø§Ù„Ù…Ù†Ø´ÙˆØ±'}</span><span className="font-black">{quizStats.published}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'Verified' : 'Ø§Ù„Ù…ÙˆØ«Ù‚'}</span><span className="font-black">{quizStats.verified}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'Visible in search' : 'Ù†ØªØ§Ø¦Ø¬ Ø§Ù„Ø¨Ø­Ø«'}</span><span className="font-black">{filteredQuestions.length}</span></div>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">{lang === 'en' ? 'Language Mix' : 'ØªÙˆØ²ÙŠØ¹ Ø§Ù„Ù„ØºØ§Øª'}</p>
                    <div className="mt-4 grid gap-3 text-sm text-app-text">
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'Both' : 'ÙƒÙ„ØªØ§Ù‡Ù…Ø§'}</span><span className="font-black">{quizStats.bilingual}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'English Only' : 'Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠ ÙÙ‚Ø·'}</span><span className="font-black">{quizStats.englishOnly}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'Arabic Only' : 'Ø¹Ø±Ø¨ÙŠ ÙÙ‚Ø·'}</span><span className="font-black">{quizStats.arabicOnly}</span></div>
                    </div>
                  </div>
                  <div className="rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">{lang === 'en' ? 'Option Health' : 'Ø¬ÙˆØ¯Ø© Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª'}</p>
                    <div className="mt-4 grid gap-3 text-sm text-app-text">
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'Average options' : 'Ù…ØªÙˆØ³Ø· Ø§Ù„Ø®ÙŠØ§Ø±Ø§Øª'}</span><span className="font-black">{quizStats.averageOptions}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? '4+ options' : '4+ Ø®ÙŠØ§Ø±Ø§Øª'}</span><span className="font-black">{questions.filter((question) => question.options.length >= 4).length}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"><span>{lang === 'en' ? 'Minimum only' : 'Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰ ÙÙ‚Ø·'}</span><span className="font-black">{questions.filter((question) => question.options.length === 2).length}</span></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredQuestions.map((question) => (
                      <div key={question.id} className="rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-3">
                            <div>
                              <h4 className="text-lg font-bold leading-tight text-app-text">
                                {lang === 'ar' ? question.question_ar || question.question_en : question.question_en || question.question_ar}
                              </h4>
                              {question.question_ar && question.question_en && (
                                <p className="mt-1 text-sm text-app-muted">
                                  {lang === 'ar' ? question.question_en : question.question_ar}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-xl bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-app-muted">
                                {question.source_type}
                              </span>
                              <span className="rounded-xl bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-app-muted">
                                {question.difficulty}
                              </span>
                              <span className="rounded-xl bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                {question.options.length} {lang === 'en' ? 'options' : 'Ø®ÙŠØ§Ø±Ø§Øª'}
                              </span>
                            </div>
                            <div className="grid gap-2">
                              {question.options.map((option) => (
                                <div
                                  key={option.id}
                                  className={cn(
                                    'rounded-xl border px-4 py-3 text-sm',
                                    option.id === question.correct_option_id
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                      : 'border-white/5 bg-white/5 text-app-text'
                                  )}
                                >
                                  {lang === 'ar' ? option.label_ar || option.label_en : option.label_en || option.label_ar}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingQuestion(question);
                                setIsQuizModalOpen(true);
                              }}
                              className="rounded-xl bg-white/5 p-3 text-app-muted transition-all hover:bg-white/10 hover:text-app-accent"
                            >
                              <Pencil className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => deleteQuizQuestion(question.id)}
                              className="rounded-xl bg-red-500/10 p-3 text-red-400 transition-all hover:bg-red-500/20"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                  {!filteredQuestions.length && (
                    <div className="rounded-[2rem] border border-white/5 bg-app-card p-10 text-center text-app-muted">
                      {lang === 'en' ? 'No quiz questions found.' : 'Ù„Ø§ ØªÙˆØ¬Ø¯ Ø£Ø³Ø¦Ù„Ø© Ø§Ø®ØªØ¨Ø§Ø±.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 'broadcast' && (
              <div className="grid gap-8 lg:grid-cols-1 xl:grid-cols-[520px_1fr]">
                <div className="space-y-6">
                  <div className="rounded-[2.5rem] border border-white/5 bg-app-card p-6 md:p-10 shadow-2xl">
                    <h3 className="mb-2 text-2xl font-bold text-app-text flex items-center gap-3">
                      <Send className="h-6 w-6 text-app-accent" />
                      {broadcastForm.id
                        ? (lang === 'en' ? 'Edit Notification' : 'ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±')
                        : (lang === 'en' ? 'Create Notification' : 'Ø¥Ù†Ø´Ø§Ø¡ Ø¥Ø´Ø¹Ø§Ø±')
                      }
                    </h3>
                    <p className="mb-8 text-xs text-app-muted font-bold uppercase tracking-widest">
                      {lang === 'en' ? 'Both languages are optional â€” fill in one or both' : 'ÙƒÙ„Ø§ Ø§Ù„Ù„ØºØªÙŠÙ† Ø§Ø®ØªÙŠØ§Ø±ÙŠØªØ§Ù† â€” Ø£Ø¯Ø®Ù„ ÙˆØ§Ø­Ø¯Ø© Ø£Ùˆ ÙƒÙ„ØªÙŠÙ‡Ù…Ø§'}
                    </p>

                    <div className="grid gap-5">
                      {/* Type selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-app-muted ml-1">
                          {lang === 'en' ? 'Notification Type' : 'Ù†ÙˆØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±'}
                        </label>
                        <select
                          value={broadcastForm.type}
                          onChange={(e) => setBroadcastForm({ ...broadcastForm, type: e.target.value as any })}
                          className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-app-text outline-none focus:border-app-accent/50"
                        >
                          <option value="hadith">ðŸ“œ Hadith</option>
                          <option value="dua">ðŸ¤² Dua</option>
                          <option value="general">ðŸ“¢ General</option>
                        </select>
                      </div>

                      {/* Send Now / Schedule toggle */}
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-1 flex gap-1">
                        <button
                          onClick={() => setBroadcastForm({ ...broadcastForm, sendNow: true })}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all',
                            broadcastForm.sendNow
                              ? 'bg-app-accent text-app-bg shadow-lg'
                              : 'text-app-muted hover:text-app-text'
                          )}
                        >
                          <Send className="h-3.5 w-3.5" />
                          {lang === 'en' ? 'Send Now' : 'Ø£Ø±Ø³Ù„ Ø§Ù„Ø¢Ù†'}
                        </button>
                        <button
                          onClick={() => setBroadcastForm({ ...broadcastForm, sendNow: false })}
                          className={cn(
                            'flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all',
                            !broadcastForm.sendNow
                              ? 'bg-app-accent text-app-bg shadow-lg'
                              : 'text-app-muted hover:text-app-text'
                          )}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {lang === 'en' ? 'Schedule' : 'Ø¬Ø¯ÙˆÙ„Ø©'}
                        </button>
                      </div>

                      {/* Schedule datetime picker (only shown when scheduling) */}
                      {!broadcastForm.sendNow && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-app-muted ml-1 flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5" />
                              {lang === 'en' ? 'Select Date' : 'Ø§Ø®ØªØ± Ø§Ù„ØªØ§Ø±ÙŠØ®'}
                            </label>
                            <input
                              type="date"
                              value={broadcastForm.scheduleDate}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={e => setBroadcastForm({ ...broadcastForm, scheduleDate: e.target.value })}
                              className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-app-text outline-none focus:border-app-accent/50"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-app-muted ml-1 flex items-center gap-2">
                              <Clock className="h-3.5 w-3.5" />
                              {lang === 'en' ? 'Select Time' : 'Ø§Ø®ØªØ± Ø§Ù„ÙˆÙ‚Øª'}
                            </label>
                            <input
                              type="time"
                              value={broadcastForm.scheduleTime}
                              onChange={e => setBroadcastForm({ ...broadcastForm, scheduleTime: e.target.value })}
                              className="w-full rounded-2xl bg-white/5 border border-white/10 p-4 text-sm text-app-text outline-none focus:border-app-accent/50"
                            />
                          </div>
                          <p className="col-span-2 text-[10px] text-amber-400/70 font-bold ml-1">
                            âš ï¸ {lang === 'en'
                              ? 'App must be open or reopened after the scheduled time to deliver the notification.'
                              : 'ÙŠØ¬Ø¨ Ø£Ù† ÙŠÙƒÙˆÙ† Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ù…ÙØªÙˆØ­Ø§Ù‹ Ø£Ùˆ ÙŠÙØ¹Ø§Ø¯ ÙØªØ­Ù‡ Ø¨Ø¹Ø¯ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„ Ù„Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±.'}
                          </p>
                        </div>
                      )}

                      {/* Language sections */}
                      <div className="space-y-3">
                        {/* English â€” Optional */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-app-accent">ðŸ‡¬ðŸ‡§ English</span>
                            <span className="text-[10px] font-bold text-app-muted/60 uppercase tracking-widest">
                              {lang === 'en' ? '(optional)' : '(Ø§Ø®ØªÙŠØ§Ø±ÙŠ)'}
                            </span>
                          </div>
                          <div className="px-4 pb-4 space-y-2">
                            <input
                              value={broadcastForm.title_en}
                              onChange={e => setBroadcastForm({ ...broadcastForm, title_en: e.target.value })}
                              placeholder={lang === 'en' ? 'Notification title...' : 'Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±...'}
                              className="w-full bg-transparent border-b border-white/5 py-2 text-sm text-app-text outline-none focus:border-app-accent/30 transition-colors"
                            />
                            <textarea
                              value={broadcastForm.body_en}
                              onChange={e => setBroadcastForm({ ...broadcastForm, body_en: e.target.value })}
                              placeholder={lang === 'en' ? 'Notification body...' : 'Ù†Øµ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±...'}
                              rows={3}
                              className="w-full bg-transparent py-2 text-sm text-app-text outline-none resize-none"
                            />
                          </div>
                        </div>

                        {/* Arabic â€” Optional */}
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                          <div className="flex items-center gap-2 px-4 pt-4 pb-2 justify-end flex-row-reverse">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">ðŸ‡¸ðŸ‡¦ Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©</span>
                            <span className="text-[10px] font-bold text-app-muted/60 uppercase tracking-widest">
                              {lang === 'en' ? '(optional)' : '(Ø§Ø®ØªÙŠØ§Ø±ÙŠ)'}
                            </span>
                          </div>
                          <div className="px-4 pb-4 space-y-2 text-right" dir="rtl">
                            <input
                              value={broadcastForm.title_ar}
                              onChange={e => setBroadcastForm({ ...broadcastForm, title_ar: e.target.value })}
                              placeholder="Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±..."
                              className="w-full bg-transparent border-b border-white/5 py-2 text-sm text-app-text outline-none focus:border-app-accent/30 transition-colors text-right"
                            />
                            <textarea
                              value={broadcastForm.body_ar}
                              onChange={e => setBroadcastForm({ ...broadcastForm, body_ar: e.target.value })}
                              placeholder="Ù†Øµ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±..."
                              rows={3}
                              className="w-full bg-transparent py-2 text-sm text-app-text outline-none resize-none text-right"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Preview */}
                      {(broadcastForm.title_en || broadcastForm.title_ar) && (
                        <div className="rounded-2xl border border-app-accent/20 bg-app-accent/5 p-4">
                          <p className="text-[10px] font-black uppercase tracking-widest text-app-accent mb-2">Preview</p>
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-xl bg-app-accent/20 flex items-center justify-center text-lg shrink-0">
                              {broadcastForm.type === 'hadith' ? 'ðŸ“œ' : broadcastForm.type === 'dua' ? 'ðŸ¤²' : 'ðŸ“¢'}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-app-text">{broadcastForm.title_en || broadcastForm.title_ar || 'â€”'}</p>
                              <p className="text-xs text-app-muted mt-0.5">{broadcastForm.body_en || broadcastForm.body_ar || 'â€”'}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => void saveBroadcast()}
                        disabled={saving || (!broadcastForm.title_en && !broadcastForm.title_ar && !broadcastForm.body_en && !broadcastForm.body_ar)}
                        className={cn(
                          'mt-2 w-full rounded-2xl py-5 font-black shadow-xl active:scale-95 disabled:opacity-50 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3',
                          broadcastForm.sendNow
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                            : 'bg-app-accent text-app-bg shadow-app-accent/20'
                        )}
                      >
                        {saving
                          ? <Loader2 className="h-5 w-5 animate-spin" />
                          : broadcastForm.id
                            ? <><Pencil className="h-4 w-4" /> {lang === 'en' ? 'Save Changes' : 'Ø­ÙØ¸ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª'}</>
                            : broadcastForm.sendNow
                              ? <><Send className="h-4 w-4" /> {lang === 'en' ? 'Send Now to All Users' : 'Ø£Ø±Ø³Ù„ Ø§Ù„Ø¢Ù† Ù„Ø¬Ù…ÙŠØ¹ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†'}</>
                              : <><Calendar className="h-4 w-4" /> {lang === 'en' ? 'Schedule Notification' : 'Ø¬Ø¯ÙˆÙ„Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±'}</>}
                      </button>

                      {broadcastForm.id && (
                        <button onClick={() => { setBroadcastForm(emptyBroadcast); clearAdminDraft(); }} className="text-[10px] font-black uppercase text-app-muted hover:text-white transition-colors text-center w-full mt-2">
                          {t.cancelEditing}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scheduled notifications list */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">
                      {lang === 'en' ? 'Sent & Scheduled' : 'Ø§Ù„Ù…ÙØ±Ø³Ù„Ø© ÙˆØ§Ù„Ù…Ø¬Ø¯ÙˆÙ„Ø©'}
                    </p>
                    <button onClick={() => void refreshData(true)} className="text-[10px] font-black uppercase text-app-accent hover:underline">
                      {lang === 'en' ? 'Refresh' : 'ØªØ­Ø¯ÙŠØ«'}
                    </button>
                  </div>
                  <div className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center flex flex-col items-center gap-2">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-app-accent/20 text-app-accent">
                      <Zap className="h-8 w-8" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-app-text">{pushDiagnostics?.total_with_tokens || 0}</div>
                    <div className="text-sm text-app-muted font-bold uppercase tracking-widest">Push Targets (Devices)</div>
                    {(pushDiagnostics?.total_with_tokens || 0) === 0 && (
                      <div className="mt-2 flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-[10px] text-amber-500 font-bold uppercase">
                        <AlertCircle className="h-3 w-3" />
                        Tokens not syncing. Log in on APK!
                      </div>
                    )}
                  </div>
                  <div className="rounded-3xl border border-white/5 bg-white/5 p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-500">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <div className="mt-4 text-3xl font-bold text-app-text">{broadcastMetrics?.delivered_total || 0}</div>
                    <div className="mt-1 text-sm text-app-muted font-bold uppercase tracking-widest">Received Receipts</div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {broadcasts
                      .filter(b => !query || b.title_en?.toLowerCase().includes(query.toLowerCase()) || (b.title_ar || '').includes(query))
                      .map((b) => {
                        const isPast = new Date(b.send_at) <= new Date();
                        const isScheduled = !isPast;
                        return (
                          <div key={b.id} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[2rem] border border-white/5 bg-app-card p-6 shadow-xl">
                            <div className="flex items-center gap-4">
                              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-app-accent border border-white/5 text-2xl">
                                {b.type === 'hadith' ? 'ðŸ“œ' : b.type === 'dua' ? 'ðŸ¤²' : 'ðŸ“¢'}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-app-text leading-tight w-full max-w-[200px] md:max-w-[300px] truncate">
                                  {b.title_en || b.title_ar || <span className="text-app-muted italic">(no title)</span>}
                                </h4>
                                {(b.title_ar && b.title_en) && (
                                  <p className="text-xs text-indigo-400 font-bold mt-0.5 truncate max-w-[200px] md:max-w-[300px]">{b.title_ar}</p>
                                )}
                                <p className={cn(
                                  'text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2',
                                  isScheduled ? 'text-amber-400' : 'text-emerald-400'
                                )}>
                                  {isScheduled ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                                  {isScheduled
                                    ? (lang === 'en' ? 'Scheduled: ' : 'Ù…Ø¬Ø¯ÙˆÙ„: ')
                                    : (lang === 'en' ? 'Sent: ' : 'Ø£ÙØ±Ø³Ù„: ')}
                                  {new Date(b.send_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => {
                                  // Parse and adjust the ISO date directly into explicit local chunks
                                  const dateObj = new Date(b.send_at);
                                  // Create local ISO components to fill timezone-shifted Date/Time inputs correctly
                                  const offset = dateObj.getTimezoneOffset();
                                  const localDateObj = new Date(dateObj.getTime() - (offset * 60 * 1000));
                                  const localIso = localDateObj.toISOString().split('T');

                                  setBroadcastForm({
                                    id: b.id,
                                    type: b.type,
                                    title_en: b.title_en || '',
                                    title_ar: b.title_ar || '',
                                    body_en: b.body_en || '',
                                    body_ar: b.body_ar || '',
                                    scheduleDate: localIso[0],
                                    scheduleTime: localIso[1].slice(0, 5),
                                    is_active: b.is_active,
                                    sendNow: false,
                                  });
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-3 rounded-xl bg-white/5 text-app-muted hover:text-app-accent hover:bg-white/10 transition-all"
                              >
                                <Pencil className="h-5 w-5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (!confirm(lang === 'en' ? 'Delete this notification?' : 'Ø­Ø°Ù Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±ØŸ')) return;
                                  try {
                                    await postService.deleteBroadcastNotification(b.id);
                                    setBroadcasts(prev => prev.filter(x => x.id !== b.id));
                                  } catch (err: any) {
                                    setError(err.message);
                                  }
                                }}
                                className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {tab === 'users' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {users.filter(u => !query || u.display_name?.toLowerCase().includes(query.toLowerCase())).map(user => (
                  <div key={user.id} className="rounded-[2rem] border border-white/5 bg-app-card p-6 flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent font-black text-xl">{user.display_name?.[0]?.toUpperCase()}</div>
                      <div>
                        <p className="font-bold text-app-text">{user.display_name}</p>
                        <p className="text-[10px] text-app-muted uppercase font-black tracking-widest mt-0.5">{user.role}</p>
                      </div>
                    </div>
                    <button onClick={() => void authService.setUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')} className="p-3 rounded-xl bg-white/5 text-app-muted hover:text-app-accent transition-all"><UserCog className="h-5 w-5" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <CreateQuizQuestionModal
        isOpen={isQuizModalOpen}
        onClose={() => {
          setIsQuizModalOpen(false);
          setEditingQuestion(null);
        }}
        lang={lang}
        initialQuestion={editingQuestion}
        onSuccess={(savedQuestion) => {
          setQuestions((prev) => [savedQuestion, ...prev.filter((question) => question.id !== savedQuestion.id)]);
          setIsQuizModalOpen(false);
          setEditingQuestion(null);
        }}
      />
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) => (
  <div className="group relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-app-card p-8 shadow-2xl transition-all hover:border-white/10 hover:shadow-app-accent/5">
    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-app-accent/5 blur-3xl transition-all group-hover:bg-app-accent/10" />
    <div className="relative z-10 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl transition-all group-hover:scale-110 shadow-inner", color)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-app-muted mb-1">{label}</p>
        <h4 className="text-4xl font-serif font-bold text-app-text mb-2 tracking-tighter">{value}</h4>
      </div>
    </div>
  </div>
);

