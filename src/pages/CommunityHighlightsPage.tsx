import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Users, Search, MessageCircle, Heart, Share2, Plus, Clock, ArrowRight, BookOpen, ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { CreatePostModal } from '../components/CreatePostModal';
import { PostViewerModal } from '../components/PostViewerModal';
import { isNativeApp } from '../lib/runtime';

interface CommunityGroup {
  key: string;
  title: string;
  posts: Post[];
  startPost: Post;
  category: string;
}

export const CommunityHighlightsPage = ({ lang, initialCategory }: { lang: 'en' | 'ar'; initialCategory?: string }) => {
  const { profile } = useAuth();
  const nativeApp = isNativeApp();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const SIDEBAR_CATEGORY_SLUGS = ['inspiration', 'hadith', 'dua'];

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await postService.getPosts({ is_approved: true });
      let filteredPosts = data;
      if (initialCategory) {
        filteredPosts = data.filter(p => p.category?.slug === initialCategory);
      } else {
        filteredPosts = data.filter(p => !SIDEBAR_CATEGORY_SLUGS.includes(p.category?.slug || ''));
      }
      setPosts(filteredPosts);
    } finally {
      setLoading(false);
    }
  };

  const canManagePost = (post: Post) => Boolean(profile && (profile.role === 'admin' || profile.id === post.author_id));

  const handleDeletePost = async (postId: string) => {
    if (!profile || deletingId) return;
    const confirmed = window.confirm(lang === 'en' ? 'Delete this post?' : 'هل تريد حذف هذا المنشور؟');
    if (!confirmed) return;

    try {
      setDeletingId(postId);
      await postService.deletePost(postId);
      await fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(lang === 'en' ? 'Failed to delete.' : 'فشل الحذف.');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => { void fetchPosts(); }, [initialCategory]);

  useEffect(() => {
    const handlePostsUpdated = () => {
      void fetchPosts();
    };
    window.addEventListener('posts-updated', handlePostsUpdated);
    return () => window.removeEventListener('posts-updated', handlePostsUpdated);
  }, []);

  const grouped = useMemo<CommunityGroup[]>(() => {
    const map = new Map<string, Post[]>();
    posts.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase())).forEach(p => {
      const key = p.series_slug || p.id;
      const list = map.get(key) || [];
      list.push(p);
      map.set(key, list);
    });
    return Array.from(map.entries()).map(([key, list]) => ({
      key,
      title: list[0].series_title || list[0].title,
      posts: list,
      startPost: list[0],
      category: lang === 'ar' ? (list[0].category?.name_ar || 'المجتمع') : (list[0].category?.name || 'Community')
    }));
  }, [posts, searchQuery, lang]);

  return (
    <div className={cn('min-h-screen bg-app-bg pt-20 md:pt-32', nativeApp ? 'pb-28 md:pb-20' : 'pb-24 md:pb-20')}>
      <div className="container mx-auto px-4 sm:px-6">
        <div className={cn('flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8 md:mb-16', lang === 'ar' && 'md:flex-row-reverse text-right')}>
          <div className="max-w-3xl">
            <Link to="/" className={cn('mb-4 inline-flex items-center gap-2 text-app-accent hover:underline group md:mb-6', lang === 'ar' && 'flex-row-reverse')}>
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
            </Link>
            <h1 className={cn('font-serif text-app-text', nativeApp ? 'mb-2.5 text-4xl md:mb-5 md:text-5xl' : 'mb-3 text-5xl md:mb-6 md:text-6xl')}>
              {initialCategory === 'academy' ? (lang === 'en' ? 'Academy' : 'الأكاديمية') : (lang === 'en' ? 'Community Hub' : 'ركن المجتمع')}
            </h1>
            <p className={cn('text-app-muted text-lg leading-relaxed')}>
              {initialCategory === 'academy'
                ? (lang === 'en' ? 'Structured lessons to deepen your understanding.' : 'دروس منظمة لتعميق فهمك.')
                : (lang === 'en' ? 'Share insights and learn with the community.' : 'شارك أفكارك وتعلم مع المجتمع.')
              }
            </p>
            {profile && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className={cn(
                  'mt-4 inline-flex items-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/10 font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/20 px-5 py-3 text-xs'
                )}
              >
                <Plus className="h-4 w-4" />
                {lang === 'en' ? (initialCategory === 'academy' ? 'Add Lesson' : 'Submit Post') : (initialCategory === 'academy' ? 'إضافة درس' : 'إرسال منشور')}
              </button>
            )}
          </div>

          <div className={cn('relative w-full md:w-96')}>
            <Search className={cn('absolute top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted', lang === 'ar' ? 'right-6' : 'left-6')} />
            <input
              type="text"
              placeholder={lang === 'en' ? 'Search...' : 'بحث...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full rounded-3xl border border-white/10 bg-app-card py-4 text-sm text-app-text shadow-2xl transition-all focus:border-app-accent/50 focus:outline-none',
                lang === 'ar' ? 'pr-16 pl-6' : 'pl-16 pr-6'
              )}
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => <div key={i} className="h-96 animate-pulse rounded-[3rem] bg-app-card" />)}
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-[3rem] border border-dashed border-white/10 bg-app-card p-12 text-center text-app-muted">
            {lang === 'en' ? 'No items found yet.' : 'لا توجد عناصر بعد.'}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {grouped.map((group, i) => (
              <motion.div key={group.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="group rounded-[2.5rem] border border-white/5 bg-app-card shadow-2xl transition-all hover:border-app-accent/30 overflow-hidden">
                {group.startPost.image_url && (
                  <div className="relative h-48 w-full overflow-hidden bg-app-card-dark">
                    <img src={group.startPost.image_url} alt={group.startPost.title} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="p-8">
                  <div className={cn("flex items-center justify-between mb-6", lang === 'ar' && "flex-row-reverse")}>
                    <div className="px-4 py-1.5 rounded-full bg-app-accent/10 border border-app-accent/20 text-app-accent text-[10px] font-black uppercase tracking-widest">{group.category}</div>
                    <div className="flex items-center gap-2 text-xs text-app-muted font-bold"><Clock className="h-4 w-4" /> {new Date(group.startPost.created_at).toLocaleDateString()}</div>
                  </div>
                  <h3 className="text-2xl font-bold text-app-text mb-4 leading-tight group-hover:text-app-accent transition-colors line-clamp-2">{group.title}</h3>
                  <p className="text-app-muted text-sm leading-relaxed mb-8 line-clamp-3">{group.startPost.content}</p>
                  <div className={cn("flex items-center justify-between border-t border-white/5 pt-6", lang === 'ar' && "flex-row-reverse")}>
                    <button onClick={() => setActivePost(group.startPost)} className="flex items-center gap-2 text-app-accent font-black text-xs uppercase tracking-widest hover:underline">
                      {lang === 'en' ? 'Read More' : 'اقرأ المزيد'} <ArrowRight className={cn("h-4 w-4", lang === 'ar' && "rotate-180")} />
                    </button>
                    <div className="flex gap-2">
                      {canManagePost(group.startPost) && (
                        <button onClick={() => setEditingPost(group.startPost)} className="p-2 rounded-lg bg-white/5 text-app-muted hover:text-app-accent hover:bg-white/10 transition-all"><Pencil className="h-4 w-4" /></button>
                      )}
                      {canManagePost(group.startPost) && (
                        <button onClick={() => handleDeletePost(group.startPost.id)} disabled={deletingId === group.startPost.id} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                      )}
                      <div className="flex items-center gap-1 text-app-muted ml-2">
                        <Heart className="h-4 w-4" />
                        <span className="text-[10px] font-bold">{group.startPost.likes_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <PostViewerModal
        isOpen={!!activePost}
        post={activePost}
        lang={lang}
        onClose={() => setActivePost(null)}
        onUpdated={fetchPosts}
        onRequestEdit={(p) => {
          setActivePost(null);
          setEditingPost(p);
        }}
      />

      {isCreateOpen && (
        <CreatePostModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          lang={lang}
          initialCategorySlug={initialCategory}
          categoryFilter={initialCategory ? 'non-sidebar' : 'all'}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchPosts();
          }}
        />
      )}

      {editingPost && (
        <CreatePostModal
          isOpen={!!editingPost}
          onClose={() => setEditingPost(null)}
          lang={lang}
          postToEdit={editingPost}
          categoryFilter="all"
          onSuccess={() => {
            setEditingPost(null);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
};
