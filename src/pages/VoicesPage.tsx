import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Globe, ArrowLeft, Search, Clock, User, Share2, Heart, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { PostViewerModal } from '../components/PostViewerModal';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';

interface VoicesPageProps {
  lang: 'en' | 'ar';
}

interface CourseGroup {
  key: string;
  title: string;
  posts: Post[];
  startPost: Post;
  previewPost: Post;
}

export const VoicesPage: React.FC<VoicesPageProps> = ({ lang }) => {
  const { profile } = useAuth();
  const [blogs, setBlogs] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [activeCoursePosts, setActiveCoursePosts] = useState<Post[] | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await postService.getPosts({
        is_approved: true,
        orderBy: 'created_at',
      });
      setBlogs(data.filter((p) => p.post_type === 'blog' || p.post_type === 'blogger'));
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBlogs();
  }, []);

  const canManagePost = (post: Post) => Boolean(profile && (profile.role === 'admin' || profile.id === post.author_id));

  const handleDeleteBlog = async (postId: string) => {
    if (deletingId) return;
    const confirmed = window.confirm(lang === 'en' ? 'Delete this post?' : 'هل تريد حذف هذا المنشور؟');
    if (!confirmed) return;

    try {
      setDeletingId(postId);
      await postService.deletePost(postId);
      if (activePost?.id === postId) {
        setActivePost(null);
        setActiveCoursePosts(null);
      }
      await fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog post:', error);
      window.alert(lang === 'en' ? 'Unable to delete this post.' : 'تعذر حذف هذا المنشور.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBlogs = blogs.filter(
    (blog) =>
      blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      blog.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCourses = useMemo<CourseGroup[]>(() => {
    const grouped = new Map<string, Post[]>();

    filteredBlogs.forEach((post) => {
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
  }, [filteredBlogs]);

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <PostViewerModal
        isOpen={!!activePost}
        onClose={() => {
          setActivePost(null);
          setActiveCoursePosts(null);
        }}
        post={activePost}
        coursePosts={activeCoursePosts}
        lang={lang}
        onUpdated={() => void fetchBlogs()}
        onRequestEdit={(post) => setEditingPost(post)}
      />

      <div className="container mx-auto px-6">
        <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12', lang === 'ar' && 'md:flex-row-reverse text-right')}>
          <div>
            <Link to="/" className={cn('inline-flex items-center gap-2 text-app-accent mb-4 hover:underline', lang === 'ar' && 'flex-row-reverse')}>
              <ArrowLeft className="w-4 h-4" />
              {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
            </Link>
            <h1 className="text-6xl md:text-7xl font-serif text-app-text mb-8 leading-tight">
              {lang === 'en' ? 'Voices of Vision' : 'أصوات الرؤية'}
            </h1>
            <p className="text-app-muted text-xl leading-relaxed">
              {lang === 'en'
                ? 'A platform for diverse Islamic perspectives, deep reflections, and intellectual discourse from our global community of thinkers.'
                : 'منصة لمختلف المنظورات الإسلامية، والتأملات العميقة، والخطاب الفكري من مجتمع المفكرين العالمي لدينا.'}
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted', lang === 'ar' ? 'right-4' : 'left-4')} />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search voices...' : 'ابحث في الأصوات...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full bg-app-card border border-white/10 rounded-2xl py-4 text-sm text-app-text focus:outline-none focus:border-app-accent/50 transition-all',
                lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'
              )}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-app-card rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : groupedCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {groupedCourses.map((course, i) => (
              <motion.div
                key={course.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group bg-app-card rounded-[2.5rem] overflow-hidden border border-white/5 hover:border-app-accent/30 transition-all shadow-xl flex flex-col"
              >
                {course.previewPost.image_url && (
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={course.previewPost.image_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className={cn('absolute bottom-4 flex items-center gap-2', lang === 'ar' ? 'right-4' : 'left-4')}>
                      <span className="bg-app-bg/80 backdrop-blur-md text-app-accent text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                        {course.previewPost.category?.name || 'Blog'}
                      </span>
                    </div>
                  </div>
                )}
                <div className={cn('p-10 flex-1 flex flex-col', lang === 'ar' && 'text-right')}>
                  <div className={cn('flex items-center gap-4 text-xs text-app-muted mb-6', lang === 'ar' && 'flex-row-reverse')}>
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {course.startPost.author_name || course.startPost.author_id.substring(0, 8)}</span>
                    <span className="w-1 h-1 bg-white/10 rounded-full" />
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.posts.length} {lang === 'en' ? 'Lessons' : 'دروس'}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-app-text mb-4 group-hover:text-app-accent transition-colors">{course.title}</h3>
                  <p className="text-app-muted text-sm line-clamp-3 mb-8 flex-1 leading-relaxed">{course.previewPost.content}</p>
                  <div className={cn('flex items-center justify-between mt-auto pt-6 border-t border-white/5', lang === 'ar' && 'flex-row-reverse')}>
                    <button
                      onClick={() => {
                        setActivePost(course.startPost);
                        setActiveCoursePosts(course.posts);
                      }}
                      className="text-app-accent text-sm font-bold hover:underline flex items-center gap-2"
                    >
                      {lang === 'en' ? 'Open Course' : 'فتح الدورة'}
                    </button>
                    <div className="flex items-center gap-4">
                      {canManagePost(course.startPost) && (
                        <>
                          <button
                            onClick={() => setEditingPost(course.startPost)}
                            className="p-2 text-app-muted hover:text-app-accent transition-colors"
                            title={lang === 'en' ? 'Edit' : 'تعديل'}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handleDeleteBlog(course.startPost.id)}
                            disabled={deletingId === course.startPost.id}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            title={lang === 'en' ? 'Delete' : 'حذف'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button className="p-2 text-app-muted hover:text-app-accent transition-colors"><Heart className="w-4 h-4" /></button>
                      <button className="p-2 text-app-muted hover:text-app-accent transition-colors"><Share2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-app-muted">{lang === 'en' ? 'No blogs found.' : 'لم يتم العثور على مدونات.'}</p>
          </div>
        )}
      </div>

      <CreatePostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        lang={lang}
        postToEdit={editingPost}
        categoryFilter="non-sidebar"
        onSuccess={() => {
          setEditingPost(null);
          void fetchBlogs();
        }}
      />
    </div>
  );
};
