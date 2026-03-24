import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Browser } from '@capacitor/browser';
import { ExternalLink, Eye, Heart, Loader2, MessageCircle, Pencil, Send, Trash2, X, ChevronLeft, Plus } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import { supabase } from '../supabaseClient.js';
import { Comment, Post } from '../types';
import { isNativeApp } from '../lib/runtime';
import { getEmbeddableVideoUrl, getPostPreviewImage } from '../lib/media';

const copy = {
  en: {
    comments: 'Comments',
    writeComment: 'Write a comment...',
    postComment: 'Post Comment',
    openExternal: 'Open in new tab',
    noComments: 'No comments yet.',
    signIn: 'Sign in to like or comment.',
    close: 'Tap outside or swipe down to close'
  },
  ar: {
    comments: 'التعليقات',
    writeComment: 'اكتب تعليقًا...',
    postComment: 'إرسال التعليق',
    openExternal: 'افتح في تبويب جديد',
    noComments: 'لا توجد تعليقات بعد.',
    signIn: 'سجل الدخول للإعجاب أو التعليق.',
    close: 'المس الخارج للإغلاق'
  },
};

export const PostViewerModal = ({
  isOpen,
  post,
  coursePosts,
  lang,
  onClose,
  onUpdated,
  onAuthClick,
  onRequestEdit,
  onRequestAddChild,
}: {
  isOpen: boolean;
  post: Post | null;
  coursePosts?: Post[] | null;
  lang: 'en' | 'ar';
  onClose: () => void;
  onUpdated?: () => void;
  onAuthClick?: () => void;
  onRequestEdit?: (post: Post) => void;
  onRequestAddChild?: (post: Post) => void;
}) => {
  const { profile } = useAuth();
  const t = copy[lang];
  const nativeApp = isNativeApp();
  const [selectedPost, setSelectedPost] = useState<Post | null>(post);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [seriesLessons, setSeriesLessons] = useState<Post[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const viewedPostIds = useRef<Set<string>>(new Set());

  const currentPost = selectedPost || post;

  const embeddedVideoUrl = useMemo(
    () => (currentPost?.media_url ? getEmbeddableVideoUrl(currentPost.media_url) : ''),
    [currentPost?.media_url]
  );
  const previewImage = useMemo(() => getPostPreviewImage(currentPost || {}), [currentPost]);

  const loadComments = async () => {
    if (!currentPost?.id) return;
    setLoadingComments(true);
    try {
      const data = await postService.getCommentsByPost(currentPost.id);
      setComments(data);
    } finally { setLoadingComments(false); }
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => { setSelectedPost(post); }, [post?.id]);

  useEffect(() => {
    if (!isOpen || !currentPost?.id) return;
    void loadComments();
    const channel = supabase.channel(`post-viewer-${currentPost.id}`).on('postgres_changes' as any, { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${currentPost.id}` }, () => { void loadComments(); onUpdated?.(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isOpen, currentPost?.id]);

  useEffect(() => { setLikesCount(currentPost?.likes_count || 0); setViewsCount(currentPost?.views_count || 0); }, [currentPost?.id, currentPost?.likes_count, currentPost?.views_count]);

  const handleLike = async () => {
    if (!currentPost?.id) return;
    if (!profile) return onAuthClick?.();
    setLiking(true);
    try {
      const res = await postService.likePost(currentPost.id, profile.id);
      if (res) setLikesCount(res.likes_count);
      onUpdated?.();
    } finally { setLiking(false); }
  };

  const handleDelete = async () => {
    if (!currentPost?.id || !profile || deleting) return;
    const confirmed = window.confirm(lang === 'en' ? 'Are you sure you want to delete this post?' : 'هل أنت متأكد من حذف هذا المنشور؟');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await postService.deletePost(currentPost.id);
      onClose();
      onUpdated?.();
      window.dispatchEvent(new Event('posts-updated'));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert(lang === 'en' ? 'Failed to delete post.' : 'فشل حذف المنشور.');
    } finally {
      setDeleting(false);
    }
  };

  const handleComment = async () => {
    if (!currentPost?.id || !profile || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await postService.addComment({ post_id: currentPost.id, user_id: profile.id, content: commentText.trim() });
      setCommentText('');
      await loadComments();
      onUpdated?.();
    } finally { setSubmitting(false); }
  };

  const canManage = profile && (profile.role === 'admin' || profile.id === currentPost?.author_id);

  if (!isOpen || !currentPost) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl md:p-10"
        onClick={onClose} // TOUCH OUTSIDE TO CLOSE
      >
        <motion.div
          onClick={(e) => e.stopPropagation()} // PREVENT CARD FROM CLOSING WHEN CLICKED
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className={cn(
            "relative flex flex-col w-full max-w-5xl max-h-[90vh] overflow-hidden bg-app-card border border-white/10 shadow-2xl",
            nativeApp ? "rounded-[2.5rem]" : "rounded-[3rem]"
          )}
        >
          {/* MOBILE DRAG HANDLE INDICATOR */}
          <div className="flex justify-center pt-4 pb-2 md:hidden">
            <div className="w-12 h-1.5 rounded-full bg-white/10" />
          </div>

          <div className="overflow-y-auto flex-1 p-5 md:p-8">
            <div className={cn("mb-6 flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
              <button onClick={onClose} className="p-3 rounded-full bg-white/5 text-app-muted hover:text-app-text transition-all active:scale-90">
                <X className="h-6 w-6" />
              </button>
              <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">{t.close}</p>
            </div>

            <div className={cn("mb-6 p-5 md:p-6 rounded-[1.5rem] border border-app-accent/20 bg-app-accent/5", lang === 'ar' && "text-right")}>
              <span className="inline-block px-3 py-1 rounded-lg bg-app-accent text-app-bg text-[9px] font-black uppercase tracking-widest mb-3">
                {currentPost.category?.name || 'Post'}
              </span>
              <h2 className={cn("font-bold text-app-text leading-tight", nativeApp ? "text-xl" : "text-2xl md:text-4xl")}>{currentPost.title}</h2>
              <p className="mt-3 text-app-muted text-sm font-bold tracking-wide flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-app-accent" /> {currentPost.author_name || 'Admin'}
              </p>
            </div>

            {(coursePosts && coursePosts.length > 1) || canManage ? (
              <div className="mb-6">
                <div className={cn("flex items-center justify-between mb-3", lang === 'ar' && "flex-row-reverse")}>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-app-muted">{lang === 'en' ? 'Course Lessons' : 'دروس الدورة'}</h3>
                  {canManage && onRequestAddChild && (
                    <button onClick={() => onRequestAddChild(coursePosts?.[0] || currentPost)} className="text-app-accent hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                      <Plus className="h-3 w-3" /> {lang === 'en' ? 'Add Part' : 'إضافة جزء'}
                    </button>
                  )}
                </div>
                <div className={cn("flex gap-3 overflow-x-auto pb-4 hide-scrollbar", lang === 'ar' && "flex-row-reverse")}>
                  {coursePosts?.map((cp, idx) => (
                    <button
                      key={cp.id}
                      onClick={() => setSelectedPost(cp)}
                      className={cn(
                        "flex-shrink-0 flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-xs font-bold min-w-[120px]",
                        currentPost.id === cp.id
                          ? "border-app-accent bg-app-accent/10 text-app-accent"
                          : "border-white/10 bg-white/5 text-app-muted hover:bg-white/10 hover:text-app-text"
                      )}
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-app-bg text-[9px]">{idx + 1}</span>
                      <span className="truncate max-w-[130px]">{cp.title}</span>
                    </button>
                  ))}
                  {canManage && (!coursePosts || coursePosts.length <= 1) && (
                    <button onClick={() => onRequestAddChild?.(currentPost)} className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-app-muted hover:text-app-text hover:border-white/40 text-xs font-bold transition-all">
                      <Plus className="h-4 w-4" /> {lang === 'en' ? 'Create First Lesson' : 'إنشاء أول درس'}
                    </button>
                  )}
                </div>
              </div>
            ) : null}


            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-8 space-y-6">
                {currentPost.post_type === 'video' && currentPost.media_url && (
                  <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black md:rounded-[2rem]">
                    <div className="aspect-video">
                      <iframe
                        src={embeddedVideoUrl}
                        title={currentPost.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  </div>
                )}
                {previewImage && currentPost.post_type !== 'video' && (
                  <img src={previewImage} className="w-full rounded-[1.5rem] border border-white/5 shadow-xl md:rounded-[2rem]" referrerPolicy="no-referrer" />
                )}
                <div className="p-6 md:p-8 rounded-[1.5rem] bg-white/[0.02] border border-white/5 leading-relaxed text-[0.95rem] md:text-[1.05rem] text-app-text whitespace-pre-wrap">
                  {currentPost.content}
                </div>
                {currentPost.media_url && (
                  <a
                    href={currentPost.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-app-accent hover:underline"
                  >
                    {t.openExternal}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div className="lg:col-span-4 space-y-6">
                <div className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/5 flex items-center justify-around">
                  <button onClick={handleLike} className={cn("flex flex-col items-center gap-2 transition-all active:scale-75", liking ? "text-app-accent" : "text-app-muted")}>
                    <Heart className={cn("h-8 w-8", liking && "fill-app-accent")} />
                    <span className="text-xs font-black">{likesCount}</span>
                  </button>
                  <div className="flex flex-col items-center gap-2 text-app-muted">
                    <MessageCircle className="h-8 w-8" />
                    <span className="text-xs font-black">{comments.length}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 text-app-muted">
                    <Eye className="h-8 w-8" />
                    <span className="text-xs font-black">{viewsCount}</span>
                  </div>
                  {canManage && (
                    <div className="flex flex-col items-center gap-4 border-l border-white/10 pl-6 ml-2">
                      <button onClick={() => onRequestEdit?.(currentPost)} className="p-3 rounded-2xl bg-white/5 text-app-accent hover:bg-white/10 transition-all active:scale-90">
                        <Pencil className="h-6 w-6" />
                      </button>
                      <button onClick={handleDelete} disabled={deleting} className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all active:scale-90 disabled:opacity-50">
                        {deleting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Trash2 className="h-6 w-6" />}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-black uppercase tracking-widest text-app-text mb-4">{t.comments}</h3>
                  <div className="space-y-4 mb-6">
                    {comments.map(c => (
                      <div key={c.id} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-xs font-bold text-app-accent mb-1">{c.user?.name}</p>
                        <p className="text-sm text-app-muted">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder={t.writeComment} className="w-full rounded-xl bg-app-bg p-4 pr-12 text-sm border border-white/5 outline-none focus:border-app-accent/50" />
                    <button onClick={handleComment} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-app-accent rounded-lg flex items-center justify-center text-app-bg"><Send className="h-4 w-4" /></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
