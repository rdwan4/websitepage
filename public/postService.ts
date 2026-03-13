import { User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient.js';
import {
  Post,
  Category,
  Profile,
  Activity,
  Comment,
  PostType,
  PostProgress,
  QuizScore,
  LeaderboardEntry,
  Reminder,
  QuranPageRow,
  QuranSurahMetadata,
} from '../types';
import { normalizeLeaderboardEntry, normalizeProfile, normalizeProfiles } from './profileUtils';
import { isMissingTableError, toSetupMessage } from './dbErrorUtils';

const buildPostSelect = () => '*, category:categories(*), author:profiles(display_name, avatar_url)';

const withAuthorName = (post: any): Post => ({
  ...post,
  author_name: post.author?.display_name || post.author_name,
});

const attachPostCounts = async (posts: Post[]): Promise<Post[]> => {
  if (!posts.length) {
    return posts;
  }

  const postIds = posts.map((post) => post.id);
  const likesByPost = new Map<string, number>();
  const commentsByPost = new Map<string, number>();
  const viewsByPost = new Map<string, number>();

  try {
    const [
      { data: likesData, error: likesError },
      { data: commentsData, error: commentsError },
      { data: viewsData, error: viewsError },
    ] = await Promise.all([
      supabase.from('likes').select('post_id').in('post_id', postIds),
      supabase.from('comments').select('post_id').in('post_id', postIds).eq('status', 'approved'),
      supabase.from('post_views').select('post_id').in('post_id', postIds),
    ]);

    if (likesError && !isMissingTableError(likesError, 'likes')) {
      throw likesError;
    }

    if (commentsError && !isMissingTableError(commentsError, 'comments')) {
      throw commentsError;
    }
    if (viewsError && !isMissingTableError(viewsError, 'post_views')) {
      throw viewsError;
    }

    (likesData || []).forEach((row: { post_id: string | null }) => {
      if (!row.post_id) return;
      likesByPost.set(row.post_id, (likesByPost.get(row.post_id) || 0) + 1);
    });

    (commentsData || []).forEach((row: { post_id: string | null }) => {
      if (!row.post_id) return;
      commentsByPost.set(row.post_id, (commentsByPost.get(row.post_id) || 0) + 1);
    });

    (viewsData || []).forEach((row: { post_id: string | null }) => {
      if (!row.post_id) return;
      viewsByPost.set(row.post_id, (viewsByPost.get(row.post_id) || 0) + 1);
    });
  } catch (error) {
    console.warn('Failed to attach live post counts:', error);
  }

  return posts.map((post) => ({
    ...post,
    views_count: viewsByPost.get(post.id) ?? post.views_count ?? 0,
    likes_count: likesByPost.get(post.id) ?? post.likes_count ?? 0,
    comments_count: commentsByPost.get(post.id) ?? post.comments_count ?? 0,
  }));
};

const syncPostLikesCount = async (postId: string): Promise<number> => {
  const { count, error: countError } = await supabase
    .from('likes')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (countError) {
    if (isMissingTableError(countError, 'likes')) {
      throw new Error(toSetupMessage('likes'));
    }
    throw countError;
  }

  const likesCount = count ?? 0;

  const { error: updateError } = await supabase
    .from('posts')
    .update({ likes_count: likesCount })
    .eq('id', postId);

  // Regular users cannot update posts directly under RLS; likes table remains source of truth.
  if (updateError && updateError.code !== '42501' && !isMissingTableError(updateError, 'posts')) {
    throw updateError;
  }

  return likesCount;
};

const syncPostViewsCount = async (postId: string): Promise<number> => {
  const { count, error: countError } = await supabase
    .from('post_views')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', postId);

  if (countError) {
    if (isMissingTableError(countError, 'post_views')) {
      throw new Error(toSetupMessage('post_views'));
    }
    throw countError;
  }

  const viewsCount = count ?? 0;

  const { error: updateError } = await supabase
    .from('posts')
    .update({ views_count: viewsCount })
    .eq('id', postId);

  // Regular users cannot update posts directly under RLS; post_views table remains source of truth.
  if (updateError && updateError.code !== '42501' && !isMissingTableError(updateError, 'posts')) {
    throw updateError;
  }

  return viewsCount;
};

const getStorageFolder = (file: File) => {
  if (file.type.startsWith('image/')) return 'images';
  if (file.type.startsWith('video/')) return 'videos';
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type === 'application/pdf') return 'pdf';
  return 'files';
};

const extractStorageObjectPath = (url: string, bucket: string): string | null => {
  try {
    const parsed = new URL(url);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const markerIndex = parsed.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    const objectPath = parsed.pathname.slice(markerIndex + marker.length);
    return objectPath ? decodeURIComponent(objectPath) : null;
  } catch {
    return null;
  }
};

const collectStoragePathsFromPost = (post: Partial<Post>, bucket = 'media'): string[] => {
  const candidates: string[] = [];

  if (post.image_url) candidates.push(post.image_url);
  if (post.media_url) candidates.push(post.media_url);
  if (Array.isArray(post.attachments)) {
    post.attachments.forEach((item) => {
      if (typeof item === 'string') candidates.push(item);
    });
  }

  const paths = candidates
    .map((url) => extractStorageObjectPath(url, bucket))
    .filter((path): path is string => Boolean(path));

  return Array.from(new Set(paths));
};

const stripSeriesFields = (post: Partial<Post>): Partial<Post> => {
  const { series_slug, series_title, lesson_order, parent_post_id, ...rest } = post as any;
  return rest;
};

const isSeriesColumnsMissingError = (error: any) => {
  const text = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    text.includes('series_slug') ||
    text.includes('series_title') ||
    text.includes('lesson_order') ||
    text.includes('parent_post_id')
  );
};
const DEFAULT_CATEGORIES: Array<Pick<Category, 'name' | 'name_ar' | 'slug'>> = [
  { name: 'Inspiration', name_ar: '\u0625\u0644\u0647\u0627\u0645', slug: 'inspiration' },
  { name: 'Hadith', name_ar: '\u062d\u062f\u064a\u062b', slug: 'hadith' },
  { name: 'Dua', name_ar: '\u062f\u0639\u0627\u0621', slug: 'dua' },
  { name: 'Academy', name_ar: '\u0627\u0644\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629', slug: 'academy' },
  { name: 'Library', name_ar: '\u0627\u0644\u0645\u0643\u062a\u0628\u0629', slug: 'library' },
  { name: 'Articles', name_ar: '\u0645\u0642\u0627\u0644\u0627\u062a', slug: 'articles' },
  { name: 'Community', name_ar: '\u0627\u0644\u0645\u062c\u062a\u0645\u0639', slug: 'community' },
];

export const postService = {
  async ensureProfile(authUser: User): Promise<Profile> {
    const fallbackName = authUser.user_metadata?.display_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: authUser.id,
          email: authUser.email,
          display_name: fallbackName,
          avatar_url: authUser.user_metadata?.avatar_url || null,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        const displayName = fallbackName;
        const now = new Date().toISOString();
        return {
          id: authUser.id,
          email: authUser.email || '',
          display_name: displayName,
          full_name: displayName,
          avatar_url: authUser.user_metadata?.avatar_url || null,
          score: 0,
          role: 'user',
          created_at: now,
          updated_at: now,
          name: displayName,
          avatar: authUser.user_metadata?.avatar_url || null,
        };
      }
      throw error;
    }
    const profile = normalizeProfile(data);
    if (!profile) throw new Error('Unable to load profile.');
    return profile;
  },

  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('name');
    if (error) {
      if (isMissingTableError(error, 'categories')) {
        throw new Error(toSetupMessage('categories'));
      }
      throw error;
    }

    if (data && data.length > 0) {
      return data;
    }

    // Bootstrap defaults for fresh projects so the "Choose section" select is never empty.
    const { error: seedError } = await supabase
      .from('categories')
      .upsert(DEFAULT_CATEGORIES, { onConflict: 'slug' });

    if (seedError) {
      throw new Error(`Unable to create default categories (${seedError.message}). Run Supabase setup SQL and reload.`);
    }

    const { data: seededData, error: seededError } = await supabase.from('categories').select('*').order('name');
    if (seededError) throw seededError;
    return seededData || [];
  },

  async savePushSubscription(subscription: PushSubscription) {
    // This is a placeholder. In a real application, you would save this to the database.
    console.log('Saving push subscription:', subscription);
    return Promise.resolve();
  },

  async getPosts(options?: {
    category_id?: string;
    is_featured?: boolean;
    is_trending?: boolean;
    is_approved?: boolean;
    post_type?: PostType;
    limit?: number;
    orderBy?: 'created_at' | 'views_count' | 'likes_count';
  }): Promise<Post[]> {
    let query = supabase.from('posts').select(buildPostSelect());

    if (options?.category_id) query = query.eq('category_id', options.category_id);
    if (options?.is_featured !== undefined) query = query.eq('is_featured', options.is_featured);
    if (options?.is_trending !== undefined) query = query.eq('is_trending', options.is_trending);
    if (options?.is_approved !== undefined) query = query.eq('is_approved', options.is_approved);
    if (options?.post_type) query = query.eq('post_type', options.post_type);

    query = query.order(options?.orderBy || 'created_at', { ascending: false });
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        const fallbackQuery = supabase.from('posts').select('*').order(options?.orderBy || 'created_at', { ascending: false });
        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return (fallbackData || []) as Post[];
      }
      throw error;
    }

    const mappedPosts = (data || []).map(withAuthorName);
    return attachPostCounts(mappedPosts);
  },

  async getPendingPosts(limit = 100): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(buildPostSelect())
      .eq('is_approved', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('posts')
          .select('*')
          .eq('is_approved', false)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (fallbackError) throw fallbackError;
        return (fallbackData || []) as Post[];
      }
      throw error;
    }

    const mappedPosts = (data || []).map(withAuthorName);
    return attachPostCounts(mappedPosts);
  },

  async getPostById(postId: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('posts')
      .select(buildPostSelect())
      .eq('id', postId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .maybeSingle();
        if (fallbackError) throw fallbackError;
        if (!fallbackData) return null;
        const [withCounts] = await attachPostCounts([fallbackData as Post]);
        return withCounts || null;
      }
      throw error;
    }

    if (!data) return null;

    const [withCounts] = await attachPostCounts([(withAuthorName(data))]);
    return withCounts || null;
  },

  async getSeriesPosts(seriesSlug: string, categoryId?: string): Promise<Post[]> {
    let query = supabase
      .from('posts')
      .select(buildPostSelect())
      .eq('series_slug', seriesSlug)
      .eq('is_approved', true)
      .order('lesson_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(withAuthorName);
  },

  async getApprovedPostsByCategory(categoryId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(buildPostSelect())
      .eq('category_id', categoryId)
      .eq('is_approved', true)
      .order('lesson_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(withAuthorName);
  },

  async getApprovedPostsByCategorySlug(categorySlug: string): Promise<Post[]> {
    const allApproved = await this.getPosts({ is_approved: true, orderBy: 'created_at' });
    return allApproved
      .filter((post) => post.category?.slug === categorySlug)
      .sort((a, b) => {
        const orderA = a.lesson_order || 1;
        const orderB = b.lesson_order || 1;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  },

  async getCoursePosts(rootPostId: string): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(buildPostSelect())
      .or(`id.eq.${rootPostId},parent_post_id.eq.${rootPostId}`)
      .eq('is_approved', true)
      .order('lesson_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      if (isSeriesColumnsMissingError(error)) {
        return [];
      }
      throw error;
    }

    return (data || []).map(withAuthorName);
  },

  async upsertPostProgress(
    userId: string,
    postId: string,
    lastPositionSeconds: number
  ): Promise<PostProgress | null> {
    const payload = {
      user_id: userId,
      post_id: postId,
      last_position_seconds: Math.max(0, Math.floor(lastPositionSeconds || 0)),
      last_seen_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('post_progress')
      .upsert(payload, { onConflict: 'user_id,post_id' })
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'post_progress')) {
        return null;
      }
      throw error;
    }

    return data as PostProgress;
  },

  async getProgressForPosts(userId: string, postIds: string[]): Promise<Record<string, number>> {
    if (!postIds.length) {
      return {};
    }

    const { data, error } = await supabase
      .from('post_progress')
      .select('post_id,last_position_seconds')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (error) {
      if (isMissingTableError(error, 'post_progress')) {
        return {};
      }
      throw error;
    }

    const map: Record<string, number> = {};
    (data || []).forEach((row: { post_id: string; last_position_seconds: number | null }) => {
      map[row.post_id] = row.last_position_seconds || 0;
    });
    return map;
  },

  async getUserProgress(userId: string, limit = 50): Promise<PostProgress[]> {
    const { data, error } = await supabase
      .from('post_progress')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error, 'post_progress')) {
        return [];
      }
      throw error;
    }

    return (data || []) as PostProgress[];
  },

  async setPostApproval(postId: string, isApproved: boolean) {
    const { data, error } = await supabase
      .from('posts')
      .update({ is_approved: isApproved })
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createPost(post: Partial<Post>) {
    const payload: Partial<Post> = {
      ...post,
      excerpt: post.excerpt || post.content?.slice(0, 180) || '',
      category_id: post.category_id === '' ? null : post.category_id,
    };

    let { data, error } = await supabase.from('posts').insert(payload).select().single();
    if (error && isSeriesColumnsMissingError(error)) {
      ({ data, error } = await supabase.from('posts').insert(stripSeriesFields(payload)).select().single());
    }
    if (error) throw error;
    return data;
  },

  async updatePost(postId: string, updates: Partial<Post>) {
    let { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error && isSeriesColumnsMissingError(error)) {
      ({ data, error } = await supabase
        .from('posts')
        .update(stripSeriesFields(updates))
        .eq('id', postId)
        .select()
        .single());
    }

    if (error) throw error;
    return data;
  },

  async deletePost(postId: string) {
    const { data: postToDelete } = await supabase
      .from('posts')
      .select('image_url, media_url, attachments')
      .eq('id', postId)
      .maybeSingle();

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (!error) {
      const storagePaths = collectStoragePathsFromPost(postToDelete || {});
      if (storagePaths.length) {
        const { error: storageError } = await supabase.storage.from('media').remove(storagePaths);
        if (storageError) {
          console.warn('Post deleted, but media cleanup failed:', storageError.message);
        }
      }
      return true;
    }

    // Fallback for older schemas that do not cascade post deletion to likes/comments.
    if (error.message?.toLowerCase().includes('foreign key')) {
      await supabase.from('likes').delete().eq('post_id', postId);
      await supabase.from('comments').delete().eq('post_id', postId);

      const { error: retryError } = await supabase.from('posts').delete().eq('id', postId);
      if (!retryError) {
        const storagePaths = collectStoragePathsFromPost(postToDelete || {});
        if (storagePaths.length) {
          const { error: storageError } = await supabase.storage.from('media').remove(storagePaths);
          if (storageError) {
            console.warn('Post deleted, but media cleanup failed:', storageError.message);
          }
        }
        return true;
      }
      throw retryError;
    }

    if (error.code === '42501') {
      throw new Error(
        "Delete denied by Supabase policy. Apply SQL fix to allow admin delete on posts."
      );
    }

    throw error;
  },

  async uploadMedia(file: File, bucket = 'media'): Promise<string> {
    const ext = file.name.split('.').pop() || 'bin';
    const folder = getStorageFolder(file);
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw new Error(`Media upload failed: ${uploadError.message}. Make sure Supabase bucket 'media' exists and storage policies are applied.`);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  },

  async recordPostView(postId: string, viewer?: { userId?: string | null; sessionId?: string | null }) {
    const userId = viewer?.userId || null;
    const sessionId = viewer?.sessionId || null;

    if (!userId && !sessionId) {
      return { views_count: null };
    }

    if (userId) {
      const { error: insertError } = await supabase
        .from('post_views')
        .upsert({ post_id: postId, user_id: userId }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });

      if (insertError) {
        if (isMissingTableError(insertError, 'post_views')) {
          throw new Error(toSetupMessage('post_views'));
        }
        throw insertError;
      }
    } else if (sessionId) {
      const { error: insertError } = await supabase
        .from('post_views')
        .upsert({ post_id: postId, session_id: sessionId }, { onConflict: 'post_id,session_id', ignoreDuplicates: true });

      if (insertError) {
        if (isMissingTableError(insertError, 'post_views')) {
          throw new Error(toSetupMessage('post_views'));
        }
        throw insertError;
      }
    }

    const viewsCount = await syncPostViewsCount(postId);
    return { views_count: viewsCount };
  },

  async likePost(postId: string, userId: string) {
    const { data: existingLike, error: existingLikeError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingLikeError) {
      if (isMissingTableError(existingLikeError, 'likes')) {
        throw new Error(toSetupMessage('likes'));
      }
      throw existingLikeError;
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) {
        if (isMissingTableError(deleteError, 'likes')) {
          throw new Error(toSetupMessage('likes'));
        }
        throw deleteError;
      }

      const likesCount = await syncPostLikesCount(postId);
      return { liked: false, likes_count: likesCount };
    }

    const { error: insertError } = await supabase
      .from('likes')
      .insert({ post_id: postId, user_id: userId });

    if (insertError) {
      // Request already liked in another tab/device.
      if (insertError.code === '23505') {
        const likesCount = await syncPostLikesCount(postId);
        return { liked: true, likes_count: likesCount };
      }
      if (isMissingTableError(insertError, 'likes')) {
        throw new Error(toSetupMessage('likes'));
      }
      throw insertError;
    }

    const likesCount = await syncPostLikesCount(postId);
    return { liked: true, likes_count: likesCount };
  },

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        return null;
      }
      throw error;
    }
    return normalizeProfile(data);
  },

  async updateProfile(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        throw new Error(toSetupMessage('profiles'));
      }
      throw error;
    }
    const profile = normalizeProfile(data);
    if (!profile) throw new Error('Unable to update profile.');
    return profile;
  },

  async addScore(userId: string, points: number) {
    const profile = await this.getProfile(userId);
    if (!profile) return null;

    return this.updateProfile(userId, {
      score: (profile.score || 0) + points,
    });
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        console.warn(toSetupMessage('profiles'));
        return [];
      }
      throw error;
    }
    return normalizeProfiles(data);
  },

  async setUserRole(userId: string, role: 'admin' | 'user') {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        throw new Error(toSetupMessage('profiles'));
      }
      throw error;
    }
    const profile = normalizeProfile(data);
    if (!profile) throw new Error('Unable to update user role.');
    return profile;
  },

  async getActivities(limit = 10): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*, user:profiles(*), comments:comments(*, user:profiles(*))')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map((activity: any) => ({
      ...activity,
      user: normalizeProfile(activity.user),
      comments: (activity.comments || []).map((comment: any) => ({
        ...comment,
        user: normalizeProfile(comment.user),
      })),
    }));
  },

  async getActivitiesByUser(userId: string, limit = 10): Promise<Activity[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*, user:profiles(*), comments:comments(*, user:profiles(*))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((activity: any) => ({
      ...activity,
      user: normalizeProfile(activity.user),
      comments: (activity.comments || []).map((comment: any) => ({
        ...comment,
        user: normalizeProfile(comment.user),
      })),
    }));
  },

  async createActivity(activity: Partial<Activity>) {
    const { data, error } = await supabase.from('activities').insert(activity).select().single();
    if (error) throw error;

    if (activity.user_id && activity.score_earned) {
      await this.addScore(activity.user_id, activity.score_earned);
    }

    return data;
  },

  async getCommentsForAdmin(): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(*), post:posts(title)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((comment: any) => ({
      ...comment,
      user: normalizeProfile(comment.user),
      post: comment.post,
    }));
  },

  async getCommentsByUser(userId: string, limit = 10): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(*), post:posts(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((comment: any) => ({
      ...comment,
      user: normalizeProfile(comment.user),
      post: comment.post,
    }));
  },

  async addComment(comment: Partial<Comment>) {
    const { data, error } = await supabase
      .from('comments')
      .insert({ ...comment, status: 'approved' })
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, user:profiles(*), post:posts(title)')
      .eq('post_id', postId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((comment: any) => ({
      ...comment,
      user: normalizeProfile(comment.user),
      post: comment.post,
    }));
  },

  async likeComment(commentId: string, userId: string) {
    const { data: existingLike, error: existingLikeError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .single();

    if (existingLikeError && existingLikeError.code !== 'PGRST116') {
      if (isMissingTableError(existingLikeError, 'comment_likes')) {
        throw new Error(toSetupMessage('comment_likes'));
      }
      throw existingLikeError;
    }

    if (existingLike) {
      const { error: deleteError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', userId);
      if (deleteError) throw deleteError;
      return { liked: false };
    } else {
      const { error: insertError } = await supabase
        .from('comment_likes')
        .insert({ comment_id: commentId, user_id: userId });
      if (insertError) {
        if (isMissingTableError(insertError, 'comment_likes')) {
          throw new Error(toSetupMessage('comment_likes'));
        }
        throw insertError;
      }
      return { liked: true };
    }
  },

  async getCommentLikes(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('comment_likes')
      .select('comment_id')
      .eq('user_id', userId);

    if (error) {
      if (isMissingTableError(error, 'comment_likes')) {
        return [];
      }
      throw error;
    }
    return (data || []).map((like: any) => like.comment_id);
  },

  async updateCommentStatus(commentId: string, status: 'approved' | 'rejected') {
    const { data, error } = await supabase
      .from('comments')
      .update({ status })
      .eq('id', commentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteComment(commentId: string, userId: string) {
    const { data: existingComment } = await supabase
      .from('comments')
      .select('id, post_id')
      .eq('id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    const { error } = await supabase.from('comments').delete().eq('id', commentId).eq('user_id', userId);
    if (error) throw error;

    return true;
  },

  async saveQuizScore(score: Partial<QuizScore>) {
    const { data, error } = await supabase.from('quiz_scores').insert(score).select().single();
    if (error) throw error;

    if (score.user_id && score.score) {
      await this.addScore(score.user_id, score.score);
    }

    return data;
  },

  async getLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, score')
      .order('score', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        console.warn(toSetupMessage('profiles'));
        return [];
      }
      throw error;
    }

    const rankedData = (data || []).map((profile, index) => ({
      user_id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      total_score: profile.score,
      rank: index + 1,
    }));

    return rankedData.map(normalizeLeaderboardEntry);
  },

  async getReminders(userId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('time');

    if (error) throw error;
    return data || [];
  },

  async createReminder(reminder: Partial<Reminder>) {
    const { data, error } = await supabase.from('reminders').insert(reminder).select().single();
    if (error) throw error;
    return data;
  },

  async updateReminder(id: string, updates: Partial<Reminder>) {
    const { data, error } = await supabase.from('reminders').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  async deleteReminder(id: string) {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (error) throw error;
    return true;
  },

  async getAllReminders(): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getQuranPages(limit = 24): Promise<QuranPageRow[]> {
    const { data, error } = await supabase
      .from('quran_pages')
      .select('*')
      .order('page_number', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async upsertQuranPage(page_number: number, image_url: string) {
    const { data, error } = await supabase
      .from('quran_pages')
      .upsert({ page_number, image_url }, { onConflict: 'page_number' })
      .select()
      .single();

    if (error) throw error;
    return data as QuranPageRow;
  },

  async getSurahs(): Promise<QuranSurahMetadata[]> {
    const { data, error } = await supabase
      .from('surahs')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUserPosts(userId: string, limit = 10): Promise<Post[]> {
    const { data, error } = await supabase
      .from('posts')
      .select(buildPostSelect())
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingTableError(error, 'profiles')) {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('posts')
          .select('*')
          .eq('author_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (fallbackError) throw fallbackError;
        return (fallbackData || []) as Post[];
      }
      throw error;
    }

    const mappedPosts = (data || []).map(withAuthorName);
    return attachPostCounts(mappedPosts);
  },

  async getQuizScoresByUser(userId: string, limit = 10): Promise<QuizScore[]> {
    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },
};
