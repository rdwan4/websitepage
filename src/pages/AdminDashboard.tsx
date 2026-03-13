import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Pencil, Shield, Trash2, UserCog } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { ContentCategory, DailyCollectionEntry, GuidanceItem, Profile, QuizQuestion, QuizQuestionOption, SourceType } from '../types';
import { authService } from '../services/authService';
import { contentService } from '../services/contentService';

type Tab = 'overview' | 'users' | 'guidance' | 'daily' | 'questions';
type GuidanceForm = Omit<GuidanceItem, 'created_at' | 'updated_at' | 'image_url' | 'accent_label_en' | 'accent_label_ar' | 'source_reference' | 'source_type'> & { accent_label_en: string; accent_label_ar: string; source_reference: string; source_type: SourceType };
type DailyForm = Omit<DailyCollectionEntry, 'created_at' | 'updated_at' | 'tags' | 'title_ar' | 'arabic_text' | 'transliteration' | 'authenticity_notes' | 'image_url'> & { title_ar: string; arabic_text: string; transliteration: string; authenticity_notes: string; image_url: string; tags: string };
type QuestionForm = Omit<QuizQuestion, 'created_at' | 'updated_at' | 'options' | 'question_ar' | 'explanation_en' | 'explanation_ar'> & { question_ar: string; explanation_en: string; explanation_ar: string; options: QuizQuestionOption[] };

const text = {
  en: { title: 'Admin Dashboard', users: 'Users', guidance: 'Guidance', daily: 'Daily Content', questions: 'Questions', overview: 'Overview', search: 'Search...', save: 'Save', create: 'Create', edit: 'Edit', delete: 'Delete', setAdmin: 'Set Admin', setUser: 'Set User', published: 'Published', verified: 'Verified' },
  ar: { title: 'لوحة الإدارة', users: 'المستخدمون', guidance: 'الهداية', daily: 'المحتوى اليومي', questions: 'الأسئلة', overview: 'نظرة عامة', search: 'بحث...', save: 'حفظ', create: 'إنشاء', edit: 'تعديل', delete: 'حذف', setAdmin: 'تعيين مشرف', setUser: 'تعيين مستخدم', published: 'منشور', verified: 'موثق' },
};

const makeEmptyOptions = (): QuizQuestionOption[] => [0, 1, 2, 3].map((i) => ({ id: crypto.randomUUID(), label_en: '', label_ar: '', sort_order: i }));
const emptyGuidance: GuidanceForm = { id: '', slug: '', title_en: '', title_ar: '', summary_en: '', summary_ar: '', body_en: '', body_ar: '', accent_label_en: '', accent_label_ar: '', source_type: 'quran', source_reference: '', category: 'reflection', position: 0, is_published: true };
const emptyDaily: DailyForm = { id: '', category: 'dua', title: '', title_ar: '', arabic_text: '', english_text: '', transliteration: '', source_type: 'quran', source_reference: '', authenticity_notes: '', image_url: '', tags: '', is_published: true, is_verified: false };
const emptyQuestion: QuestionForm = { id: '', question_en: '', question_ar: '', explanation_en: '', explanation_ar: '', source_type: 'quran', source_reference: '', difficulty: 'beginner', category: '', correct_option_id: '', is_published: true, is_verified: false, options: makeEmptyOptions() };
const TAB_DRAFT_KEY = 'admin-tab-draft-v1';
const GUIDANCE_DRAFT_KEY = 'admin-guidance-draft-v1';
const DAILY_DRAFT_KEY = 'admin-daily-draft-v1';
const QUESTION_DRAFT_KEY = 'admin-question-draft-v1';

const normalizeGuidanceDraft = (raw: any): GuidanceForm => ({
  ...emptyGuidance,
  ...raw,
  title_en: raw?.title_en || '',
  title_ar: raw?.title_ar || '',
  summary_en: raw?.summary_en || '',
  summary_ar: raw?.summary_ar || '',
  body_en: raw?.body_en || '',
  body_ar: raw?.body_ar || '',
  accent_label_en: raw?.accent_label_en || '',
  accent_label_ar: raw?.accent_label_ar || '',
  source_reference: raw?.source_reference || '',
});

const normalizeDailyDraft = (raw: any): DailyForm => ({
  ...emptyDaily,
  ...raw,
  title: raw?.title || '',
  title_ar: raw?.title_ar || '',
  arabic_text: raw?.arabic_text || '',
  english_text: raw?.english_text || '',
  transliteration: raw?.transliteration || '',
  source_reference: raw?.source_reference || '',
  authenticity_notes: raw?.authenticity_notes || '',
  image_url: raw?.image_url || '',
  tags: raw?.tags || '',
});

const normalizeQuestionDraft = (raw: any): QuestionForm => {
  const fallbackOptions = makeEmptyOptions();
  const parsedOptions = Array.isArray(raw?.options)
    ? raw.options.map((option: any, index: number) => ({
        id: option?.id || crypto.randomUUID(),
        label_en: option?.label_en || '',
        label_ar: option?.label_ar || '',
        sort_order: Number.isFinite(option?.sort_order) ? option.sort_order : index,
      }))
    : fallbackOptions;

  const options = parsedOptions.length ? parsedOptions : fallbackOptions;

  return {
    ...emptyQuestion,
    ...raw,
    question_en: raw?.question_en || '',
    question_ar: raw?.question_ar || '',
    explanation_en: raw?.explanation_en || '',
    explanation_ar: raw?.explanation_ar || '',
    source_reference: raw?.source_reference || '',
    category: raw?.category || '',
    options,
    correct_option_id: raw?.correct_option_id || options[0]?.id || '',
  };
};

export const AdminDashboard = ({ lang }: { lang: 'en' | 'ar' }) => {
  const t = text[lang];
  const [tab, setTab] = useState<Tab>(() => {
    try {
      const stored = window.localStorage.getItem(TAB_DRAFT_KEY);
      return stored === 'users' || stored === 'guidance' || stored === 'daily' || stored === 'questions' ? stored : 'overview';
    } catch {
      return 'overview';
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<Profile[]>([]);
  const [guidance, setGuidance] = useState<GuidanceItem[]>([]);
  const [daily, setDaily] = useState<DailyCollectionEntry[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [guidanceForm, setGuidanceForm] = useState(emptyGuidance);
  const [dailyForm, setDailyForm] = useState(emptyDaily);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);

  useEffect(() => {
    try {
      const storedGuidance = window.localStorage.getItem(GUIDANCE_DRAFT_KEY);
      if (storedGuidance) {
        setGuidanceForm(normalizeGuidanceDraft(JSON.parse(storedGuidance)));
      }

      const storedDaily = window.localStorage.getItem(DAILY_DRAFT_KEY);
      if (storedDaily) {
        setDailyForm(normalizeDailyDraft(JSON.parse(storedDaily)));
      }

      const stored = window.localStorage.getItem(QUESTION_DRAFT_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      setQuestionForm(normalizeQuestionDraft(parsed));
    } catch (error) {
      console.warn('Failed to restore question draft:', error);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(TAB_DRAFT_KEY, tab);
    } catch (error) {
      console.warn('Failed to store admin tab:', error);
    }
  }, [tab]);

  useEffect(() => {
    try {
      window.localStorage.setItem(GUIDANCE_DRAFT_KEY, JSON.stringify(guidanceForm));
    } catch (error) {
      console.warn('Failed to store guidance draft:', error);
    }
  }, [guidanceForm]);

  useEffect(() => {
    try {
      window.localStorage.setItem(DAILY_DRAFT_KEY, JSON.stringify(dailyForm));
    } catch (error) {
      console.warn('Failed to store daily draft:', error);
    }
  }, [dailyForm]);

  useEffect(() => {
    try {
      window.localStorage.setItem(QUESTION_DRAFT_KEY, JSON.stringify(questionForm));
    } catch (error) {
      console.warn('Failed to store question draft:', error);
    }
  }, [questionForm]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [u, g, d, q] = await Promise.all([
          authService.getAllProfiles().catch(() => []),
          contentService.getGuidanceItems(false).catch(() => []),
          contentService.listDailyContent().catch(() => []),
          contentService.listQuestions().catch(() => []),
        ]);
        setUsers(u); setGuidance(g); setDaily(d); setQuestions(q);
      } catch (e: any) { setError(e.message || 'Failed to load admin data.'); } finally { setLoading(false); }
    };
    void load();
  }, []);

  const filteredUsers = useMemo(() => users.filter((u) => !query || `${u.display_name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase())), [users, query]);
  const filteredGuidance = useMemo(() => guidance.filter((i) => !query || `${i.title_en} ${i.title_ar}`.toLowerCase().includes(query.toLowerCase())), [guidance, query]);
  const filteredDaily = useMemo(() => daily.filter((i) => !query || `${i.title} ${i.english_text} ${i.source_reference}`.toLowerCase().includes(query.toLowerCase())), [daily, query]);
  const filteredQuestions = useMemo(() => questions.filter((i) => !query || `${i.question_en} ${i.question_ar || ''} ${i.source_reference}`.toLowerCase().includes(query.toLowerCase())), [questions, query]);

  const runSave = async (task: () => Promise<void>) => {
    setSaving(true); setError('');
    try { await task(); } catch (e: any) { setError(e.message || 'Action failed.'); } finally { setSaving(false); }
  };

  const toggleRole = async (user: Profile) => runSave(async () => {
    const updated = await authService.setUserRole(user.id, user.role === 'admin' ? 'user' : 'admin');
    setUsers((current) => current.map((item) => item.id === user.id ? updated : item));
  });

  const saveGuidance = async () => runSave(async () => {
    const saved = await contentService.saveGuidanceItem({ ...guidanceForm, slug: guidanceForm.slug || guidanceForm.title_en.toLowerCase().replace(/\s+/g, '-'), accent_label_en: guidanceForm.accent_label_en || null, accent_label_ar: guidanceForm.accent_label_ar || null, source_reference: guidanceForm.source_reference || null, image_url: null });
    setGuidance((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setGuidanceForm(emptyGuidance);
    window.localStorage.removeItem(GUIDANCE_DRAFT_KEY);
  });

  const saveDaily = async () => runSave(async () => {
    const saved = await contentService.saveDailyContent({ ...dailyForm, title_ar: dailyForm.title_ar || null, arabic_text: dailyForm.arabic_text || null, transliteration: dailyForm.transliteration || null, authenticity_notes: dailyForm.authenticity_notes || null, image_url: dailyForm.image_url || null, tags: dailyForm.tags ? dailyForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [] });
    setDaily((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setDailyForm(emptyDaily);
    window.localStorage.removeItem(DAILY_DRAFT_KEY);
  });

  const saveQuestion = async () => runSave(async () => {
    const saved = await contentService.saveQuestion({ ...questionForm, correct_option_id: questionForm.correct_option_id || questionForm.options[0].id, options: questionForm.options });
    setQuestions((current) => current.some((item) => item.id === saved.id) ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setQuestionForm(emptyQuestion);
    window.localStorage.removeItem(QUESTION_DRAFT_KEY);
  });

  const removeGuidance = async (id: string) => runSave(async () => { await contentService.deleteGuidanceItem(id); setGuidance((current) => current.filter((item) => item.id !== id)); });
  const removeDaily = async (id: string) => runSave(async () => { await contentService.deleteDailyContent(id); setDaily((current) => current.filter((item) => item.id !== id)); });
  const removeQuestion = async (id: string) => runSave(async () => { await contentService.deleteQuestion(id); setQuestions((current) => current.filter((item) => item.id !== id)); });

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className={cn('mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between', lang === 'ar' && 'md:flex-row-reverse text-right')}>
          <h1 className="font-serif text-5xl text-app-text md:text-6xl">{t.title}</h1>
          <div className={cn('flex w-full max-w-2xl items-center gap-3', lang === 'ar' && 'flex-row-reverse')}>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text" />
            <Link to="/admin/posts" className="whitespace-nowrap rounded-xl border border-app-accent/30 bg-app-accent/10 px-4 py-3 text-xs font-bold uppercase tracking-widest text-app-accent">
              {lang === 'en' ? 'Post Approvals' : 'اعتماد المنشورات'}
            </Link>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {(['overview', 'users', 'guidance', 'daily', 'questions'] as Tab[]).map((item) => (
            <button key={item} onClick={() => { setTab(item); setError(''); }} className={cn('rounded-xl px-4 py-2 text-sm font-bold', tab === item ? 'bg-app-accent text-app-bg' : 'border border-white/10 bg-white/5 text-app-text')}>{t[item]}</button>
          ))}
        </div>

        {error && <div className="mb-6 rounded-2xl bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}

        {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-app-accent" /></div> : (
          <>
            {tab === 'overview' && <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card label={t.users} value={users.length} />
              <Card label="Admins" value={users.filter((u) => u.role === 'admin').length} />
              <Card label="Verified Daily" value={daily.filter((i) => i.is_published && i.is_verified).length} />
              <Card label="Verified Questions" value={questions.filter((i) => i.is_published && i.is_verified).length} />
            </div>}

            {tab === 'users' && <div className="space-y-3">{filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-app-card p-4">
                <div><p className="font-bold text-app-text">{user.display_name}</p><p className="text-xs text-app-muted">{user.email}</p></div>
                <button onClick={() => void toggleRole(user)} disabled={saving} className="flex items-center gap-2 rounded-lg bg-app-accent/10 px-3 py-2 text-xs font-bold text-app-accent"><UserCog className="h-4 w-4" />{user.role === 'admin' ? t.setUser : t.setAdmin}</button>
              </div>
            ))}</div>}

            {tab === 'guidance' && <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <EditorCard title={guidanceForm.id ? t.edit : t.create}>
                <SimpleInput value={guidanceForm.title_en} onChange={(value) => setGuidanceForm((c) => ({ ...c, title_en: value }))} placeholder="Title EN" />
                <SimpleInput value={guidanceForm.title_ar} onChange={(value) => setGuidanceForm((c) => ({ ...c, title_ar: value }))} placeholder="Title AR" />
                <SimpleText value={guidanceForm.summary_en} onChange={(value) => setGuidanceForm((c) => ({ ...c, summary_en: value }))} placeholder="Summary EN" />
                <SimpleText value={guidanceForm.summary_ar} onChange={(value) => setGuidanceForm((c) => ({ ...c, summary_ar: value }))} placeholder="Summary AR" />
                <SimpleText value={guidanceForm.body_en} onChange={(value) => setGuidanceForm((c) => ({ ...c, body_en: value }))} placeholder="Body EN" rows={4} />
                <SimpleText value={guidanceForm.body_ar} onChange={(value) => setGuidanceForm((c) => ({ ...c, body_ar: value }))} placeholder="Body AR" rows={4} />
                <SimpleInput value={guidanceForm.source_reference} onChange={(value) => setGuidanceForm((c) => ({ ...c, source_reference: value }))} placeholder="Source Reference" />
                <button onClick={() => void saveGuidance()} disabled={saving} className="rounded-xl bg-app-accent px-4 py-3 text-sm font-bold text-app-bg">{guidanceForm.id ? t.save : t.create}</button>
              </EditorCard>
              <ListCard items={filteredGuidance.map((item) => ({ id: item.id, title: item.title_en, subtitle: item.source_reference || item.category, onEdit: () => setGuidanceForm({ ...item, accent_label_en: item.accent_label_en || '', accent_label_ar: item.accent_label_ar || '', source_type: item.source_type || 'quran', source_reference: item.source_reference || '' }), onDelete: () => void removeGuidance(item.id) }))} />
            </div>}

            {tab === 'daily' && <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <EditorCard title={dailyForm.id ? t.edit : t.create}>
                <select value={dailyForm.category} onChange={(e) => setDailyForm((c) => ({ ...c, category: e.target.value as ContentCategory }))} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text">{(['dua', 'hadith', 'inspiration'] as ContentCategory[]).map((item) => <option key={item} value={item}>{item}</option>)}</select>
                <SimpleInput value={dailyForm.title} onChange={(value) => setDailyForm((c) => ({ ...c, title: value }))} placeholder="Title EN" />
                <SimpleInput value={dailyForm.title_ar} onChange={(value) => setDailyForm((c) => ({ ...c, title_ar: value }))} placeholder="Title AR" />
                <SimpleText value={dailyForm.english_text} onChange={(value) => setDailyForm((c) => ({ ...c, english_text: value }))} placeholder="English Text" rows={3} />
                <SimpleText value={dailyForm.arabic_text} onChange={(value) => setDailyForm((c) => ({ ...c, arabic_text: value }))} placeholder="Arabic Text" rows={3} />
                <SimpleInput value={dailyForm.source_reference} onChange={(value) => setDailyForm((c) => ({ ...c, source_reference: value }))} placeholder="Source Reference" />
                <SimpleText value={dailyForm.authenticity_notes} onChange={(value) => setDailyForm((c) => ({ ...c, authenticity_notes: value }))} placeholder="Authenticity Notes" />
                <Toggle checked={dailyForm.is_published} onChange={(checked) => setDailyForm((c) => ({ ...c, is_published: checked }))} label={t.published} />
                <Toggle checked={dailyForm.is_verified} onChange={(checked) => setDailyForm((c) => ({ ...c, is_verified: checked }))} label={t.verified} />
                <button onClick={() => void saveDaily()} disabled={saving} className="rounded-xl bg-app-accent px-4 py-3 text-sm font-bold text-app-bg">{dailyForm.id ? t.save : t.create}</button>
              </EditorCard>
              <ListCard items={filteredDaily.map((item) => ({ id: item.id, title: item.title, subtitle: `${item.category} · ${item.source_reference}`, onEdit: () => setDailyForm({ ...item, title_ar: item.title_ar || '', arabic_text: item.arabic_text || '', transliteration: item.transliteration || '', authenticity_notes: item.authenticity_notes || '', image_url: item.image_url || '', tags: (item.tags || []).join(', ') }), onDelete: () => void removeDaily(item.id), verified: item.is_verified }))} />
            </div>}

            {tab === 'questions' && <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <EditorCard title={questionForm.id ? t.edit : t.create}>
                <SimpleInput value={questionForm.question_en} onChange={(value) => setQuestionForm((c) => ({ ...c, question_en: value }))} placeholder="Question EN" />
                <SimpleInput value={questionForm.question_ar} onChange={(value) => setQuestionForm((c) => ({ ...c, question_ar: value }))} placeholder="Question AR" />
                <SimpleInput value={questionForm.category} onChange={(value) => setQuestionForm((c) => ({ ...c, category: value }))} placeholder="Category" />
                <SimpleInput value={questionForm.source_reference} onChange={(value) => setQuestionForm((c) => ({ ...c, source_reference: value }))} placeholder="Source Reference" />
                {questionForm.options.map((option) => (
                  <div key={option.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <SimpleInput value={option.label_en} onChange={(value) => setQuestionForm((c) => ({ ...c, options: c.options.map((item) => item.id === option.id ? { ...item, label_en: value } : item) }))} placeholder="Option EN" />
                    <SimpleInput value={option.label_ar || ''} onChange={(value) => setQuestionForm((c) => ({ ...c, options: c.options.map((item) => item.id === option.id ? { ...item, label_ar: value } : item) }))} placeholder="Option AR" />
                    <Toggle checked={questionForm.correct_option_id === option.id || (!questionForm.correct_option_id && questionForm.options[0].id === option.id)} onChange={() => setQuestionForm((c) => ({ ...c, correct_option_id: option.id }))} label="Correct" />
                  </div>
                ))}
                <Toggle checked={questionForm.is_published} onChange={(checked) => setQuestionForm((c) => ({ ...c, is_published: checked }))} label={t.published} />
                <Toggle checked={questionForm.is_verified} onChange={(checked) => setQuestionForm((c) => ({ ...c, is_verified: checked }))} label={t.verified} />
                <button onClick={() => void saveQuestion()} disabled={saving} className="rounded-xl bg-app-accent px-4 py-3 text-sm font-bold text-app-bg">{questionForm.id ? t.save : t.create}</button>
              </EditorCard>
              <ListCard items={filteredQuestions.map((item) => ({ id: item.id, title: item.question_en, subtitle: `${item.category} · ${item.source_reference}`, onEdit: () => setQuestionForm({ ...item, question_ar: item.question_ar || '', explanation_en: item.explanation_en || '', explanation_ar: item.explanation_ar || '', options: item.options.length ? item.options : emptyQuestion.options }), onDelete: () => void removeQuestion(item.id), verified: item.is_verified }))} />
            </div>}
          </>
        )}
      </div>
    </div>
  );
};

const Card = ({ label, value }: { label: string; value: number }) => <div className="rounded-3xl border border-white/10 bg-app-card p-6"><p className="text-sm text-app-muted">{label}</p><p className="mt-2 text-3xl font-bold text-app-text">{value}</p></div>;
const EditorCard = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="rounded-3xl border border-white/10 bg-app-card p-6"><h3 className="mb-4 text-xl font-bold text-app-text">{title}</h3><div className="grid gap-3">{children}</div></div>;
const SimpleInput = ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) => <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text" />;
const SimpleText = ({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (value: string) => void; placeholder: string; rows?: number }) => <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-app-text" />;
const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) => <label className="flex items-center gap-2 text-sm text-app-text"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
const ListCard = ({ items }: { items: Array<{ id: string; title: string; subtitle: string; onEdit: () => void; onDelete: () => void; verified?: boolean }> }) => <div className="rounded-3xl border border-white/10 bg-app-card p-6"><div className="space-y-3">{items.length ? items.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"><div className="min-w-0"><p className="truncate font-bold text-app-text">{item.title}</p><p className="text-xs text-app-muted">{item.subtitle}</p></div><div className="flex items-center gap-2">{item.verified && <Shield className="h-4 w-4 text-green-400" />}<button onClick={item.onEdit} className="rounded-lg bg-white/10 p-2 text-app-text"><Pencil className="h-4 w-4" /></button><button onClick={item.onDelete} className="rounded-lg bg-red-500/10 p-2 text-red-400"><Trash2 className="h-4 w-4" /></button></div></div>) : <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-app-muted">No records yet.</div>}</div></div>;
