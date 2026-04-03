import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { ArrowLeft, ExternalLink, Eye, Heart, Loader2, MessageCircle, Pencil, Send, Trash2, Calendar, User, Share2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { isNativeApp } from '../lib/runtime';
import { postService } from '../services/postService';
import { Comment, Post } from '../types';
import { useAuth } from '../context/AuthContext';
import { buildPostPath, getPostSection, PublicPostSection } from '../lib/postRoutes';
import { CreatePostModal } from '../components/CreatePostModal';
import { siteLinks } from '../config/siteLinks';
import { getEmbeddableVideoUrl, getPostPreviewImage } from '../lib/media';
import { isLikelyRichTextHtml, sanitizePostHtml } from '../lib/postContent';

const VIEWER_SESSION_KEY = 'viewer_session_id';

const getViewerSessionId = () => {
  if (typeof window === 'undefined') return null;
  const existing = window.localStorage.getItem(VIEWER_SESSION_KEY);
  if (existing) return existing;
  const generated = `sess_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  window.localStorage.setItem(VIEWER_SESSION_KEY, generated);
  return generated;
};

const openExternalUrl = async (url: string) => {
  if (isNativeApp()) {
    await Browser.open({ url });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
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
      articles: 'Articles',
      academy: 'Academy',
      library: 'Library',
      community: 'Community',
    } as Record<PublicPostSection, string>,
    readingTime: 'Reading Time',
  },
  ar: {
    notFound: 'المنشور غير موجود.',
    loading: 'جار تحميل المنشور...',
    comments: 'التعليقات',
    writeComment: 'اكتب تعليقاً...',
    postComment: 'إرسال التعليق',
    openExternal: 'افتح في تبويب جديد',
    noComments: 'لا توجد تعليقات بعد.',
    signIn: 'سجّل الدخول للإعجاب أو التعليق.',
    back: {
      articles: 'المقالات',
      academy: 'الأكاديمية',
      library: 'المكتبة',
      community: 'المجتمع',
    } as Record<PublicPostSection, string>,
    readingTime: 'وقت القراءة',
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const viewedPostIds = useRef<Set<string>>(new Set());

  const normalizedSection = (section as PublicPostSection) || 'articles';
  const backPath = `/${normalizedSection}`;
  const nativeApp = isNativeApp();
  const embeddedVideoUrl = useMemo(() => (post?.media_url ? getEmbeddableVideoUrl(post.media_url) : ''), [post?.media_url]);
  const previewImage = useMemo(() => getPostPreviewImage(post || {}), [post]);
  const sanitizedContentHtml = useMemo(() => sanitizePostHtml(post?.content), [post?.content]);

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
          document.title = `${found.title} | ${siteLinks.brand.en}`;

          const metaDesc = found.excerpt || found.content?.slice(0, 160) || '';
          let metaNode = document.head.querySelector('meta[name="description"]');
          if (metaNode) {
            metaNode.setAttribute('content', metaDesc);
          } else {
            metaNode = document.createElement('meta');
            metaNode.setAttribute('name', 'description');
            metaNode.setAttribute('content', metaDesc);
            document.head.appendChild(metaNode);
          }
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

  const handleDeleteComment = async (commentId: string) => {
    if (!profile) return;
    const confirmed = window.confirm(lang === 'ar' ? 'هل تريد حذف التعليق؟' : 'Delete this comment?');
    if (!confirmed) return;

    try {
      await postService.deleteComment(commentId, profile.id, profile.role === 'admin');
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert(lang === 'ar' ? 'تعذر الحذف' : 'Failed to delete comment');
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!profile || !editingCommentText.trim()) return;

    try {
      await postService.updateComment(commentId, profile.id, editingCommentText.trim());
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editingCommentText.trim() } : c));
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch (err) {
      console.error('Error updating comment:', err);
      alert(lang === 'ar' ? 'تعذر التعديل' : 'Failed to update comment');
    }
  };

  const handleShare = async () => {
    if (!post) return;
    const url = window.location.href;
    if (nativeApp && (navigator as any).share) {
      await (navigator as any).share({ title: post.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert(lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard');
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
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="flex items-center gap-3 text-app-muted">
          <Loader2 className="h-6 w-6 animate-spin text-app-accent" />
          <span className="text-sm font-bold uppercase tracking-widest">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-app-bg pt-32 px-6 text-center">
        <p className="text-app-muted text-xl">{t.notFound}</p>
        <Link to="/" className="mt-8 inline-block text-app-accent font-bold hover:underline">Back to Safety</Link>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-app-bg text-app-text relative', nativeApp ? 'pb-28 pt-10' : 'pb-24 pt-10')}>
      {/* Floating Back Button (Sticky) */}
      <button
        onClick={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate(backPath);
          }
        }}
        className={cn(
          'fixed z-[100] flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-app-card/40 text-app-text backdrop-blur-xl transition-all hover:bg-app-accent/20 active:scale-95 shadow-2xl',
          'top-[100px]',
          lang === 'ar' ? 'right-6' : 'left-6'
        )}
        title={t.back[normalizedSection]}
      >
        <ArrowLeft className={cn('h-5 w-5', lang === 'ar' && 'rotate-180')} />
      </button>

      {/* 1. Header & Navigation (Full Width) */}
      <div className="border-b border-white/5 bg-app-card/30 backdrop-blur-xl mb-12">
        <div className="container mx-auto px-6 py-6 md:py-10">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(backPath);
              }
            }}
            className={cn('mb-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-app-accent hover:opacity-70 transition-colors', lang === 'ar' && 'flex-row-reverse')}
          >
            <ArrowLeft className={cn('h-3.5 w-3.5', lang === 'ar' && 'rotate-180')} />
            {t.back[normalizedSection]}
          </button>

          <div className={cn('max-w-4xl', lang === 'ar' && 'text-right')}>
            <span className="mb-4 inline-block px-3 py-1 rounded-full bg-app-accent/10 border border-app-accent/20 text-[10px] font-black uppercase tracking-widest text-app-accent">
              {post.category?.name || post.post_type}
            </span>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight mb-8">
              {post.title}
            </h1>

            <div className={cn('flex flex-wrap items-center gap-6 text-sm text-app-muted', lang === 'ar' && 'flex-row-reverse')}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-app-accent/10 flex items-center justify-center border border-white/5">
                  <User className="h-4 w-4 text-app-accent" />
                </div>
                <span className="font-bold text-app-text/80">{post.author_name || 'Admin'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.created_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{viewsCount} Views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Content Wrapper */}
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">

          {/* Main Article Column */}
          <article className="lg:col-span-8">
            {/* Featured Media */}
            <div className="mb-12 overflow-hidden rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
              {post.post_type === 'video' && post.media_url ? (
                <div className="aspect-video">
                  <iframe src={embeddedVideoUrl} title={post.title} className="h-full w-full" allowFullScreen />
                </div>
              ) : post.post_type === 'pdf' && post.media_url ? (
                <div className="p-8 text-center space-y-4">
                  <p className="text-app-muted text-sm">{lang === 'en' ? 'Review documentation below or open directly.' : 'راجع الوثائق أدناه أو افتح مباشرة.'}</p>
                  <button onClick={() => void openExternalUrl(post.media_url!)} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-app-accent text-app-bg font-black uppercase text-xs tracking-widest">
                    <ExternalLink className="h-4 w-4" /> {t.openExternal}
                  </button>
                </div>
              ) : post.post_type === 'audio' && post.media_url ? (
                <div className="p-8 bg-app-accent/5 backdrop-blur-md">
                  <audio src={post.media_url} controls className="w-full" />
                </div>
              ) : previewImage && (
                <img src={previewImage} alt={post.title} className="w-full object-cover max-h-[500px]" referrerPolicy="no-referrer" />
              )}
            </div>

            {/* Article Content */}
            {isLikelyRichTextHtml(post.content) ? (
              <div
                className={cn('post-content prose prose-invert prose-lg max-w-none text-app-text leading-relaxed mb-16', lang === 'ar' && 'text-right')}
                dangerouslySetInnerHTML={{ __html: sanitizedContentHtml }}
              />
            ) : (
              <div className={cn('post-content prose prose-invert prose-lg max-w-none text-app-text leading-relaxed whitespace-pre-wrap mb-16', lang === 'ar' && 'text-right')}>
                {post.content}
              </div>
            )}

            {post.source_reference && (
              <div className={cn('mb-16 rounded-[2rem] border border-white/5 bg-white/[0.03] p-6', lang === 'ar' && 'text-right')}>
                <p className="text-[10px] font-black uppercase tracking-widest text-app-muted">
                  {lang === 'ar' ? 'المصدر' : 'Source'}
                </p>
                <p className="mt-3 text-sm text-app-text/90">
                  {post.source_type ? `${post.source_type.toUpperCase()} - ` : ''}
                  {post.source_reference}
                </p>
              </div>
            )}

            {/* Post Interaction (Likes/Share) */}
            <div className={cn("flex items-center gap-6 py-8 border-t border-white/5", lang === 'ar' && "flex-row-reverse")}>
              <button
                onClick={handleLike}
                disabled={liking || !profile}
                className={cn("flex h-14 items-center gap-3 rounded-2xl border border-white/10 px-6 font-bold transition-all hover:bg-app-accent/10", liking ? "text-app-accent" : "text-app-text")}
              >
                {liking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Heart className={cn("h-5 w-5", likesCount > 0 && "fill-app-accent text-app-accent")} />}
                <span>{likesCount} Likes</span>
              </button>
              <button
                onClick={handleShare}
                className="flex h-14 items-center gap-3 rounded-2xl border border-white/10 px-6 font-bold text-app-text transition-all hover:bg-white/5"
              >
                <Share2 className="h-5 w-5" />
                <span>Share</span>
              </button>
              {canManagePost && (
                <div className="flex gap-2">
                  <button onClick={() => setEditingPost(post)} className="h-14 w-14 flex items-center justify-center rounded-2xl border border-white/10 text-app-accent hover:bg-app-accent/10 transition-all"><Pencil className="h-5 w-5" /></button>
                  <button onClick={handleDelete} className="h-14 w-14 flex items-center justify-center rounded-2xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"><Trash2 className="h-5 w-5" /></button>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <section className={cn("mt-16 pt-12 border-t border-white/5", lang === 'ar' && "text-right")}>
              <h2 className="text-2xl font-serif font-bold mb-8">{t.comments} ({comments.length})</h2>

              <div className="space-y-6 mb-10">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 relative group">
                    <div className={cn("flex items-center justify-between mb-3", lang === 'ar' && "flex-row-reverse")}>
                      <span className="font-bold text-app-accent">{comment.user?.name || comment.user?.display_name || 'User'}</span>
                      <div className={cn("flex items-center gap-3", lang === 'ar' && "flex-row-reverse")}>
                        {(profile?.id === comment.user_id || profile?.role === 'admin') && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.content);
                              }}
                              className="p-1.5 text-app-muted hover:text-app-accent transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => void handleDeleteComment(comment.id)}
                              className="p-1.5 text-app-muted hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                        <span className="text-[10px] uppercase font-black tracking-widest text-app-muted">{new Date(comment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {editingCommentId === comment.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          className="w-full bg-app-bg/50 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-app-accent/50"
                          rows={3}
                        />
                        <div className={cn("flex gap-2", lang === 'ar' && "flex-row-reverse")}>
                          <button onClick={() => void handleUpdateComment(comment.id)} className="bg-app-accent text-app-bg px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Save</button>
                          <button onClick={() => setEditingCommentId(null)} className="bg-white/5 text-app-text px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-app-text/90 leading-relaxed text-sm">{comment.content}</p>
                    )}
                  </div>
                ))}
                {!comments.length && <p className="text-app-muted">{t.noComments}</p>}
              </div>

              {profile ? (
                <div className="space-y-4">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={4}
                    placeholder={t.writeComment}
                    className="w-full resize-none rounded-[2rem] border border-white/10 bg-app-card/50 p-6 text-app-text focus:border-app-accent/50 focus:outline-none"
                  />
                  <button
                    onClick={handleComment}
                    disabled={submitting || !commentText.trim()}
                    className="inline-flex items-center gap-3 rounded-2xl bg-app-accent px-8 py-4 font-black uppercase text-xs tracking-[0.2em] text-app-bg transition-all hover:brightness-110 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t.postComment}
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-app-accent/5 border border-app-accent/20 text-center">
                  <p className="text-sm font-bold text-app-text">{t.signIn}</p>
                </div>
              )}
            </section>
          </article>

          {/* Sidebar (Full-Page Style) */}
          <aside className="lg:col-span-4 hidden lg:block">
            <div className="sticky top-32 space-y-8">
              <div className="p-8 rounded-[2.5rem] border border-white/5 bg-app-card/30">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-app-accent mb-6">About the Section</h4>
                <p className="text-sm text-app-muted leading-relaxed">
                  You are reading content in the <strong>{post.category?.name || 'Islamic Light Community'}</strong> module. Our platform ensures that all knowledge shared here is authentic and verified.
                </p>
              </div>

              {/* Vertical Ads Slot or Quick Actions */}
              <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/5">
                <div className="flex flex-col gap-4">
                  {canManagePost && (
                    <button onClick={() => setEditingPost(post)} className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white/10 text-sm font-bold hover:bg-white/20 transition-all">
                      <Pencil className="h-4 w-4" /> Manage this Post
                    </button>
                  )}
                  <a
                    href={`mailto:${siteLinks.supportEmail}`}
                    className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white/10 text-sm font-bold hover:bg-white/20 transition-all"
                    onClick={(e) => {
                      if (isNativeApp()) {
                        e.preventDefault();
                        window.location.href = `mailto:${siteLinks.supportEmail}`;
                      }
                    }}
                  >
                    <MessageCircle className="h-4 w-4" /> Report Issue
                  </a>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {editingPost && (
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
      )}
    </div>
  );
};
