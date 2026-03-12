import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { Play, Clock, Star, ArrowLeft, Search, Plus, Trash2, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';
import { PostViewerModal } from '../components/PostViewerModal';

interface AcademyPageProps {
  lang: 'en' | 'ar';
}

interface CourseGroup {
  key: string;
  title: string;
  posts: Post[];
  startPost: Post;
  previewPost: Post;
}

export const AcademyPage: React.FC<AcademyPageProps> = ({ lang }) => {
  const { profile } = useAuth();
  const [lessons, setLessons] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [activeCoursePosts, setActiveCoursePosts] = useState<Post[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      setLoading(true);
      const data = await postService.getPosts({
        is_approved: true,
        orderBy: 'created_at',
      });
      setLessons(
        data.filter(
          (p) => (p.post_type === 'video' || p.post_type === 'audio') && p.category?.slug === 'academy'
        )
      );
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchLessons();
  }, [fetchLessons]);

  const filteredLessons = lessons.filter(
    (lesson) =>
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCourses = useMemo<CourseGroup[]>(() => {
    const grouped = new Map<string, Post[]>();

    filteredLessons.forEach((post) => {
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
  }, [filteredLessons]);

  const canManagePost = (post: Post) => Boolean(profile && (profile.role === 'admin' || profile.id === post.author_id));

  const handleDeleteLesson = async (postId: string) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      lang === 'en' ? 'Delete this academy lesson?' : 'هل تريد حذف هذا الدرس من الأكاديمية؟'
    );

    if (!confirmed) return;

    try {
      setDeletingId(postId);
      await postService.deletePost(postId);
      if (activePost?.id === postId) {
        setActivePost(null);
        setActiveCoursePosts(null);
      }
      await fetchLessons();
    } catch (error) {
      console.error('Error deleting academy lesson:', error);
      window.alert(
        lang === 'en'
          ? 'Unable to delete this lesson. Please check permissions and try again.'
          : 'تعذر حذف الدرس. يرجى التحقق من الصلاحيات والمحاولة مرة أخرى.'
      );
    } finally {
      setDeletingId(null);
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
        onUpdated={() => void fetchLessons()}
        onRequestEdit={(post) => setEditingPost(post)}
      />

      <div className="min-h-screen bg-app-bg pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-8 mb-20', lang === 'ar' && 'md:flex-row-reverse text-right')}>
            <div className="max-w-3xl">
              <Link to="/" className={cn('inline-flex items-center gap-2 text-app-accent mb-8 hover:underline group', lang === 'ar' && 'flex-row-reverse')}>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
              </Link>
              <h1 className="text-6xl md:text-7xl font-serif text-app-text mb-8 leading-tight">
                {lang === 'en' ? 'Vision Academy' : 'أكاديمية الرؤية'}
              </h1>
              <p className="text-app-muted text-xl leading-relaxed">
                {lang === 'en'
                  ? 'Immersive learning experiences designed to deepen your understanding of Islamic principles, history, and spirituality.'
                  : 'تجارب تعليمية غامرة مصممة لتعميق فهمك للمبادئ الإسلامية والتاريخ والروحانية.'}
              </p>

              {profile?.role === 'admin' && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/20"
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'en' ? 'Upload Video Lesson' : 'رفع درس فيديو'}
                </button>
              )}
            </div>

            <div className="relative w-full md:w-96">
              <Search className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted', lang === 'ar' ? 'right-6' : 'left-6')} />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search academy...' : 'ابحث في الأكاديمية...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full bg-app-card border border-white/10 rounded-3xl py-6 text-sm text-app-text focus:outline-none focus:border-app-accent/50 transition-all shadow-2xl',
                  lang === 'ar' ? 'pr-16 pl-6' : 'pl-16 pr-6'
                )}
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-video bg-app-card rounded-[3rem] animate-pulse" />
              ))}
            </div>
          ) : groupedCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {groupedCourses.map((course, i) => (
                <motion.div
                  key={course.key}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-app-card rounded-[3rem] overflow-hidden border border-white/5 hover:border-app-accent/30 transition-all shadow-2xl flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    {course.previewPost.image_url ? (
                      <img
                        src={course.previewPost.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-app-accent/10 via-white/5 to-app-bg">
                        {course.previewPost.post_type === 'audio' ? (
                          <Music className="h-16 w-16 text-app-accent/70" />
                        ) : (
                          <Play className="h-16 w-16 text-app-accent/70" />
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <div className="w-20 h-20 bg-app-accent rounded-full flex items-center justify-center text-app-bg scale-75 group-hover:scale-100 transition-transform shadow-2xl">
                        {course.previewPost.post_type === 'audio' ? <Music className="w-10 h-10" /> : <Play className="w-10 h-10 fill-current" />}
                      </div>
                    </div>
                    <div className={cn('absolute bottom-6 flex items-center gap-2', lang === 'ar' ? 'right-6' : 'left-6')}>
                      <span className="bg-app-accent text-app-bg text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        {course.previewPost.category?.name || 'Academy'}
                      </span>
                    </div>
                  </div>
                  <div className={cn('p-10 flex-1 flex flex-col', lang === 'ar' && 'text-right')}>
                    <div className={cn('flex items-center gap-6 text-[10px] text-app-muted mb-6 uppercase tracking-widest font-bold', lang === 'ar' && 'flex-row-reverse')}>
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4" /> {course.posts.length} {lang === 'en' ? 'Lessons' : 'دروس'}
                      </span>
                      <span className="w-1.5 h-1.5 bg-app-accent/30 rounded-full" />
                      <span className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-app-accent fill-app-accent" /> {course.posts.reduce((sum, post) => sum + (post.views_count || 0), 0)} views
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-app-text mb-4 group-hover:text-app-accent transition-colors line-clamp-2 leading-tight">
                      {course.title}
                    </h3>
                    <p className="text-app-muted text-sm line-clamp-2 mb-8 flex-1 leading-relaxed">{course.previewPost.content}</p>
                    <button
                      onClick={() => {
                        setActivePost(course.startPost);
                        setActiveCoursePosts(course.posts);
                      }}
                      className="w-full py-5 bg-white/5 border border-white/10 rounded-2xl text-app-text text-sm font-bold hover:bg-app-accent hover:text-app-bg hover:border-app-accent transition-all shadow-xl"
                    >
                      {lang === 'en' ? 'Open Course' : 'فتح الدورة'}
                    </button>
                    {canManagePost(course.startPost) && (
                      <button
                        onClick={() => void handleDeleteLesson(course.startPost.id)}
                        disabled={deletingId === course.startPost.id}
                        className="mt-3 w-full py-3 rounded-2xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          {lang === 'en' ? 'Delete' : 'حذف'}
                        </span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 glass rounded-[4rem] border border-white/5">
              <Play className="w-20 h-20 text-app-muted mx-auto mb-8 opacity-20" />
              <p className="text-app-muted text-xl">{lang === 'en' ? 'No academy lessons found.' : 'لا توجد دروس أكاديمية حالياً.'}</p>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        lang={lang}
        initialType="video"
        initialCategorySlug="academy"
        categoryFilter="non-sidebar"
        modalTitle={lang === 'en' ? 'Create Academy Lesson' : 'إنشاء درس أكاديمي'}
        modalSubtitle={lang === 'en' ? 'Upload videos for the Academy page only. This content will not appear in sidebar icons.' : 'ارفع فيديوهات لصفحة الأكاديمية فقط. هذا المحتوى لن يظهر في أيقونات الشريط الجانبي.'}
        onSuccess={() => {
          setIsCreateOpen(false);
          window.dispatchEvent(new Event('posts-updated'));
          void fetchLessons();
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
          void fetchLessons();
        }}
      />
    </>
  );
};
