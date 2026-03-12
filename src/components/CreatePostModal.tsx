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
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import { Category, ContentCategory, Post, PostType } from '../types';

type Language = 'en' | 'ar';

type CategoryFilterMode = 'sidebar' | 'non-sidebar' | 'all';
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
}) => {
  const { profile } = useAuth();
  const [type, setType] = useState<PostType>('article');
  const [postLanguage, setPostLanguage] = useState<PostLanguage>('en');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [secondaryTitle, setSecondaryTitle] = useState('');
  const [secondaryContent, setSecondaryContent] = useState('');
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

  const isEditing = Boolean(postToEdit);
  const isAdmin = profile?.role === 'admin';
  const isCategoryLocked = Boolean(initialCategorySlug) && !isEditing;
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const activeAccept = typeUploadAccept[type] || '';
  const canUploadForType = Boolean(activeAccept);

  const computedTitle = useMemo(() => {
    if (modalTitle) return modalTitle;
    if (isEditing) return 'Edit Post';
    return categoryFilter === 'sidebar' ? 'Create Sidebar Post' : 'Create Page Post';
  }, [categoryFilter, isEditing, modalTitle]);

  const computedSubtitle = useMemo(() => {
    if (modalSubtitle) return modalSubtitle;
    if (categoryFilter === 'sidebar') {
      return 'Publish into sidebar sections only (Inspiration, Hadith, Dua).';
    }
    return 'Publish content to this page category only, separate from sidebar icons.';
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
          setError(lang === 'en' ? 'No categories found. Run Supabase setup SQL.' : 'لا توجد فئات. نفّذ إعداد Supabase ثم أعد التحميل.');
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
      setSecondaryTitle('');
      setSecondaryContent('');
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
    setSecondaryTitle('');
    setSecondaryContent('');
    setCategoryId(initialCategory?.id || '');
    setImageUrl('');
    setMediaUrl('');
    setSeriesTitle('');
    setLessonOrder(1);
    setParentPostId('');
    setError(null);
  }, [categories, initialCategorySlug, initialType, postToEdit]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!canUploadForType) {
      setError(lang === 'en' ? 'This type does not require a file upload.' : 'هذا النوع لا يحتاج رفع ملف.');
      return;
    }

    if (type === 'image' && !file.type.startsWith('image/')) {
      setError(lang === 'en' ? 'Please upload an image file.' : 'يرجى رفع ملف صورة.');
      return;
    }

    if (type === 'video' && !file.type.startsWith('video/')) {
      setError(lang === 'en' ? 'Please upload a video file.' : 'يرجى رفع ملف فيديو.');
      return;
    }

    if (type === 'audio' && !file.type.startsWith('audio/')) {
      setError(lang === 'en' ? 'Please upload an audio file.' : 'يرجى رفع ملف صوت.');
      return;
    }

    if (type === 'pdf' && file.type !== 'application/pdf') {
      setError(lang === 'en' ? 'Please upload a PDF file.' : 'يرجى رفع ملف PDF.');
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

    if (!file.type.startsWith('image/')) {
      setError(lang === 'en' ? 'Please upload an image file for the cover.' : 'يرجى رفع ملف صورة للغلاف.');
      return;
    }

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
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!profile) {
      setError(lang === 'en' ? 'You must be logged in to create a post.' : 'يجب تسجيل الدخول لإنشاء منشور.');
      return;
    }

    if (!categoryId) {
      setError(lang === 'en' ? 'Choose a category.' : 'اختر فئة.');
      return;
    }

    setLoading(true);
    setError(null);

    const normalizedPrimaryTitle = title.trim();
    const normalizedPrimaryContent = content.trim();
    const normalizedSecondaryTitle = secondaryTitle.trim();
    const normalizedSecondaryContent = secondaryContent.trim();

    const finalTitle = postLanguage === 'both' && normalizedSecondaryTitle
      ? `${normalizedPrimaryTitle} / ${normalizedSecondaryTitle}`
      : normalizedPrimaryTitle;

    const finalContent = postLanguage === 'both' && normalizedSecondaryContent
      ? `${normalizedPrimaryContent}\n\n-----\n\n${normalizedSecondaryContent}`
      : normalizedPrimaryContent;

    const payload = {
      author_id: profile.id,
      category_id: categoryId,
      title: finalTitle,
      content: finalContent,
      post_type: type,
      image_url: imageUrl,
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
      setError(submitError.message || (isEditing ? (lang === 'en' ? 'Error updating post' : 'حدث خطأ أثناء تحديث المنشور') : (lang === 'en' ? 'Error creating post' : 'حدث خطأ أثناء تحديث المنشور')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-start justify-center p-3 sm:items-center sm:p-6">
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
            className="relative mt-2 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-app-card p-5 shadow-2xl sm:mt-0 sm:rounded-[3rem] sm:p-10"
          >
            <button
              onClick={onClose}
              className="absolute right-6 top-6 rounded-full p-2 text-app-text/40 transition-all hover:bg-white/5 hover:text-app-text"
            >
              <X className="h-5 w-5" />
            </button>

            <div className={cn('mb-10', lang === 'ar' && 'text-right')}>
              <h2 className="mb-2 text-3xl font-serif text-app-text">{computedTitle}</h2>
              <p className="text-sm text-app-muted">{computedSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-5">
                {postTypes.map((postType) => (
                  <button
                    key={postType.id}
                    type="button"
                    onClick={() => setType(postType.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all',
                      type === postType.id
                        ? 'border-app-accent bg-app-accent/10 text-app-accent'
                        : 'border-white/5 bg-white/5 text-app-muted hover:bg-white/10'
                    )}
                  >
                    <postType.icon className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{postType.label[lang]}</span>
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                  <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                    {lang === 'en' ? 'Post Language' : 'لغة المنشور'}
                  </label>
                  <select
                    value={postLanguage}
                    onChange={(event) => setPostLanguage(event.target.value as PostLanguage)}
                    className="w-full appearance-none rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none"
                  >
                    <option value="en">{lang === 'en' ? 'English' : 'الإنجليزية'}</option>
                    <option value="ar">{lang === 'en' ? 'Arabic' : 'العربية'}</option>
                    <option value="both">{lang === 'en' ? 'Arabic + English' : 'عربي + إنجليزي'}</option>
                  </select>
                </div>

                <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                  <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                    {postLanguage === 'both'
                      ? (lang === 'en' ? 'Arabic Title' : 'العنوان العربي')
                      : (lang === 'en' ? 'Title' : 'العنوان')}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    dir={postLanguage === 'ar' ? 'rtl' : 'ltr'}
                    className={cn(
                      'w-full rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none',
                      postLanguage === 'ar' ? 'text-right' : 'text-left'
                    )}
                    placeholder={
                      postLanguage === 'both'
                        ? (lang === 'en' ? 'Enter Arabic title...' : 'أدخل العنوان العربي...')
                        : (lang === 'en' ? 'Enter post title...' : 'أدخل عنوان المنشور...')
                    }
                  />
                </div>

                {postLanguage === 'both' && (
                  <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                    <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                      {lang === 'en' ? 'English Title (Optional)' : 'العنوان الإنجليزي (اختياري)'}
                    </label>
                    <input
                      type="text"
                      value={secondaryTitle}
                      onChange={(event) => setSecondaryTitle(event.target.value)}
                      dir="ltr"
                      className={cn(
                        'w-full rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none',
                        'text-left'
                      )}
                      placeholder={lang === 'en' ? 'Enter English title...' : 'أدخل العنوان الإنجليزي...'}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                    <label className="text-xs font-bold uppercase tracking-widest text-app-muted">{lang === 'en' ? 'Category' : 'الفئة'}</label>
                    {isCategoryLocked ? (
                      <input
                        type="text"
                        readOnly
                        value={selectedCategory ? (lang === 'en' ? selectedCategory.name : selectedCategory.name_ar) : ''}
                        className="w-full rounded-2xl border border-app-accent/30 bg-app-accent/10 px-6 py-4 text-app-text"
                      />
                    ) : (
                      <select
                        required
                        value={categoryId}
                        onChange={(event) => setCategoryId(event.target.value)}
                        className="w-full appearance-none rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none"
                      >
                        <option value="">{lang === 'en' ? 'Choose category' : 'اختر الفئة'}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {lang === 'en' ? category.name : category.name_ar}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-app-muted">
                      {categoryFilter === 'sidebar'
                        ? 'This post will appear only under sidebar icons.'
                        : 'This post will appear in the page feed, not sidebar icons.'}
                    </p>
                  </div>

                  <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                    <label className="text-xs font-bold uppercase tracking-widest text-app-muted">{lang === 'en' ? 'Upload Media' : 'رفع الوسائط'}</label>
                    {canUploadForType ? (
                      <div className="relative">
                        <input
                          id="media-upload"
                          type="file"
                          accept={activeAccept}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="media-upload"
                          className={cn(
                            'flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all hover:bg-white/5',
                            uploading && 'cursor-wait opacity-50'
                          )}
                        >
                          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          <span className="text-sm">{lang === 'en' ? 'Choose File' : 'اختر ملف'}</span>
                        </label>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-sm text-app-muted">
                        {lang === 'en' ? 'Text posts do not require media upload.' : 'المنشور النصي لا يحتاج رفع ملف.'}
                      </div>
                    )}
                  </div>

                  <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                    <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                      {lang === 'en' ? 'Upload Cover/Thumbnail (Optional)' : 'رفع غلاف/صورة مصغرة (اختياري)'}
                    </label>
                    <div className="relative">
                      <input
                        id="cover-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="cover-upload"
                        className={cn(
                          'flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all hover:bg-white/5',
                          uploading && 'cursor-wait opacity-50'
                        )}
                      >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        <span className="text-sm">{lang === 'en' ? 'Choose Cover Image' : 'اختر صورة الغلاف'}</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                    <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                      {lang === 'en' ? 'Cover/Thumbnail URL (Optional)' : 'رابط الغلاف/الصورة المصغرة (اختياري)'}
                    </label>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none"
                      placeholder="https://..."
                    />
                  </div>

                  {type !== 'article' && type !== 'image' && (
                    <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                      <label className="text-xs font-bold uppercase tracking-widest text-app-muted">{lang === 'en' ? 'Media URL' : 'رابط الوسائط'}</label>
                      <input
                        type="url"
                        value={mediaUrl}
                        onChange={(event) => setMediaUrl(event.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none"
                        placeholder="https://..."
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {isAdmin && (
                    <>
                      <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                        <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                          {lang === 'en' ? 'Topic Title (Optional)' : 'عنوان السلسلة (اختياري)'}
                        </label>
                        <input
                          type="text"
                          value={seriesTitle}
                          onChange={(event) => setSeriesTitle(event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none"
                          placeholder={lang === 'en' ? 'Example: Al-Arbaeen An-Nawawiyyah' : 'مثال: الأربعون النووية'}
                        />
                        <p className="text-xs text-app-muted">
                          {lang === 'en'
                            ? 'Use same topic title for all lessons in one book/course.'
                            : 'استخدم نفس عنوان السلسلة لكل دروس نفس الكتاب/الدورة.'}
                        </p>
                      </div>

                      <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                        <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                          {lang === 'en' ? 'Lesson Order' : 'ترتيب الدرس'}
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={lessonOrder}
                          onChange={(event) => setLessonOrder(Number(event.target.value) || 1)}
                          className="w-full rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>

                {isAdmin && (
                  <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                    <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                      {lang === 'en' ? 'Parent Course Post (Optional)' : 'المنشور الرئيسي للدورة (اختياري)'}
                    </label>
                    <select
                      value={parentPostId}
                      onChange={(event) => setParentPostId(event.target.value)}
                      className="w-full appearance-none rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none"
                    >
                      <option value="">{lang === 'en' ? 'No parent (this can be course root)' : 'بدون منشور رئيسي'}</option>
                      {courseParents
                        .filter((item) => !postToEdit || item.id !== postToEdit.id)
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.title}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-app-muted">
                      {lang === 'en'
                        ? 'Choose a root course post to make this a child lesson.'
                        : 'اختر منشور دورة رئيسي لجعل هذا المنشور درساً تابعاً.'}
                    </p>
                  </div>
                )}

                <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                  <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                    {postLanguage === 'both'
                      ? (lang === 'en' ? 'Arabic Content' : 'المحتوى العربي')
                      : (lang === 'en' ? 'Content' : 'المحتوى')}
                  </label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    dir={postLanguage === 'ar' ? 'rtl' : 'ltr'}
                    className={cn(
                      'w-full resize-none rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none',
                      postLanguage === 'ar' ? 'text-right' : 'text-left'
                    )}
                    placeholder={
                      postLanguage === 'both'
                        ? (lang === 'en' ? 'Write Arabic content...' : 'اكتب المحتوى العربي...')
                        : (lang === 'en' ? 'Write the full post content here...' : 'اكتب محتوى المنشور الكامل هنا...')
                    }
                  />
                </div>

                {postLanguage === 'both' && (
                  <div className={cn('space-y-2', lang === 'ar' && 'text-right')}>
                    <label className="text-xs font-bold uppercase tracking-widest text-app-muted">
                      {lang === 'en' ? 'English Content (Optional)' : 'المحتوى الإنجليزي (اختياري)'}
                    </label>
                    <textarea
                      rows={6}
                      value={secondaryContent}
                      onChange={(event) => setSecondaryContent(event.target.value)}
                      dir="ltr"
                      className={cn(
                        'w-full resize-none rounded-2xl border border-white/10 bg-app-bg px-6 py-4 text-app-text transition-all focus:border-app-accent/50 focus:outline-none',
                        'text-left'
                      )}
                      placeholder={lang === 'en' ? 'Write English content...' : 'اكتب المحتوى الإنجليزي...'}
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-center text-xs text-red-400">
                  {error}
                </div>
              )}

              {!isAdmin && !isEditing && (
                <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-center text-xs text-amber-300">
                  {lang === 'en'
                    ? 'Your post will appear in Pending status until an admin approves it. You can see it in My Account -> My Posts.'
                    : 'سيظهر منشورك بحالة قيد المراجعة حتى يوافق عليه المشرف. يمكنك رؤيته في حسابي -> منشوراتي.'}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || categories.length === 0}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-app-accent py-5 text-sm font-bold uppercase tracking-widest text-app-bg shadow-2xl shadow-app-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                {isEditing
                  ? lang === 'en'
                    ? 'Save Changes'
                    : 'حفظ التعديلات'
                  : isAdmin
                    ? lang === 'en'
                      ? 'Publish Post'
                      : 'نشر المنشور'
                    : lang === 'en'
                      ? 'Submit For Approval'
                      : 'إرسال للمراجعة'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
