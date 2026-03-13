import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, ArrowLeft, Search, Clock, User, Heart, MessageSquare, Plus, Trash2, Pencil, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';
import { PostViewerModal } from '../components/PostViewerModal';
import { buildPostPath } from '../lib/postRoutes';

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
  const { profile } = useAuth();
  const [articles, setArticles] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [activeCoursePosts, setActiveCoursePosts] = useState<Post[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchArticles = async () => {
    try {
      setLoading(true);
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
      const key =
        post.parent_post_id ||
        (post.series_slug
          ? `series:${post.series_slug}`
          : `category:${post.category?.slug || post.category_id || 'uncategorized'}`);
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

      const startPost = key.startsWith('post:') ? sorted[0] : sorted.find((item) => item.id === key) || sorted[0];
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
      if (activePost?.id === postId) {
        setActivePost(null);
        setActiveCoursePosts(null);
      }
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
      <PostViewerModal
        isOpen={!!activePost}
        onClose={() => {
          setActivePost(null);
          setActiveCoursePosts(null);
        }}
        post={activePost}
        coursePosts={activeCoursePosts}
        lang={lang}
        onUpdated={() => void fetchArticles()}
      />

      <div className="min-h-screen bg-app-bg pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16', lang === 'ar' && 'md:flex-row-reverse text-right')}>
            <div className="max-w-3xl">
              <Link to="/" className={cn('inline-flex items-center gap-2 text-app-accent mb-6 hover:underline group', lang === 'ar' && 'flex-row-reverse')}>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
              </Link>
              <h1 className="text-5xl md:text-6xl font-serif text-app-text mb-6">
                {lang === 'en' ? 'Knowledge Articles' : 'مقالات المعرفة'}
              </h1>
              <p className="text-app-muted text-lg leading-relaxed">
                {lang === 'en'
                  ? 'Deep dives into Islamic jurisprudence, history, and contemporary issues written by scholars and students of knowledge.'
                  : 'مقالات معمقة في الفقه والتاريخ والقضايا المعاصرة يكتبها أهل العلم وطلبته.'}
              </p>
              {profile && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/20"
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'en' ? 'Submit Article' : 'إرسال مقال'}
                </button>
              )}
            </div>

            <div className="relative w-full md:w-96">
              <Search className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted', lang === 'ar' ? 'right-6' : 'left-6')} />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search articles...' : 'ابحث في المقالات...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full bg-app-card border border-white/10 rounded-3xl py-5 text-sm text-app-text focus:outline-none focus:border-app-accent/50 transition-all shadow-2xl',
                  lang === 'ar' ? 'pr-16 pl-6' : 'pl-16 pr-6'
                )}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-96 bg-app-card rounded-[3rem] animate-pulse" />
              ))}
            </div>
          ) : groupedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {groupedCourses.map((course, i) => (
                <motion.div
                  key={course.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-app-card rounded-[3rem] overflow-hidden border border-white/5 hover:border-app-accent/30 transition-all shadow-xl flex flex-col md:flex-row"
                >
                  {course.previewPost.image_url && (
                    <div className="w-full md:w-2/5 relative overflow-hidden h-64 md:h-auto">
                      <img
                        src={course.previewPost.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-app-card/80 to-transparent md:block hidden" />
                    </div>
                  )}
                  <div className={cn('p-10 flex-1 flex flex-col', lang === 'ar' && 'text-right')}>
                    <div className={cn('flex items-center gap-4 text-[10px] text-app-muted mb-6 uppercase tracking-widest font-bold', lang === 'ar' && 'flex-row-reverse')}>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {course.posts.length} {lang === 'en' ? 'Lessons' : 'دروس'}
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-app-accent" /> {course.startPost.author_name || (lang === 'en' ? 'Scholar' : 'كاتب')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-app-text mb-4 group-hover:text-app-accent transition-colors line-clamp-2 leading-tight">
                      {course.title}
                    </h3>
                    {!course.startPost.is_approved && (
                      <span className="mb-3 inline-flex w-fit rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                        {lang === 'en' ? 'Pending Approval' : 'بانتظار الموافقة'}
                      </span>
                    )}
                    <p className="text-app-muted text-sm line-clamp-3 mb-8 flex-1 leading-relaxed">{course.previewPost.content}</p>
                    <div className={cn('flex items-center justify-between pt-6 border-t border-white/5', lang === 'ar' && 'flex-row-reverse')}>
                      <Link
                        to={buildPostPath(course.startPost)}
                        className="text-app-accent text-sm font-bold hover:underline flex items-center gap-2"
                      >
                        {lang === 'en' ? 'Open Article' : 'فتح المقال'}
                      </Link>
                      <div className="flex items-center gap-4">
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={() => setEditingPost(course.startPost)}
                            className="text-app-muted hover:text-app-accent transition-colors flex items-center gap-1.5 text-xs"
                          >
                            <Pencil className="w-4 h-4" />
                            {lang === 'en' ? 'Edit' : 'تعديل'}
                          </button>
                        )}
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={() => void handleDeleteArticle(course.startPost.id)}
                            disabled={deletingId === course.startPost.id}
                            className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            {lang === 'en' ? 'Delete' : 'حذف'}
                          </button>
                        )}
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={() => void handleShareArticle(course.startPost)}
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
              ))}
            </div>
          ) : (
            <div className="text-center py-32 glass rounded-[4rem] border border-white/5">
              <FileText className="w-20 h-20 text-app-muted mx-auto mb-8 opacity-20" />
              <p className="text-app-muted text-xl">{lang === 'en' ? 'No articles found.' : 'لا توجد مقالات متاحة.'}</p>
            </div>
          )}
        </div>

        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          lang={lang}
          initialType="article"
          initialCategorySlug="articles"
          categoryFilter="non-sidebar"
          modalTitle={lang === 'en' ? 'Create Article' : 'إنشاء مقال'}
          modalSubtitle={lang === 'en' ? 'Submit articles for review or publish directly if admin.' : 'أرسل المقالات للمراجعة أو انشر مباشرة إذا كنت مشرفاً.'}
          onSuccess={() => {
            setIsCreateOpen(false);
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
