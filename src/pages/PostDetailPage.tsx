import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Eye, Heart, Loader2, MessageCircle, Pencil, Send, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { postService } from '../services/postService';
import { Comment, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { buildPostPath, getPostSection, PublicPostSection } from '../lib/postRoutes';
import { CreatePostModal } from '../components/CreatePostModal';

const getEmbeddableVideoUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  }
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
  }
  return url;
};

const VIEWER_SESSION_KEY = 'viewer_session_id';

const getViewerSessionId = () => {
  if (typeof window === 'undefined') return null;
  const existing = window.localStorage.getItem(VIEWER_SESSION_KEY);
  if (existing) return existing;
  const generated = `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  window.localStorage.setItem(VIEWER_SESSION_KEY, generated);
  return generated;
};

const copy = {
  en: {
    notFound: 'Post not found.',
    loading: 'Loading post...',
    comments: 'Comments',
    writeComment: 'Write a comment...',
    postComment: 'Post Comment',
    openExternal: 'Open in new tab',
    noComments: 'No comments yet.',
    signIn: 'Sign in to like or comment.',
    back: {
      articles: 'Back to Articles',
      academy: 'Back to Academy',
      library: 'Back to Library',
      community: 'Back to Community',
    } as Record<PublicPostSection, string>,
  },
  ar: {
    notFound: 'المنشور غير موجود.',
    loading: 'جار تحميل المنشور...',
    comments: 'التعليقات',
    writeComment: 'اكتب تعليقاً...',
    postComment: 'إرسال التعليق',
    openExternal: 'افتح في تبويب جديد',
    noComments: 'لا توجد تعليقات بعد.',
    signIn: 'سجل الدخول للإعجاب أو التعليق.',
    back: {
      articles: 'العودة إلى المقالات',
      academy: 'العودة إلى الأكاديمية',
      library: 'العودة إلى المكتبة',
      community: 'العودة إلى المجتمع',
    } as Record<PublicPostSection, string>,
  },
};

export const PostDetailPage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const { postId, section } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const t = copy[lang];
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const viewedPostIds = useRef<Set<string>>(new Set());

  const normalizedSection = (section as PublicPostSection) || 'articles';
  const backPath = `/${normalizedSection}`;
  const embeddedVideoUrl = useMemo(() => (post?.media_url ? getEmbeddableVideoUrl(post.media_url) : ''), [post?.media_url]);

  useEffect(() => {
    const load = async () => {
      if (!postId) return;
      setLoading(true);
      try {
        const found = await postService.getPostById(postId);
        setPost(found);
        if (found) {
          setLikesCount(found.likes_count || 0);
          setViewsCount(found.views_count || 0);
          const foundSection = getPostSection(found);
          if (section !== foundSection) {
            navigate(buildPostPath(found), { replace: true });
          }
          const loadedComments = await postService.getCommentsByPost(found.id);
          setComments(loadedComments);
          document.title = `${found.title} | Islamic Vision`;
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [navigate, postId, section]);

  useEffect(() => {
    if (!post?.id) return;
    if (viewedPostIds.current.has(post.id)) return;
    viewedPostIds.current.add(post.id);

    const viewer = profile?.id ? { userId: profile.id } : { sessionId: getViewerSessionId() };
    void postService.recordPostView(post.id, viewer).then((result) => {
      if (typeof result?.views_count === 'number') {
        setViewsCount(result.views_count);
      }
    });
  }, [post?.id, profile?.id]);

  const handleLike = async () => {
    if (!post?.id || !profile) return;
    setLiking(true);
    try {
      const result = await postService.likePost(post.id, profile.id);
      if (typeof result?.likes_count === 'number') {
        setLikesCount(result.likes_count);
      }
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!post?.id || !profile || !commentText.trim()) return;
    setSubmitting(true);
    try {
      await postService.addComment({
        post_id: post.id,
        user_id: profile.id,
        content: commentText.trim(),
      });
      setCommentText('');
      const loadedComments = await postService.getCommentsByPost(post.id);
      setComments(loadedComments);
    } finally {
      setSubmitting(false);
    }
  };

  const canManagePost = Boolean(profile && post && (profile.role === 'admin' || profile.id === post.author_id));

  const handleDelete = async () => {
    if (!post?.id || deleting) return;
    const confirmed = window.confirm(lang === 'en' ? 'Delete this post?' : 'هل تريد حذف هذا المنشور؟');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await postService.deletePost(post.id);
      navigate(backPath, { replace: true });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg pt-32 text-app-text">
        <div className="container mx-auto px-6 py-20">
          <div className="flex items-center gap-3 text-app-muted">
            <Loader2 className="h-5 w-5 animate-spin text-app-accent" />
            {t.loading}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-app-bg pt-32 text-app-text">
        <div className="container mx-auto px-6 py-20">
          <Link to={backPath} className="mb-6 inline-flex items-center gap-2 text-app-accent hover:underline">
            <ArrowLeft className="h-4 w-4" />
            {t.back[normalizedSection]}
          </Link>
          <p className="text-app-muted">{t.notFound}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className={cn('mb-10', lang === 'ar' && 'text-right')}>
          <Link to={backPath} className={cn('mb-6 inline-flex items-center gap-2 text-app-accent hover:underline', lang === 'ar' && 'flex-row-reverse')}>
            <ArrowLeft className="h-4 w-4" />
            {t.back[normalizedSection]}
          </Link>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-app-accent">{post.category?.name || post.post_type}</p>
          <h1 className="mb-4 text-4xl font-serif text-app-text md:text-5xl">{post.title}</h1>
          <p className="text-sm text-app-muted">{post.author_name || 'Admin'}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {post.post_type === 'video' && post.media_url && (
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black">
                <div className="aspect-video">
                  <iframe
                    src={embeddedVideoUrl}
                    title={post.title}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {post.post_type === 'pdf' && post.media_url && (
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white">
                <iframe src={post.media_url} title={post.title} className="h-[70vh] w-full" />
              </div>
            )}

            {post.post_type === 'audio' && post.media_url && (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <audio src={post.media_url} controls className="w-full" />
              </div>
            )}

            {post.image_url && post.post_type !== 'pdf' && (
              <img src={post.image_url} alt={post.title} className="max-h-[30rem] w-full rounded-[2rem] object-cover" referrerPolicy="no-referrer" />
            )}

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="prose prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed text-app-text">
                {post.content}
              </div>
            </div>

            {post.media_url && (
              <a href={post.media_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-app-accent hover:underline">
                {t.openExternal}
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => void handleLike()}
                  disabled={liking || !profile}
                  className="flex items-center gap-2 text-sm font-bold text-app-text transition-colors hover:text-app-accent disabled:opacity-50"
                >
                  {liking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
                  {likesCount}
                </button>
                <div className="flex items-center gap-2 text-sm font-bold text-app-text">
                  <MessageCircle className="h-4 w-4" />
                  {comments.length}
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-app-text">
                  <Eye className="h-4 w-4" />
                  {viewsCount}
                </div>
              </div>
              {canManagePost && (
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setEditingPost(post)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-app-text hover:bg-white/10"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {lang === 'en' ? 'Edit' : 'تعديل'}
                  </button>
                  <button
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    {lang === 'en' ? 'Delete' : 'حذف'}
                  </button>
                </div>
              )}
              {!profile && <p className="mt-4 text-xs text-app-muted">{t.signIn}</p>}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-bold text-app-text">{t.comments}</h2>
              <div className="mb-4 space-y-4">
                {comments.length ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="rounded-2xl border border-white/10 bg-app-card p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-app-text">{comment.user?.name || 'User'}</span>
                        <span className="text-xs text-app-muted">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-app-muted">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-app-muted">{t.noComments}</p>
                )}
              </div>

              <div className="space-y-3">
                <textarea
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  rows={4}
                  placeholder={t.writeComment}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-app-card px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none"
                />
                <button
                  onClick={() => void handleComment()}
                  disabled={submitting || !commentText.trim() || !profile}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-app-accent py-3 text-sm font-bold text-app-bg disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {t.postComment}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        lang={lang}
        postToEdit={editingPost}
        categoryFilter="non-sidebar"
        onSuccess={async () => {
          setEditingPost(null);
          if (!postId) return;
          const refreshed = await postService.getPostById(postId);
          setPost(refreshed);
          if (refreshed) {
            setLikesCount(refreshed.likes_count || 0);
            setViewsCount(refreshed.views_count || 0);
          }
        }}
      />
    </div>
  );
};
