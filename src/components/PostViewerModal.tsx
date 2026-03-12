import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ExternalLink, Eye, Heart, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import { supabase } from '../supabaseClient';
import { Comment, Post } from '../types';

const getEmbeddableVideoUrl = (url: string) => {
  if (url.includes('youtube.com/watch?v=')) {
    return url.replace('watch?v=', 'embed/');
  }
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

const isEmbeddableVideo = (url: string) =>
  url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');

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
    comments: 'Comments',
    writeComment: 'Write a comment...',
    postComment: 'Post Comment',
    openExternal: 'Open in new tab',
    noComments: 'No comments yet.',
    signIn: 'Sign in to like or comment.',
  },
  ar: {
    comments: 'التعليقات',
    writeComment: 'اكتب تعليقاً...',
    postComment: 'إرسال التعليق',
    openExternal: 'افتح في تبويب جديد',
    noComments: 'لا توجد تعليقات بعد.',
    signIn: 'سجل الدخول للإعجاب أو التعليق.',
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
}: {
  isOpen: boolean;
  post: Post | null;
  coursePosts?: Post[] | null;
  lang: 'en' | 'ar';
  onClose: () => void;
  onUpdated?: () => void;
  onAuthClick?: () => void;
}) => {
  const { profile } = useAuth();
  const t = copy[lang];
  const [selectedPost, setSelectedPost] = useState<Post | null>(post);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [liking, setLiking] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [viewsCount, setViewsCount] = useState(0);
  const [seriesLessons, setSeriesLessons] = useState<Post[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const viewedPostIds = useRef<Set<string>>(new Set());

  const currentPost = selectedPost || post;

  const embeddedVideoUrl = useMemo(
    () => (currentPost?.media_url ? getEmbeddableVideoUrl(currentPost.media_url) : ''),
    [currentPost?.media_url]
  );

  const loadComments = async () => {
    if (!currentPost?.id) return;
    setLoadingComments(true);
    try {
      const data = await postService.getCommentsByPost(currentPost.id);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    setSelectedPost(post);
  }, [post?.id]);

  useEffect(() => {
    if (!isOpen || !currentPost?.id) return;
    void loadComments();

    const channel = supabase
      .channel(`post-viewer-${currentPost.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${currentPost.id}` }, () => {
        void loadComments();
        onUpdated?.();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes', filter: `post_id=eq.${currentPost.id}` }, () => {
        onUpdated?.();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, onUpdated, currentPost?.id]);

  useEffect(() => {
    setLikesCount(currentPost?.likes_count || 0);
  }, [currentPost?.id, currentPost?.likes_count]);

  useEffect(() => {
    setViewsCount(currentPost?.views_count || 0);
  }, [currentPost?.id, currentPost?.views_count]);

  useEffect(() => {
    if (!isOpen || !currentPost?.id) return;
    if (viewedPostIds.current.has(currentPost.id)) return;

    viewedPostIds.current.add(currentPost.id);

    const viewer = profile?.id
      ? { userId: profile.id }
      : { sessionId: getViewerSessionId() };

    void postService
      .recordPostView(currentPost.id, viewer)
      .then((result) => {
        if (typeof result?.views_count === 'number') {
          setViewsCount(result.views_count);
          onUpdated?.();
        }
      })
      .catch((error) => {
        console.error('Failed to record post view:', error);
      });
  }, [isOpen, currentPost?.id, profile?.id, onUpdated]);

  useEffect(() => {
    const loadSeriesData = async () => {
      if (!isOpen || !currentPost?.id) {
        setSeriesLessons([]);
        setProgressMap({});
        return;
      }

      try {
        if (coursePosts?.length) {
          const fromCourseCard = [...coursePosts].sort((a, b) => {
            const orderA = a.lesson_order || 1;
            const orderB = b.lesson_order || 1;
            if (orderA !== orderB) return orderA - orderB;
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          });

          setSeriesLessons(fromCourseCard);
          if (profile) {
            const progress = await postService.getProgressForPosts(
              profile.id,
              fromCourseCard.map((lesson) => lesson.id)
            );
            setProgressMap(progress);
          }
          return;
        }

        const rootId = currentPost.parent_post_id || currentPost.id;
        let lessons = await postService.getCoursePosts(rootId);

        // Fallback to series-based grouping when explicit parent-child tree is missing or incomplete.
        if (lessons.length <= 1 && currentPost.series_slug) {
          lessons = await postService.getSeriesPosts(currentPost.series_slug);
        }

        // Final fallback: treat all approved posts in the same category as one course/folder.
        if (lessons.length <= 1) {
          if (currentPost.category?.slug) {
            lessons = await postService.getApprovedPostsByCategorySlug(currentPost.category.slug);
          } else if (currentPost.category_id) {
            lessons = await postService.getApprovedPostsByCategory(currentPost.category_id);
          }
        }

        // If still no grouped lessons, show current post only.
        if (!lessons.length) {
          lessons = [currentPost];
        }

        // Keep currently opened lesson visible even if it was excluded by a filter/query mismatch.
        if (!lessons.some((lesson) => lesson.id === currentPost.id)) {
          lessons = [currentPost, ...lessons];
        }

        const sortedLessons = [...lessons].sort((a, b) => {
          const orderA = a.lesson_order || 1;
          const orderB = b.lesson_order || 1;
          if (orderA !== orderB) return orderA - orderB;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        setSeriesLessons(sortedLessons);

        if (profile) {
          const progress = await postService.getProgressForPosts(
            profile.id,
            sortedLessons.map((lesson) => lesson.id)
          );
          setProgressMap(progress);
        }
      } catch (error) {
        console.error('Failed to load series lessons:', error);
      }
    };

    void loadSeriesData();
  }, [isOpen, currentPost?.series_slug, currentPost?.category_id, currentPost?.id, currentPost?.parent_post_id, profile?.id, coursePosts]);

  const saveProgress = async (seconds: number) => {
    if (!profile || !currentPost?.id) return;
    try {
      await postService.upsertPostProgress(profile.id, currentPost.id, seconds);
      setProgressMap((prev) => ({ ...prev, [currentPost.id]: Math.floor(seconds) }));
    } catch (error) {
      console.error('Failed to save lesson progress:', error);
    }
  };

  useEffect(() => {
    if (!isOpen || !profile || !currentPost?.id) return;
    if (currentPost.post_type === 'video' || currentPost.post_type === 'audio') return;
    void saveProgress(progressMap[currentPost.id] || 0);
  }, [isOpen, profile?.id, currentPost?.id]);

  const handleLike = async () => {
    if (!currentPost?.id) return;
    if (!profile) {
      onAuthClick?.();
      return;
    }

    setLiking(true);
    try {
      const result = await postService.likePost(currentPost.id, profile.id);
      if (typeof result?.likes_count === 'number') {
        setLikesCount(result.likes_count);
      }
      onUpdated?.();
    } catch (error) {
      console.error('Failed to like post:', error);
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    if (!currentPost?.id) return;
    if (!profile) {
      onAuthClick?.();
      return;
    }
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      await postService.addComment({
        post_id: currentPost.id,
        user_id: profile.id,
        content: commentText.trim(),
      });
      setCommentText('');
      await loadComments();
      onUpdated?.();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !currentPost) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[170] flex items-center justify-center bg-app-bg/85 p-4 backdrop-blur-xl" onClick={onClose}>
        <motion.div
          onClick={(event) => event.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-app-card p-8 shadow-2xl"
        >
          <button
            onClick={onClose}
            className="absolute left-4 top-4 z-30 inline-flex items-center gap-1 rounded-full border border-white/20 bg-app-bg/85 px-3 py-1.5 text-xs font-bold text-app-text backdrop-blur-sm transition-colors hover:bg-app-bg sm:hidden"
          >
            <X className="h-4 w-4" />
            {lang === 'en' ? 'Back' : 'رجوع'}
          </button>
          <button
            onClick={onClose}
            className="absolute right-6 top-6 z-30 rounded-full border border-white/15 bg-app-bg/75 p-2 text-app-text transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-app-accent">
              {currentPost.category?.name || currentPost.post_type}
            </p>
            <h2 className="mb-3 text-3xl font-bold text-app-text">{currentPost.title}</h2>
            <p className="text-sm text-app-muted">{currentPost.author_name || 'Admin'}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {currentPost.post_type === 'video' && currentPost.media_url && (
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-black">
                  {isEmbeddableVideo(currentPost.media_url) ? (
                    <div className="aspect-video">
                      <iframe
                        src={embeddedVideoUrl}
                        title={currentPost.title}
                        className="h-full w-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <video
                      src={currentPost.media_url}
                      controls
                      className="w-full"
                      onTimeUpdate={(event) => void saveProgress(event.currentTarget.currentTime)}
                    />
                  )}
                </div>
              )}

              {currentPost.post_type === 'pdf' && currentPost.media_url && (
                <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white">
                  <iframe src={currentPost.media_url} title={currentPost.title} className="h-[70vh] w-full" />
                </div>
              )}

              {currentPost.post_type === 'audio' && currentPost.media_url && (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <audio
                    src={currentPost.media_url}
                    controls
                    className="w-full"
                    onTimeUpdate={(event) => void saveProgress(event.currentTarget.currentTime)}
                  />
                </div>
              )}

              {currentPost.image_url && currentPost.post_type !== 'pdf' && (
                <img
                  src={currentPost.image_url}
                  alt={currentPost.title}
                  className="max-h-[30rem] w-full rounded-[2rem] object-cover"
                  referrerPolicy="no-referrer"
                />
              )}

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="prose prose-invert max-w-none whitespace-pre-wrap text-base leading-relaxed text-app-text">
                  {currentPost.content}
                </div>
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

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => void handleLike()}
                    disabled={liking}
                    className="flex items-center gap-2 text-sm font-bold text-app-text transition-colors hover:text-app-accent"
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
                {!profile && <p className="mt-4 text-xs text-app-muted">{t.signIn}</p>}
              </div>

              {seriesLessons.length > 1 && (
                <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                  <h3 className="mb-3 text-sm font-bold text-app-text">
                    {lang === 'en' ? 'Lessons In This Topic' : 'دروس هذه السلسلة'}
                  </h3>
                  <div className="space-y-2">
                    {seriesLessons.map((lesson) => {
                      const seconds = progressMap[lesson.id] || 0;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setSelectedPost(lesson)}
                          className={cn(
                            'w-full rounded-xl border px-3 py-2 text-left text-xs transition-all',
                            lesson.id === currentPost.id
                              ? 'border-app-accent/50 bg-app-accent/10 text-app-text'
                              : 'border-white/10 bg-app-card text-app-muted hover:bg-white/5'
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-bold">{lesson.lesson_order || 1}. {lesson.title}</span>
                            {seconds > 0 && (
                              <span className="text-[10px] text-app-accent">
                                {lang === 'en' ? `Last: ${Math.floor(seconds)}s` : `آخر توقف: ${Math.floor(seconds)}ث`}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <h3 className="mb-4 text-lg font-bold text-app-text">{t.comments}</h3>

                <div className="mb-4 space-y-4">
                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-app-accent" />
                    </div>
                  ) : comments.length ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="rounded-2xl border border-white/10 bg-app-card p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-app-text">{comment.user?.name || 'User'}</span>
                          <span className="text-xs text-app-muted">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
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
                    className={cn(
                      'w-full resize-none rounded-2xl border border-white/10 bg-app-card px-4 py-3 text-sm text-app-text focus:border-app-accent/50 focus:outline-none'
                    )}
                  />
                  <button
                    onClick={() => void handleComment()}
                    disabled={submitting || !commentText.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-app-accent py-3 text-sm font-bold text-app-bg disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {t.postComment}
                  </button>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-2xl border border-white/20 bg-app-bg/70 py-3 text-sm font-bold text-app-text sm:hidden"
              >
                {lang === 'en' ? 'Close Post' : 'إغلاق المنشور'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
