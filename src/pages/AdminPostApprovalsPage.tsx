import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Trash2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { postService } from '../services/postService';
import { stripHtmlToPlainText } from '../lib/postContent';
import { Post } from '../types';
import { cn } from '../lib/utils';

export const AdminPostApprovalsPage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await postService.getPendingPosts(200);
      setPosts(data);
    } catch (error) {
      console.error('Error loading pending posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPending();
  }, []);

  const approvePost = async (postId: string) => {
    try {
      setActingId(postId);
      await postService.setPostApproval(postId, true);
      await fetchPending();
      window.dispatchEvent(new Event('posts-updated'));
    } catch (error) {
      console.error('Error approving post:', error);
    } finally {
      setActingId(null);
    }
  };

  const rejectPost = async (postId: string) => {
    const confirmed = window.confirm(
      lang === 'en' ? 'Delete this pending post?' : 'هل تريد حذف هذا المنشور المعلّق؟'
    );
    if (!confirmed) return;

    try {
      setActingId(postId);
      await postService.deletePost(postId);
      await fetchPending();
      window.dispatchEvent(new Event('posts-updated'));
    } catch (error) {
      console.error('Error deleting pending post:', error);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className={cn('mb-10 flex items-center justify-between', lang === 'ar' && 'flex-row-reverse text-right')}>
          <div>
            <h1 className="text-5xl font-serif text-app-text">
              {lang === 'en' ? 'Post Approval Dashboard' : 'لوحة اعتماد المنشورات'}
            </h1>
            <p className="mt-2 text-sm text-app-muted">
              {lang === 'en' ? 'Approve or reject user-submitted posts.' : 'اعتماد أو رفض المنشورات المرسلة من المستخدمين.'}
            </p>
          </div>
          <Link to="/admin" className="rounded-xl border border-white/10 px-4 py-2 text-sm text-app-text hover:bg-white/10">
            {lang === 'en' ? 'Back to Admin' : 'العودة للإدارة'}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-app-accent" />
          </div>
        ) : posts.length ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className={cn(
                  'rounded-2xl border border-white/10 bg-app-card p-5',
                  lang === 'ar' && 'text-right'
                )}
              >
                <div className={cn('flex items-start justify-between gap-4', lang === 'ar' && 'flex-row-reverse')}>
                  <div>
                    <h3 className="text-lg font-bold text-app-text">{post.title}</h3>
                    <p className="text-xs text-app-muted">
                      {post.category?.name || 'General'} · {post.author_name || post.author_id}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm text-app-muted">{stripHtmlToPlainText(post.content)}</p>
                  </div>
                  <div className={cn('flex items-center gap-2', lang === 'ar' && 'flex-row-reverse')}>
                    <button
                      onClick={() => void approvePost(post.id)}
                      disabled={actingId === post.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-bold text-green-300 hover:bg-green-500/20 disabled:opacity-50"
                    >
                      {actingId === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {lang === 'en' ? 'Approve' : 'اعتماد'}
                    </button>
                    <button
                      onClick={() => void rejectPost(post.id)}
                      disabled={actingId === post.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {lang === 'en' ? 'Delete' : 'حذف'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-app-card p-8 text-center text-app-muted">
            <XCircle className="mx-auto mb-3 h-8 w-8 opacity-50" />
            {lang === 'en' ? 'No pending posts.' : 'لا توجد منشورات بانتظار المراجعة.'}
          </div>
        )}
      </div>
    </div>
  );
};
