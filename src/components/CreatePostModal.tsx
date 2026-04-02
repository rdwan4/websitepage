import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  FileDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  Music,
  Plus,
  Upload,
  Video,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import { getVideoThumbnailUrl } from '../lib/media';
import { RichTextEditor } from './RichTextEditor';
import { Category, ContentCategory, Post, PostType } from '../types';

type Language = 'en' | 'ar';

export type CategoryFilterMode = 'sidebar' | 'non-sidebar' | 'all';
type PostLanguage = 'ar' | 'en' | 'both';

const postTypes: Array<{ id: PostType; icon: typeof FileText; label: Record<Language, string> }> = [
  { id: 'article', icon: FileText, label: { en: 'Text', ar: 'Text' } },
  { id: 'video', icon: Video, label: { en: 'Video', ar: 'Video' } },
  { id: 'pdf', icon: FileDown, label: { en: 'PDF', ar: 'PDF' } },
  { id: 'image', icon: ImageIcon, label: { en: 'Image', ar: 'Image' } },
  { id: 'audio', icon: Music, label: { en: 'Audio', ar: 'Audio' } },
];

const typeUploadAccept: Record<PostType, string> = {
  article: '',
  blog: '',
  blogger: '',
  image: 'image/*',
  video: 'video/*',
  audio: 'audio/*',
  pdf: 'application/pdf',
};

const sidebarCategoryOrder: ContentCategory[] = ['inspiration', 'hadith', 'dua'];

const toCategoryKey = (value?: string | null) => (value || '').trim().toLowerCase();

const isSidebarCategory = (category: Category) => {
  const slug = toCategoryKey(category.slug);
  const name = toCategoryKey(category.name);
  const nameAr = toCategoryKey(category.name_ar);

  return (
    sidebarCategoryOrder.includes(slug as ContentCategory) ||
    sidebarCategoryOrder.includes(name as ContentCategory) ||
    sidebarCategoryOrder.includes(nameAr as ContentCategory)
  );
};

const sortSidebarCategories = (categories: Category[]) =>
  [...categories].sort((a, b) => {
    const aIndex = sidebarCategoryOrder.indexOf(toCategoryKey(a.slug) as ContentCategory);
    const bIndex = sidebarCategoryOrder.indexOf(toCategoryKey(b.slug) as ContentCategory);
    const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
    const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
    return safeA - safeB;
  });

const toSeriesSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-');

const buildDraftKey = (
  categoryFilter: CategoryFilterMode,
  initialCategorySlug?: string | null,
  initialType?: PostType,
  postToEdit?: Post | null
) => {
  if (postToEdit?.id) {
    return `post-modal-draft-edit-${postToEdit.id}`;
  }

  return `post-modal-draft-create-${categoryFilter}-${initialCategorySlug || 'none'}-${initialType || 'article'}`;
};

export const CreatePostModal = ({
  isOpen,
  onClose,
  lang,
  onSuccess,
  postToEdit,
  initialCategorySlug,
  initialType,
  categoryFilter = 'sidebar',
  modalTitle,
  modalSubtitle,
  initialParentPostId,
}: {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSuccess: () => void;
  postToEdit?: Post | null;
  initialCategorySlug?: string | null;
  initialType?: PostType;
  categoryFilter?: CategoryFilterMode;
  modalTitle?: string;
  modalSubtitle?: string;
  initialParentPostId?: string;
}) => {
  const { profile } = useAuth();
  const [type, setType] = useState<PostType>('article');
  const [postLanguage, setPostLanguage] = useState<PostLanguage>('en');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [secondaryTitle, setSecondaryTitle] = useState('');
  const [secondaryContent, setSecondaryContent] = useState('');
  const [secondaryExcerpt, setSecondaryExcerpt] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [seriesTitle, setSeriesTitle] = useState('');
  const [lessonOrder, setLessonOrder] = useState(1);
  const [parentPostId, setParentPostId] = useState('');
  const [courseParents, setCourseParents] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  const isEditing = Boolean(postToEdit);
  const isAdmin = profile?.role === 'admin';
  const isCategoryLocked = Boolean(initialCategorySlug) && !isEditing;
  const lockedCategory = isCategoryLocked
    ? categories.find((category) => category.slug === initialCategorySlug)
    : null;
  const selectedCategory = lockedCategory || categories.find((category) => category.id === categoryId);
  const activeAccept = typeUploadAccept[type] || '';
  const canUploadForType = Boolean(activeAccept);
  const draftKey = useMemo(
    () => buildDraftKey(categoryFilter, initialCategorySlug, initialType, postToEdit),
    [categoryFilter, initialCategorySlug, initialType, postToEdit]
  );

  const computedTitle = useMemo(() => {
    if (modalTitle) return modalTitle;
    if (isEditing) return 'Edit Post';
    return categoryFilter === 'sidebar' ? 'Create Sidebar Post' : 'Create Page Post';
  }, [categoryFilter, isEditing, modalTitle]);

  const computedSubtitle = useMemo(() => {
    if (modalSubtitle) return modalSubtitle;
    if (categoryFilter === 'sidebar') {
      return 'Publish into sidebar sections only.';
    }
    return 'Publish content to this page category.';
  }, [categoryFilter, modalSubtitle]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchCategories = async () => {
      try {
        const data = await postService.getCategories();

        let nextCategories: Category[] = data;
        if (categoryFilter === 'sidebar') {
          nextCategories = sortSidebarCategories(data.filter(isSidebarCategory));
        } else if (categoryFilter === 'non-sidebar') {
          nextCategories = data.filter((category) => !isSidebarCategory(category));
        }

        if (nextCategories.length === 0 && categoryFilter !== 'all') {
          nextCategories = data;
        }

        setCategories(nextCategories);

        if (!nextCategories.length) {
          setError(lang === 'en' ? 'No categories found.' : 'لا توجد فئات.');
        }

        try {
          const allPosts = await postService.getPosts({ orderBy: 'created_at' });
          setCourseParents(
            allPosts.filter((item) => !item.parent_post_id)
          );
        } catch (postsError) {
          console.warn('Unable to load parent course options:', postsError);
        }
      } catch (fetchError: any) {
        console.error('Error fetching categories:', fetchError);
        setError(fetchError?.message || (lang === 'en' ? 'Failed to load categories.' : 'فشل تحميل الفئات.'));
      }
    };

    void fetchCategories();
  }, [categoryFilter, isOpen]);

  useEffect(() => {
    if (postToEdit) {
      setPostLanguage('both');
      setTitle(postToEdit.title);
      setContent(postToEdit.content);
      setExcerpt(postToEdit.excerpt || '');
      setSecondaryTitle('');
      setSecondaryContent('');
      setSecondaryExcerpt('');
      setCategoryId(postToEdit.category_id || '');
      setImageUrl(postToEdit.image_url || '');
      setMediaUrl(postToEdit.media_url || '');
      setSeriesTitle(postToEdit.series_title || '');
      setLessonOrder(postToEdit.lesson_order || 1);
      setParentPostId(postToEdit.parent_post_id || '');
      setType(postToEdit.post_type || 'article');
      return;
    }

    const initialCategory = initialCategorySlug
      ? categories.find((category) => category.slug === initialCategorySlug)
      : categories[0];

    setType(initialType || 'article');
    setPostLanguage(lang === 'ar' ? 'ar' : 'en');
    setTitle('');
    setContent('');
    setExcerpt('');
    setSecondaryTitle('');
    setSecondaryContent('');
    setSecondaryExcerpt('');
    setCategoryId(initialCategory?.id || '');
    setImageUrl('');
    setMediaUrl('');
    setSeriesTitle('');
    setLessonOrder(1);
    setParentPostId(initialParentPostId || '');
    setError(null);
  }, [categories, initialCategorySlug, initialType, postToEdit, initialParentPostId]);

  useEffect(() => {
    if (!isOpen || !lockedCategory) return;
    if (categoryId !== lockedCategory.id) {
      setCategoryId(lockedCategory.id);
    }
  }, [categoryId, isOpen, lockedCategory]);

  useEffect(() => {
    if (!isOpen || postToEdit || categories.length === 0) return;

    try {
      const stored = window.localStorage.getItem(draftKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);

      setType(parsed.type || initialType || 'article');
      setPostLanguage(parsed.postLanguage || (lang === 'ar' ? 'ar' : 'en'));
      setTitle(parsed.title || '');
      setContent(parsed.content || '');
      setExcerpt(parsed.excerpt || '');
      setSecondaryTitle(parsed.secondaryTitle || '');
      setSecondaryContent(parsed.secondaryContent || '');
      setSecondaryExcerpt(parsed.secondaryExcerpt || '');
      setCategoryId(lockedCategory?.id || parsed.categoryId || categoryId || '');
      setImageUrl(parsed.imageUrl || '');
      setMediaUrl(parsed.mediaUrl || '');
      setSeriesTitle(parsed.seriesTitle || '');
      setLessonOrder(Math.max(1, Number(parsed.lessonOrder) || 1));
      setParentPostId(parsed.parentPostId || '');
    } catch (draftError) {
      console.warn('Failed to restore post modal draft:', draftError);
    }
  }, [categories.length, categoryId, draftKey, initialType, isOpen, lang, lockedCategory?.id, postToEdit]);

  useEffect(() => {
    if (!isOpen || postToEdit) return;

    try {
      window.localStorage.setItem(
        draftKey,
        JSON.stringify({
          type,
          postLanguage,
          title,
          content,
          secondaryTitle,
          secondaryContent,
          categoryId: lockedCategory?.id || categoryId,
          imageUrl,
          mediaUrl,
          seriesTitle,
          lessonOrder,
          parentPostId,
        })
      );
    } catch (draftError) {
      console.warn('Failed to store post modal draft:', draftError);
    }
  }, [
    categoryId,
    content,
    draftKey,
    imageUrl,
    isOpen,
    lessonOrder,
    mediaUrl,
    parentPostId,
    postLanguage,
    postToEdit,
    secondaryContent,
    secondaryTitle,
    seriesTitle,
    title,
    type,
  ]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canUploadForType) {
      setError(lang === 'en' ? 'This type does not require a file upload.' : 'هذا النوع لا يحتاج رفع ملف.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const url = await postService.uploadMedia(file);
      if (type === 'image') {
        setImageUrl(url);
        setMediaUrl('');
      } else {
        setMediaUrl(url);
      }
    } catch (uploadError: any) {
      setError(uploadError.message || (lang === 'en' ? 'Error uploading file' : 'حدث خطأ أثناء رفع الملف'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleCoverUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const url = await postService.uploadMedia(file);
      setImageUrl(url);
    } catch (uploadError: any) {
      setError(uploadError.message || (lang === 'en' ? 'Error uploading cover image' : 'حدث خطأ أثناء رفع صورة الغلاف'));
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const resetForm = () => {
    const fallbackCategory = initialCategorySlug
      ? categories.find((category) => category.slug === initialCategorySlug)
      : categories[0];

    setType(initialType || 'article');
    setPostLanguage(lang === 'ar' ? 'ar' : 'en');
    setTitle('');
    setContent('');
    setSecondaryTitle('');
    setSecondaryContent('');
    setCategoryId(fallbackCategory?.id || '');
    setImageUrl('');
    setMediaUrl('');
    setSeriesTitle('');
    setLessonOrder(1);
    setParentPostId('');
    setError(null);
    window.localStorage.removeItem(draftKey);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profile) {
      setError(lang === 'en' ? 'You must be logged in.' : 'يجب تسجيل الدخول.');
      return;
    }

    const effectiveCategoryId = lockedCategory?.id || categoryId;

    if (!effectiveCategoryId) {
      setError(lang === 'en' ? 'Choose a category.' : 'اختر فئة.');
      return;
    }

    setLoading(true);
    setError(null);

    const normalizedPrimaryTitle = title.trim();
    const normalizedPrimaryContent = content.trim();
    const normalizedPrimaryExcerpt = excerpt.trim();
    const normalizedSecondaryTitle = secondaryTitle.trim();
    const normalizedSecondaryContent = secondaryContent.trim();
    const normalizedSecondaryExcerpt = secondaryExcerpt.trim();

    const finalTitle = postLanguage === 'both' && normalizedSecondaryTitle
      ? `${normalizedPrimaryTitle} / ${normalizedSecondaryTitle}`
      : normalizedPrimaryTitle;

    const finalContent = postLanguage === 'both' && normalizedSecondaryContent
      ? `${normalizedPrimaryContent}\n\n-----\n\n${normalizedSecondaryContent}`
      : normalizedPrimaryContent;

    const finalExcerpt = postLanguage === 'both' && normalizedSecondaryExcerpt
      ? `${normalizedPrimaryExcerpt} / ${normalizedSecondaryExcerpt}`
      : normalizedPrimaryExcerpt;

    const payload = {
      author_id: profile.id,
      category_id: effectiveCategoryId,
      title: finalTitle || normalizedSecondaryTitle || 'Untitled',
      content: finalContent || normalizedSecondaryContent || '',
      excerpt: finalExcerpt || normalizedSecondaryExcerpt || null,
      post_type: type,
      image_url: imageUrl || (type === 'video' ? getVideoThumbnailUrl(mediaUrl) : null),
      media_url: mediaUrl,
      series_title: seriesTitle.trim() || null,
      series_slug: seriesTitle.trim() ? toSeriesSlug(seriesTitle) : null,
      lesson_order: Math.max(1, lessonOrder || 1),
      parent_post_id: parentPostId || null,
      is_approved: isAdmin ? (isEditing ? postToEdit?.is_approved ?? true : true) : false,
    };

    try {
      if (isEditing && postToEdit) {
        await postService.updatePost(postToEdit.id, payload);
      } else {
        await postService.createPost(payload);
      }
      onSuccess();
      onClose();
      resetForm();
    } catch (submitError: any) {
      setError(submitError.message || (lang === 'en' ? 'Error saving post' : 'حدث خطأ أثناء حفظ المنشور'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-app-bg/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl flex flex-col max-h-[90vh] rounded-[2.5rem] border border-white/10 bg-app-card shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5 bg-app-card/50 backdrop-blur-md z-10">
              <div className={cn(lang === 'ar' && 'text-right')}>
                <h2 className="text-xl font-bold text-app-text">{computedTitle}</h2>
                <p className="text-xs text-app-muted">{computedSubtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-app-text/40 transition-all hover:bg-white/5 hover:text-app-text"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
              <form id="create-post-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-5 gap-2">
                  {postTypes.map((postType) => (
                    <button
                      key={postType.id}
                      type="button"
                      onClick={() => setType(postType.id)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all',
                        type === postType.id
                          ? 'border-app-accent bg-app-accent/10 text-app-accent'
                          : 'border-white/5 bg-white/5 text-app-muted hover:bg-white/10'
                      )}
                    >
                      <postType.icon className="h-4 w-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">{postType.label[lang]}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-app-muted ml-1">
                        {lang === 'en' ? 'Language View' : 'عرض اللغة'}
                      </label>
                      <select
                        value={postLanguage}
                        onChange={(e) => setPostLanguage(e.target.value as PostLanguage)}
                        className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none"
                      >
                        <option value="en">English Fields</option>
                        <option value="ar">Arabic Fields</option>
                        <option value="both">Both (Combined)</option>
                      </select>
                    </div>
                    {!isCategoryLocked && (
                      <div className="flex-1">
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-app-muted ml-1">
                          {lang === 'en' ? 'Section' : 'القسم'}
                        </label>
                        <select
                          required
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none"
                        >
                          <option value="">{lang === 'en' ? 'Select...' : 'اختر...'}</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{lang === 'en' ? c.name : c.name_ar}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {(postLanguage === 'en' || postLanguage === 'both') && (
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-app-text focus:border-app-accent/50 focus:outline-none"
                        placeholder="English Title (Optional if Arabic provided)..."
                      />
                    )}
                    {(postLanguage === 'ar' || postLanguage === 'both') && (
                      <input
                        value={secondaryTitle}
                        onChange={(e) => setSecondaryTitle(e.target.value)}
                        dir="rtl"
                        className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-app-text focus:border-app-accent/50 focus:outline-none text-right"
                        placeholder="العنوان بالعربي (اختياري)..."
                      />
                    )}
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1">
                      <input id="media-upload-c" type="file" accept={activeAccept} onChange={handleFileUpload} className="hidden" />
                      <label
                        htmlFor="media-upload-c"
                        className={cn(
                          "flex h-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-app-text hover:border-app-accent/50 hover:bg-white/10 transition-all",
                          (!canUploadForType || uploading) && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin text-app-accent" /> : <Upload className="h-4 w-4 text-app-muted" />}
                        <span className="text-xs font-bold text-app-muted">{uploading ? 'Uploading...' : 'Upload Media'}</span>
                      </label>
                    </div>
                    <div className="flex-1">
                      <input id="cover-upload-c" type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      <label
                        htmlFor="cover-upload-c"
                        className="flex h-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/5 px-4 py-3 text-app-text hover:border-app-accent/50 hover:bg-white/10 transition-all"
                      >
                        <ImageIcon className="h-4 w-4 text-app-muted" />
                        <span className="text-xs font-bold text-app-muted">Add Cover</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <label className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-app-muted ml-1">
                        {lang === 'en' ? 'Article Content' : 'محتوى المقال'}
                      </label>
                      {(postLanguage === 'en' || postLanguage === 'both') && (
                        <RichTextEditor value={content} onChange={setContent} placeholder="English content..." dir="ltr" />
                      )}
                      {(postLanguage === 'ar' || postLanguage === 'both') && (
                        <RichTextEditor value={secondaryContent} onChange={setSecondaryContent} placeholder="Arabic content..." dir="rtl" />
                      )}
                    </div>

                    <div className="space-y-3 opacity-80">
                      <label className="mb-0.5 block text-[10px] font-black uppercase tracking-widest text-app-accent/60 ml-1">
                        {lang === 'en' ? 'SEO Description (Appears in Google Search)' : 'وصف SEO (يظهر في نتائج جوجل)'}
                      </label>
                      {(postLanguage === 'en' || postLanguage === 'both') && (
                        <textarea
                          rows={2}
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          className="w-full resize-none rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-xs text-app-text focus:border-app-accent/50 focus:outline-none"
                          placeholder="English SEO short summary..."
                        />
                      )}
                      {(postLanguage === 'ar' || postLanguage === 'both') && (
                        <textarea
                          rows={2}
                          value={secondaryExcerpt}
                          onChange={(e) => setSecondaryExcerpt(e.target.value)}
                          dir="rtl"
                          className="w-full resize-none rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-xs text-app-text focus:border-app-accent/50 focus:outline-none text-right"
                          placeholder="وصف الملخص لمحركات البحث بالعربي..."
                        />
                      )}
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex w-full items-center justify-between p-4 text-xs font-black uppercase tracking-widest text-app-muted hover:text-app-text"
                    >
                      <span>Advanced Settings</span>
                      {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {showAdvanced && (
                      <div className="p-4 pt-0 space-y-4 border-t border-white/5 mt-2 pt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-[10px] font-black text-app-muted ml-1">Topic/Series</label>
                            <input value={seriesTitle} onChange={e => setSeriesTitle(e.target.value)} className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-xs" />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-black text-app-muted ml-1">Order</label>
                            <input type="number" value={lessonOrder} onChange={e => setLessonOrder(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-xs" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-[10px] font-black text-app-muted ml-1">Parent Course</label>
                          <select value={parentPostId} onChange={e => setParentPostId(e.target.value)} className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-xs">
                            <option value="">None</option>
                            {courseParents.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1.5 block text-[10px] font-black text-app-muted ml-1">Media URL</label>
                            <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-[10px]" />
                          </div>
                          <div>
                            <label className="mb-1.5 block text-[10px] font-black text-app-muted ml-1">Image URL</label>
                            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full rounded-xl border border-white/10 bg-app-bg px-4 py-3 text-[10px]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {error && <div className="text-center text-[10px] font-bold text-red-400 uppercase bg-red-500/10 py-3 rounded-xl border border-red-500/20">{error}</div>}
              </form>
            </div>

            <div className="p-6 pt-4 border-t border-white/5 bg-app-card/80 backdrop-blur-md">
              <button
                type="submit"
                form="create-post-form"
                disabled={loading || categories.length === 0 || (!title && !secondaryTitle)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-app-accent py-4 text-xs font-black uppercase tracking-[0.2em] text-app-bg shadow-xl shadow-app-accent/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {isEditing ? 'Save Changes' : (isAdmin ? 'Publish Post' : 'Submit for Review')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
