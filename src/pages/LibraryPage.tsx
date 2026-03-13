import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, ArrowLeft, Search, Download, Star, Share2, Heart, Book, Plus, Trash2, Music, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';
import { PostViewerModal } from '../components/PostViewerModal';
import { buildPostPath } from '../lib/postRoutes';

interface LibraryPageProps {
  lang: 'en' | 'ar';
}

interface CourseGroup {
  key: string;
  title: string;
  posts: Post[];
  startPost: Post;
  previewPost: Post;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({ lang }) => {
  const { profile } = useAuth();
  const [books, setBooks] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [activeCoursePosts, setActiveCoursePosts] = useState<Post[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const data = await postService.getPosts({
        is_approved: true,
        orderBy: 'created_at',
      });
      setBooks(
        data.filter(
          (p) => (p.post_type === 'pdf' || p.post_type === 'audio') && p.category?.slug === 'library'
        )
      );
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBooks();
  }, []);

  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedCourses = useMemo<CourseGroup[]>(() => {
    const grouped = new Map<string, Post[]>();

    filteredBooks.forEach((post) => {
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
  }, [filteredBooks]);

  const canManagePost = (post: Post) => Boolean(profile && (profile.role === 'admin' || profile.id === post.author_id));

  const handleDeleteBook = async (postId: string) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      lang === 'en' ? 'Delete this library post?' : 'هل تريد حذف منشور المكتبة هذا؟'
    );

    if (!confirmed) return;

    try {
      setDeletingId(postId);
      await postService.deletePost(postId);
      if (activePost?.id === postId) {
        setActivePost(null);
        setActiveCoursePosts(null);
      }
      await fetchBooks();
    } catch (error) {
      console.error('Error deleting library post:', error);
      window.alert(
        lang === 'en'
          ? 'Unable to delete this post. Please check permissions and try again.'
          : 'تعذر حذف المنشور. يرجى التحقق من الصلاحيات والمحاولة مرة أخرى.'
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
        onUpdated={() => void fetchBooks()}
        onRequestEdit={(post) => setEditingPost(post)}
      />

      <div className="min-h-screen bg-app-bg pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className={cn('flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16', lang === 'ar' && 'md:flex-row-reverse text-right')}>
            <div>
              <Link to="/" className={cn('inline-flex items-center gap-2 text-app-accent mb-6 hover:underline group', lang === 'ar' && 'flex-row-reverse')}>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
              </Link>
              <h1 className="text-5xl md:text-6xl font-serif text-app-text mb-6">
                {lang === 'en' ? 'Digital Library' : 'المكتبة الرقمية'}
              </h1>
              <p className="text-app-muted max-w-2xl text-lg leading-relaxed">
                {lang === 'en'
                  ? 'Access a curated collection of authentic Islamic literature, research papers, and classical texts in digital format.'
                  : 'تصفح مجموعة مختارة من الكتب الإسلامية الموثوقة والأوراق البحثية والنصوص الكلاسيكية بصيغة رقمية.'}
              </p>
              {profile?.role === 'admin' && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/20"
                >
                  <Plus className="h-4 w-4" />
                  {lang === 'en' ? 'Upload PDF Book' : 'رفع كتاب PDF'}
                </button>
              )}
            </div>

            <div className="relative w-full md:w-96">
              <Search className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted', lang === 'ar' ? 'right-6' : 'left-6')} />
              <input
                type="text"
                placeholder={lang === 'en' ? 'Search library...' : 'ابحث في المكتبة...'}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[3/4] bg-app-card rounded-[2rem] animate-pulse" />
              ))}
            </div>
          ) : groupedCourses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {groupedCourses.map((course, i) => (
                <motion.div
                  key={course.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group bg-app-card rounded-[2rem] overflow-hidden border border-white/5 hover:border-app-accent/30 transition-all shadow-xl flex flex-col"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
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
                          <BookOpen className="h-16 w-16 text-app-accent/70" />
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-app-bg via-transparent to-transparent opacity-60" />
                    <div className={cn('absolute bottom-6 flex items-center gap-2', lang === 'ar' ? 'right-6' : 'left-6')}>
                      <span className="bg-app-accent text-app-bg text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                        {course.previewPost.category?.name || 'Book'}
                      </span>
                    </div>
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-3 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-app-accent hover:text-app-bg transition-all">
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className={cn('p-8 flex-1 flex flex-col', lang === 'ar' && 'text-right')}>
                    <div className={cn('flex items-center gap-4 text-[10px] text-app-muted mb-4 uppercase tracking-widest font-bold', lang === 'ar' && 'flex-row-reverse')}>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3" /> {course.posts.length} {lang === 'en' ? 'Lessons' : 'دروس'}
                      </span>
                      <span className="w-1 h-1 bg-white/10 rounded-full" />
                      <span className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-app-accent" /> 4.9
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-app-text mb-3 group-hover:text-app-accent transition-colors line-clamp-2 leading-tight">
                      {course.title}
                    </h3>
                    <p className="text-app-muted text-sm line-clamp-2 mb-6 flex-1">{course.previewPost.content}</p>
                    <div className={cn('flex items-center justify-between pt-6 border-t border-white/5', lang === 'ar' && 'flex-row-reverse')}>
                      <Link
                        to={buildPostPath(course.startPost)}
                        className="text-app-accent text-xs font-bold hover:underline flex items-center gap-2"
                      >
                        {lang === 'en' ? 'Open Course' : 'فتح الدورة'}
                      </Link>
                      <div className="flex items-center gap-3">
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={() => setEditingPost(course.startPost)}
                            className="p-2 text-app-muted hover:text-app-accent transition-colors"
                            title={lang === 'en' ? 'Edit' : 'تعديل'}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        {canManagePost(course.startPost) && (
                          <button
                            onClick={() => void handleDeleteBook(course.startPost.id)}
                            disabled={deletingId === course.startPost.id}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                            title={lang === 'en' ? 'Delete' : 'حذف'}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-app-muted hover:text-app-accent transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-app-muted hover:text-app-accent transition-colors">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 glass rounded-[3rem] border border-white/5">
              <Book className="w-16 h-16 text-app-muted mx-auto mb-6 opacity-20" />
              <p className="text-app-muted text-lg">{lang === 'en' ? 'No books found in the library.' : 'لا توجد كتب في المكتبة حالياً.'}</p>
            </div>
          )}
        </div>

        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          lang={lang}
          initialType="pdf"
          initialCategorySlug="library"
          categoryFilter="non-sidebar"
          modalTitle={lang === 'en' ? 'Create Library Entry' : 'إنشاء مادة مكتبة'}
          modalSubtitle={lang === 'en' ? 'Upload PDF/books for the Library page only, separate from sidebar icons.' : 'ارفع ملفات PDF/كتب لصفحة المكتبة فقط بشكل منفصل عن أيقونات الشريط الجانبي.'}
          onSuccess={() => {
            setIsCreateOpen(false);
            window.dispatchEvent(new Event('posts-updated'));
            void fetchBooks();
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
            void fetchBooks();
          }}
        />
      </div>
    </>
  );
};
