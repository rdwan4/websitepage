import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowLeft, Search, Clock, User, Heart, MessageSquare, Plus, Trash2, Pencil, Share2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';
import { buildPostPath } from '../lib/postRoutes';
import { isNativeApp } from '../lib/runtime';
import { getPostPreviewImage } from '../lib/media';

interface ArticlesPageProps {
  lang: 'en' | 'ar';
}

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

export const ArticlesPage: React.FC<ArticlesPageProps> = ({ lang }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const nativeApp = isNativeApp();
  const [articles, setArticles] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activeParentForCreate, setActiveParentForCreate] = useState<Post | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await postService.getPosts({
        is_approved: true,
        orderBy: 'created_at',
      });

      const approvedArticles = data.filter((p) => isArticlesCategory(p));

      if (!profile) {
        setArticles(approvedArticles);
        return;
      }

      const ownPosts = await postService.getUserPosts(profile.id, 100);
      const ownArticles = ownPosts.filter((p) => isArticlesCategory(p));

      const merged = [...ownArticles, ...approvedArticles];
      const deduped = Array.from(new Map(merged.map((post) => [post.id, post])).values());
      setArticles(deduped);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setLoadError(
        lang === 'en'
          ? 'We could not load articles right now. Please try again.'
          : 'تعذر تحميل المقالات الآن. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchArticles();
  }, [profile?.id]);

  const filteredArticles = articles.filter(
    (article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCourses = useMemo<CourseGroup[]>(() => {
    const grouped = new Map<string, Post[]>();

    filteredArticles.forEach((post) => {
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

      const startPost = sorted.find((item) => item.id === key) || sorted[0];
      const previewPost = sorted[0];

      return {
        key,
        title: previewPost.series_title || startPost.title,
        posts: sorted,
        startPost,
        previewPost,
      };
    });
  }, [filteredArticles]);

  const canManagePost = (post: Post) => Boolean(profile && (profile.role === 'admin' || profile.id === post.author_id));

  const handleDeleteArticle = async (postId: string) => {
    if (deletingId) return;

    const confirmed = window.confirm(lang === 'en' ? 'Delete this article?' : 'هل تريد حذف هذا المقال؟');
    if (!confirmed) return;

    try {
      setDeletingId(postId);
      await postService.deletePost(postId);
      if (editingPost?.id === postId) setEditingPost(null);
      await fetchArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      window.alert(
        lang === 'en'
          ? 'Unable to delete this article. Please check permissions and try again.'
          : 'تعذر حذف المقال. يرجى التحقق من الصلاحيات والمحاولة مرة أخرى.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleShareArticle = async (post: Post) => {
    const shareUrl = `${window.location.origin}${buildPostPath(post)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || post.content.slice(0, 140),
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing article:', error);
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      window.alert(lang === 'en' ? 'Link copied to clipboard.' : 'تم نسخ الرابط.');
    } catch (error) {
      console.error('Error copying share link:', error);
    }
  };

  return (
    <>

      <div className={cn('min-h-screen bg-app-bg pt-20 md:pt-44', nativeApp ? 'pb-28 md:pb-20' : 'pb-24 md:pb-20')}>
        <div className="container mx-auto px-4 sm:px-6">
          <div className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between', nativeApp ? 'mb-6 md:mb-12' : 'mb-8 md:mb-16', lang === 'ar' && 'md:flex-row-reverse text-right')}>
            <div className="max-w-3xl">
              <Link to="/" className={cn('mb-4 inline-flex items-center gap-2 text-app-accent hover:underline group md:mb-6', lang === 'ar' && 'flex-row-reverse')}>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
              </Link>
              <h1 className={cn('font-serif text-app-text', nativeApp ? 'mb-2.5 text-[1.9rem] md:mb-5 md:text-5xl' : 'mb-3 text-[2.15rem] md:mb-6 md:text-6xl')}>
                {lang === 'en' ? 'Knowledge Articles' : 'مقالات المعرفة'}
              </h1>
              <p className={cn('text-app-muted', nativeApp ? 'text-[0.9rem] leading-6 md:text-base' : 'text-[0.96rem] leading-7 md:text-lg')}>
                {lang === 'en'
                  ? 'Deep dives into Islamic jurisprudence, history, and contemporary issues written by scholars and students of knowledge.'
                  : 'مقالات معمقة في الفقه والتاريخ والقضايا المعاصرة يكتبها أهل العلم وطلبته.'}
              </p>
              {profile && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className={cn(
                    'mt-4 inline-flex items-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/10 font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/20',
                    nativeApp ? 'px-3.5 py-2 text-[10px] md:px-5 md:py-3' : 'px-4 py-2.5 text-[11px] md:px-5 md:py-3'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'en' ? 'Submit Article' : 'إرسال مقال'}
                </button>
              )}
            </div>

            <div className={cn('relative w-full', nativeApp ? 'md:w-80' : 'md:w-96')}>
              <Search className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted', lang === 'ar' ? 'right-6' : 'left-6')} />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search articles...' : 'ابحث في المقالات...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  nativeApp
                    ? 'w-full rounded-[1.2rem] border border-white/10 bg-app-card py-3 text-sm text-app-text shadow-xl transition-all focus:border-app-accent/50 focus:outline-none md:rounded-3xl md:py-5'
                    : 'w-full rounded-[1.35rem] border border-white/10 bg-app-card py-3.5 text-sm text-app-text shadow-2xl transition-all focus:border-app-accent/50 focus:outline-none md:rounded-3xl md:py-5',
                  lang === 'ar' ? 'pr-16 pl-6' : 'pl-16 pr-6'
                )}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-80 rounded-[2rem] bg-app-card animate-pulse md:h-96 md:rounded-[3rem]" />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 px-6 py-10 text-center md:rounded-[3rem]">
              <FileText className="mx-auto mb-5 h-14 w-14 text-red-300/80" />
              <p className="mb-4 text-base text-red-200">{loadError}</p>
              <button
                onClick={() => void fetchArticles()}
                className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-app-text hover:bg-white/15"
              >
                {lang === 'en' ? 'Try Again' : 'إعادة المحاولة'}
              </button>
            </div>
          ) : groupedCourses.length > 0 ? (
            <div className={cn('grid grid-cols-1 md:grid-cols-2', nativeApp ? 'gap-4 md:gap-8' : 'gap-6 md:gap-10')}>
              {groupedCourses.map((course, i) => (
                (() => {
                  const previewImage = getPostPreviewImage(course.previewPost);
                  return (
                <motion.div
                  key={course.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    'group flex flex-col overflow-hidden border border-white/5 bg-app-card transition-all hover:border-app-accent/30 md:flex-row cursor-pointer',
                    nativeApp ? 'rounded-[1.2rem] shadow-lg md:rounded-[2rem]' : 'rounded-[1.55rem] shadow-xl md:rounded-[3rem]'
                  )}
                  onClick={() => navigate(buildPostPath(course.startPost))}
                >
                  {previewImage && (
                    <div className={cn('relative w-full overflow-hidden md:h-auto md:w-2/5', nativeApp ? 'h-44' : 'h-52')}>
                      <img
                        src={previewImage}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-app-card/80 to-transparent md:block hidden" />
                    </div>
                  )}
                  <div className={cn(nativeApp ? 'flex flex-1 flex-col p-4 md:p-7' : 'flex flex-1 flex-col p-4.5 md:p-10', lang === 'ar' && 'text-right')}>
                    <div className={cn(nativeApp ? 'mb-2.5 flex flex-wrap items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-app-muted md:mb-4 md:gap-3' : 'mb-3 flex flex-wrap items-center gap-2.5 text-[10px] font-bold uppercase tracking-widest text-app-muted md:mb-6 md:gap-4', lang === 'ar' && 'flex-row-reverse')}>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {course.posts.length} {lang === 'en' ? 'Lessons' : 'دروس'}
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-app-accent" /> {course.startPost.author_name || (lang === 'en' ? 'Scholar' : 'كاتب')}
                      </span>
                    </div>
                    <h3 className={cn('line-clamp-2 font-bold leading-tight text-app-text transition-colors group-hover:text-app-accent', nativeApp ? 'mb-2 text-[1rem] md:text-[1.35rem]' : 'mb-2.5 text-[1.1rem] md:mb-4 md:text-2xl')}>
                      {course.title}
                    </h3>
                    {!course.startPost.is_approved && (
                      <span className="mb-3 inline-flex w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                        {lang === 'en' ? 'Pending Approval' : 'بانتظار الموافقة'}
                      </span>
                    )}
                    <p className={cn('flex-1 text-sm text-app-muted', nativeApp ? 'mb-3 line-clamp-2 leading-5.5 md:mb-5' : 'mb-4 line-clamp-2 leading-6 md:mb-8 md:line-clamp-3 md:leading-7')}>{course.previewPost.content}</p>
                    <div className={cn(nativeApp ? 'flex flex-col gap-2.5 border-t border-white/5 pt-3 sm:flex-row sm:items-center sm:justify-between md:pt-5' : 'flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between md:gap-4 md:pt-6', lang === 'ar' && 'sm:flex-row-reverse')}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(buildPostPath(course.startPost));
                        }}
                        className="text-app-accent text-sm font-bold hover:underline flex items-center gap-2"
                      >
                        {lang === 'en' ? 'Open Article' : 'فتح المقال'}
                      </button>
                      <div className="flex flex-wrap items-center gap-3 md:gap-4">
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPost(course.startPost);
                            }}
                            className="text-app-muted hover:text-app-accent transition-colors flex items-center gap-1.5 text-xs"
                          >
                            <Pencil className="w-4 h-4" />
                            {lang === 'en' ? 'Edit' : 'تعديل'}
                          </button>
                        )}
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleDeleteArticle(course.startPost.id);
                            }}
                            disabled={deletingId === course.startPost.id}
                            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            {lang === 'en' ? 'Delete' : 'حذف'}
                          </button>
                        )}
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleShareArticle(course.startPost);
                            }}
                            className="text-app-muted hover:text-app-accent transition-colors flex items-center gap-1.5 text-xs"
                          >
                            <Share2 className="w-4 h-4" />
                            {lang === 'en' ? 'Share' : 'مشاركة'}
                          </button>
                        )}
                        <button className="text-app-muted hover:text-app-accent transition-colors flex items-center gap-1.5 text-xs">
                          <Heart className="w-4 h-4" /> {course.posts.reduce((sum, p) => sum + (p.likes_count || 0), 0)}
                        </button>
                        <button className="text-app-muted hover:text-app-accent transition-colors flex items-center gap-1.5 text-xs">
                          <MessageSquare className="w-4 h-4" /> {course.posts.reduce((sum, p) => sum + (p.comments_count || 0), 0)}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
                  );
                })()
              ))}
            </div>
          ) : (
            <div className="text-center py-32 glass rounded-[4rem] border border-white/5">
              <FileText className="w-20 h-20 text-app-muted mx-auto mb-8 opacity-20" />
              <p className="text-app-muted text-xl">
                {searchQuery
                  ? (lang === 'en' ? 'No articles match your search yet.' : 'لا توجد مقالات تطابق بحثك حالياً.')
                  : (lang === 'en' ? 'No articles are published yet.' : 'لا توجد مقالات منشورة بعد.')}
              </p>
            </div>
          )}
        </div>

        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => {
            setIsCreateOpen(false);
            setActiveParentForCreate(null);
          }}
          lang={lang}
          initialType="article"
          initialCategorySlug="articles"
          initialParentPostId={activeParentForCreate?.id}
          categoryFilter="non-sidebar"
          modalTitle={lang === 'en' ? 'Create Article' : 'إنشاء مقال'}
          modalSubtitle={lang === 'en' ? 'Submit articles for review or publish directly if admin.' : 'أرسل المقالات للمراجعة أو انشر مباشرة إذا كنت مشرفاً.'}
          onSuccess={() => {
            setIsCreateOpen(false);
            setActiveParentForCreate(null);
            window.dispatchEvent(new Event('posts-updated'));
            void fetchArticles();
          }}
        />

        <CreatePostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          lang={lang}
          postToEdit={editingPost}
          categoryFilter="non-sidebar"
          onSuccess={() => {
            setEditingPost(null);
            void fetchArticles();
          }}
        />
      </div>
    </>
  );
};
