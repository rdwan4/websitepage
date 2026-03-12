import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Star, 
  MessageCircle, 
  Heart, 
  Share2, 
  Calendar, 
  Trophy, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  ArrowLeft,
  User,
  Clock,
  Pencil,
  Trash2,
  Plus
} from 'lucide-react';
const PostContent = ({ highlight }: { highlight: CommunityHighlight }) => {
  if (highlight.post_type === 'video' && highlight.media_url) {
    return (
      <div className="relative h-0 pb-[56.25%]"> {/* 16:9 aspect ratio */}
        <iframe 
          src={highlight.media_url.replace("watch?v=", "embed/")} 
          title={highlight.title}
          className="absolute top-0 left-0 w-full h-full" 
          frameBorder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  if (highlight.post_type === 'pdf' && highlight.media_url) {
    return (
      <div className="relative h-48 overflow-hidden">
        <a href={highlight.media_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          <div className="flex items-center justify-center w-full h-full bg-gray-200">
            <p className="text-gray-600">Open PDF</p>
          </div>
        </a>
      </div>
    );
  }

  if (highlight.image) {
    return (
      <div className="relative h-48 overflow-hidden">
        <img 
          src={highlight.image} 
          alt={highlight.title} 
          className="w-full h-full object-cover transition-transform hover:scale-110"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return null;
};
import { postService } from '../services/postService';
import { Post, Profile, Activity, PostType } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient.js';
import { CreatePostModal } from '../components/CreatePostModal';
import { PostViewerModal } from '../components/PostViewerModal';

interface CommunityHighlight {
  id: string;
  type: 'post' | 'activity' | 'comment' | 'user';
  title: string;
  description: string;
  author: string;
  authorAvatar?: string;
  date: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  content?: string;
  image?: string;
  category?: string;
  status?: 'featured' | 'trending' | 'new';
  post_type?: PostType;
  media_url?: string;
}

interface CommunityCourseGroup {
  key: string;
  title: string;
  posts: Post[];
  startPost: Post;
  previewPost: Post;
}

const groupCoursePosts = (items: Post[]): CommunityCourseGroup[] => {
  const grouped = new Map<string, Post[]>();

  items.forEach((post) => {
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
};

const translations = {
  en: {
    title: 'Community Highlights',
    subtitle: 'Discover the most inspiring and engaging content from our global Islamic community',
    featured: 'Featured Content',
    trending: 'Trending Now',
    recentActivity: 'Recent Activity',
    topContributors: 'Top Contributors',
    searchPlaceholder: 'Search highlights...',
    filterByType: 'Filter by type',
    noHighlights: 'No highlights found',
    createFirst: 'Be the first to share inspiring content with the community',
    types: {
      post: 'Posts',
      activity: 'Activities',
      comment: 'Comments',
      user: 'Users'
    },
    status: {
      featured: 'Featured',
      trending: 'Trending',
      new: 'New'
    },
    actions: {
      view: 'View',
      like: 'Like',
      comment: 'Comment',
      share: 'Share'
    }
  },
  ar: {
    title: 'أبرز نشاطات المجتمع',
    subtitle: 'اكتشف أكثر المحتوى إلهامًا وتفاعلًا من مجتمعنا الإسلامي العالمي',
    featured: 'المحتوى المميز',
    trending: 'الأكثر تداولًا الآن',
    recentActivity: 'النشاطات الأخيرة',
    topContributors: 'أبرز المساهمين',
    searchPlaceholder: 'بحث في أبرز النشاطات...',
    filterByType: 'التصفية حسب النوع',
    noHighlights: 'لا توجد أبرز نشاطات',
    createFirst: 'كن أول من يشارك محتوى ملهمًا مع المجتمع',
    types: {
      post: 'منشورات',
      activity: 'نشاطات',
      comment: 'تعليقات',
      user: 'مستخدمين'
    },
    status: {
      featured: 'مميز',
      trending: 'متداول',
      new: 'جديد'
    },
    actions: {
      view: 'عرض',
      like: 'إعجاب',
      comment: 'تعليق',
      share: 'مشاركة'
    }
  }
};

export const CommunityHighlightsPage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const { profile } = useAuth();
  const [highlights, setHighlights] = useState<CommunityHighlight[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [topUsers, setTopUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showFullContent, setShowFullContent] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activePost, setActivePost] = useState<Post | null>(null);

  const t = translations[lang];

  const fetchData = async () => {
    try {
      setLoading(true);
      const postsData = await postService.getPosts({ 
        is_approved: true,
        orderBy: 'likes_count'
      });
      const communityPosts = postsData.filter((post) => post.category?.slug === 'community');
      setPosts(communityPosts);
      const groupedCommunityPosts = groupCoursePosts(communityPosts);
      
      const activitiesData = await postService.getActivities(10);
      
      const leaderboard = await postService.getLeaderboard(3);
      const users: Profile[] = leaderboard.map((entry) => ({
        id: entry.user_id,
        email: '',
        display_name: entry.display_name,
        avatar_url: entry.avatar_url,
        score: entry.total_score,
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        name: entry.name,
        avatar: entry.avatar,
      }));

      const postHighlights = groupedCommunityPosts.slice(0, 6).map((group) => ({
        id: group.startPost.id,
        type: 'post' as const,
        title: group.title,
        description: group.previewPost.excerpt || group.previewPost.content,
        author: group.startPost.author_name || 'Community Member',
        authorAvatar: group.previewPost.image_url,
        date: new Date(group.startPost.created_at).toLocaleDateString(),
        engagement: {
          likes: group.posts.reduce((sum, item) => sum + (item.likes_count || 0), 0),
          comments: group.posts.reduce((sum, item) => sum + (item.comments_count || 0), 0),
          shares: Math.floor(group.posts.reduce((sum, item) => sum + (item.likes_count || 0), 0) / 2)
        },
        content: group.previewPost.content,
        image: group.previewPost.image_url,
        category: group.startPost.category?.name,
        status: group.startPost.is_featured ? 'featured' as const : group.startPost.is_trending ? 'trending' as const : 'new' as const,
        post_type: group.previewPost.post_type,
        media_url: group.previewPost.media_url
      }));

      const activityHighlights = activitiesData.slice(0, 4).map(activity => ({
        id: activity.id,
        type: 'activity' as const,
        title: activity.content,
        description: `${activity.user?.name} ${activity.content}`,
        author: activity.user?.name || 'Community Member',
        authorAvatar: activity.user?.avatar,
        date: new Date(activity.created_at).toLocaleDateString(),
        engagement: { likes: 0, comments: 0, shares: 0 },
        content: activity.content,
        status: 'new' as const
      }));

      setHighlights([...postHighlights, ...activityHighlights]);
      setActivities(activitiesData);
      setTopUsers(users);
    } catch (error) {
      console.error('Error fetching community highlights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const subscription = supabase
      .channel('public:posts:community')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getPostById = (id: string) => posts.find((post) => post.id === id) || null;

  const filteredHighlights = highlights.filter(highlight => {
    const matchesSearch = highlight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         highlight.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         highlight.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || highlight.type === filterType;
    return matchesSearch && matchesType;
  });

  const toggleContent = (id: string) => {
    setShowFullContent(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const likeHighlight = async (id: string) => {
    if (!profile) {
      return;
    }

    try {
      await postService.likePost(id, profile.id);
      // The UI will update automatically via the real-time subscription
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleEdit = (id: string) => {
    const postToEdit = posts.find(p => p.id === id);
    if (postToEdit) {
      setEditingPost(postToEdit);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? 'Are you sure you want to delete this post?' : 'هل أنت متأكد أنك تريد حذف هذا المنشور؟')) return;
    try {
      await postService.deletePost(id);
      // UI will update via real-time subscription
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleShare = async (post: CommunityHighlight) => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.description,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert(lang === 'en' ? 'Link copied to clipboard!' : 'تم نسخ الرابط إلى الحافظة!');
      } catch (error) {
        console.error('Failed to copy link:', error);
      }
    }
  };

  return (
    <>
      <PostViewerModal
        isOpen={!!activePost}
        onClose={() => setActivePost(null)}
        post={activePost}
        lang={lang}
        onUpdated={fetchData}
      />
      <div className="min-h-screen bg-app-bg pt-32 pb-20">
        <div className="container mx-auto px-6">
          <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16", lang === 'ar' && "md:flex-row-reverse text-right")}>
            <div className="max-w-3xl">
              <Link to="/" className={cn("inline-flex items-center gap-2 text-app-accent mb-6 hover:underline group", lang === 'ar' && "flex-row-reverse")}>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                {lang === 'en' ? 'Back to Home' : 'العودة للرئيسية'}
              </Link>
              <h1 className="text-6xl md:text-7xl font-serif text-app-text mb-6 leading-tight">
                {t.title}
              </h1>
              <p className="text-app-muted text-xl leading-relaxed">
                {t.subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {profile && (
                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/10 px-5 py-3 text-xs font-bold uppercase tracking-widest text-app-accent hover:bg-app-accent/20"
                >
                  <Plus className="h-4 w-4" />
                  {profile.role === 'admin'
                    ? (lang === 'en' ? 'Create Community Post' : 'إنشاء منشور مجتمع')
                    : (lang === 'en' ? 'Submit Community Post' : 'إرسال منشور للمجتمع')}
                </button>
              )}
              <div className="bg-app-card border border-white/10 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-app-accent/10 rounded-xl flex items-center justify-center text-app-accent">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-app-text">{highlights.length}</div>
                    <div className="text-sm text-app-muted">{lang === 'en' ? 'Total Highlights' : 'إجمالي أبرز النشاطات'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Search and Filter */}
              <div className="bg-app-card border border-white/10 rounded-[3rem] p-8 shadow-xl">
                <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-6", lang === 'ar' && "md:flex-row-reverse")}>
                  <div className="flex-1">
                    <div className="relative">
                      <Search className={cn("absolute top-1/2 -translate-y-1/2 w-5 h-5 text-app-muted", lang === 'ar' ? "right-4" : "left-4")} />
                      <input 
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                          "w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-sm text-app-text focus:outline-none focus:border-app-accent/50 transition-all",
                          lang === 'ar' ? "pr-12 pl-4" : "pl-12 pr-4"
                        )}
                      />
                    </div>
                  </div>
                  
                  <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className={cn(
                      "bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-app-text focus:outline-none focus:border-app-accent/50 transition-all",
                      lang === 'ar' && "text-right"
                    )}
                  >
                    <option value="all">{t.filterByType}</option>
                    {Object.entries(t.types).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Featured Content */}
              <div>
                <h2 className="text-3xl font-bold text-app-text mb-8">{t.featured}</h2>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-64 bg-app-card rounded-[3rem] animate-pulse" />
                    ))}
                  </div>
                ) : filteredHighlights.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {filteredHighlights.map((highlight, i) => (
                      <motion.div
                        key={highlight.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-app-card border border-white/10 rounded-[3rem] overflow-hidden shadow-xl hover:border-app-accent/30 transition-all"
                      >
                        <PostContent highlight={highlight} />
                        <div className={cn("p-8", lang === 'ar' && "text-right")}>
                          {highlight.status && (
                              <div className="absolute top-4 left-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                                  highlight.status === 'featured' ? 'bg-gold/20 text-gold' :
                                  highlight.status === 'trending' ? 'bg-red-500/20 text-red-400' :
                                  'bg-blue-500/20 text-blue-400'
                                }`}>
                                  {t.status[highlight.status]}
                                </span>
                              </div>
                            )}
                          <div className={cn("flex items-center gap-4 mb-4", lang === 'ar' && "flex-row-reverse")}>
                            <div className="flex items-center gap-2 text-xs text-app-muted">
                              <User className="w-3.5 h-3.5" />
                              {highlight.author}
                            </div>
                            <span className="w-1 h-1 bg-white/10 rounded-full" />
                            <div className="flex items-center gap-2 text-xs text-app-muted">
                              <Calendar className="w-3.5 h-3.5" />
                              {highlight.date}
                            </div>
                            {highlight.category && (
                              <>
                                <span className="w-1 h-1 bg-white/10 rounded-full" />
                                <span className="px-2 py-1 bg-white/5 rounded-lg text-xs text-app-muted">{highlight.category}</span>
                              </>
                            )}
                            {profile?.role === 'admin' && (
                              <>
                                <span className="w-1 h-1 bg-white/10 rounded-full" />
                                <button onClick={() => handleEdit(highlight.id)} className="flex items-center gap-1 text-xs text-app-muted hover:text-app-accent">
                                  <Pencil className="w-3 h-3" />
                                  {lang === 'en' ? 'Edit' : 'تعديل'}
                                </button>
                                <button onClick={() => handleDelete(highlight.id)} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400">
                                  <Trash2 className="w-3 h-3" />
                                  {lang === 'en' ? 'Delete' : 'حذف'}
                                </button>
                              </>
                            )}
                          </div>
                          
                          <h3 className="text-xl font-bold text-app-text mb-4 line-clamp-2">{highlight.title}</h3>
                          
                                                  <div className="mb-6">
                                                    <p className={cn("text-app-muted text-sm leading-relaxed", showFullContent.includes(highlight.id) ? "" : "line-clamp-3")}>
                                                      {showFullContent.includes(highlight.id) ? highlight.content : highlight.description}
                                                    </p>
                                                    {(highlight.content?.length ?? 0) > (highlight.description?.length ?? 0) && (
                                                      <button
                                                        onClick={() => toggleContent(highlight.id)}
                                                        className="mt-2 text-app-accent text-sm font-bold hover:underline flex items-center gap-2"
                                                      >
                                                        {showFullContent.includes(highlight.id) ? (
                                                          <>
                                                            <EyeOff className="w-4 h-4" />
                                                            {lang === 'en' ? 'Hide' : 'إخفاء'}
                                                          </>
                                                        ) : (
                                                          <>
                                                            <Eye className="w-4 h-4" />
                                                            {lang === 'en' ? 'Read More' : 'قراءة المزيد'}
                                                          </>
                                                        )}
                                                      </button>
                                                    )}
                                                  </div>
                          <div className={cn("flex items-center justify-between pt-6 border-t border-white/5", lang === 'ar' && "flex-row-reverse")}>
                            <div className="flex items-center gap-6">
                              <button 
                                onClick={() => likeHighlight(highlight.id)}
                                className="flex items-center gap-2 text-app-muted hover:text-app-accent transition-colors text-sm font-bold"
                              >
                                <Heart className="w-4 h-4" />
                                {highlight.engagement.likes}
                              </button>
                              <button 
                                onClick={() => {
                                  const post = getPostById(highlight.id);
                                  if (post) {
                                    setActivePost(post);
                                  }
                                }}
                                className="flex items-center gap-2 text-app-muted hover:text-app-accent transition-colors text-sm font-bold"
                              >
                                <MessageCircle className="w-4 h-4" />
                                {highlight.engagement.comments}
                              </button>
                              <button 
                                onClick={() => handleShare(highlight)}
                                className="flex items-center gap-2 text-app-muted hover:text-app-accent transition-colors text-sm font-bold"
                              >
                                <Share2 className="w-4 h-4" />
                                {highlight.engagement.shares}
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => {
                                const post = getPostById(highlight.id);
                                if (post) {
                                  setActivePost(post);
                                } else {
                                  toggleContent(highlight.id);
                                }
                              }}
                              className="bg-app-accent text-app-bg px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all">
                              {t.actions.view}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 glass rounded-[4rem] border border-white/5">
                    <Users className="w-20 h-20 text-app-muted mx-auto mb-8 opacity-20" />
                    <h3 className="text-2xl font-bold text-app-text mb-4">{t.noHighlights}</h3>
                    <p className="text-app-muted text-lg">{t.createFirst}</p>
                  </div>
                )}
              </div>

              {/* Recent Activity */}
              <div>
                <h2 className="text-3xl font-bold text-app-text mb-8">{t.recentActivity}</h2>
                <div className="space-y-6">
                  {activities.slice(0, 5).map((activity, i) => (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-app-card border border-white/10 rounded-2xl p-6 hover:border-app-accent/30 transition-all"
                    >
                      <div className={cn("flex items-start gap-4", lang === 'ar' && "flex-row-reverse")}>
                        <div className="w-12 h-12 rounded-xl bg-app-accent/10 flex items-center justify-center text-app-accent font-bold text-sm overflow-hidden flex-shrink-0">
                          {activity.user?.avatar ? (
                            <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full object-cover" />
                          ) : activity.user?.name?.[0]}
                        </div>
                        <div className="flex-1">
                          <div className={cn("flex items-center gap-3 mb-2", lang === 'ar' && "flex-row-reverse")}>
                            <span className="font-bold text-app-text">{activity.user?.name}</span>
                            <span className="text-xs text-app-muted">{new Date(activity.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-app-text text-sm leading-relaxed">{activity.content}</p>
                          {activity.score_earned > 0 && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-green-400 font-bold">
                              <Trophy className="w-3.5 h-3.5" />
                              +{activity.score_earned} points
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8">
              {/* Top Contributors */}
              <div className={cn("bg-app-card border border-white/10 rounded-[3rem] p-8 shadow-xl", lang === 'ar' && "text-right")}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-app-accent/10 rounded-2xl flex items-center justify-center text-app-accent">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-app-text">{t.topContributors}</h3>
                    <p className="text-app-muted text-sm">{lang === 'en' ? 'Most active community members' : 'أكثر أعضاء المجتمع نشاطًا'}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {topUsers.map((user, i) => (
                    <div key={user.id} className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                      <div className={cn("flex items-center gap-3", lang === 'ar' && "flex-row-reverse")}>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-app-text/40 font-bold text-sm overflow-hidden">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : user.name?.[0]}
                        </div>
                        <div className={cn(lang === 'ar' && "text-right")}>
                          <p className="font-bold text-app-text text-sm">{user.name}</p>
                          <p className="text-xs text-app-muted">{lang === 'en' ? 'Community Member' : 'عضو مجتمع'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-app-accent">{user.score}</div>
                        <div className="text-xs text-app-muted">{lang === 'en' ? 'Points' : 'نقاط'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Stats */}
              <div className="bg-app-card border border-white/10 rounded-[3rem] p-8 shadow-xl">
                <h3 className="text-xl font-bold text-app-text mb-6">{lang === 'en' ? 'Community Stats' : 'إحصائيات المجتمع'}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <div className="text-2xl font-bold text-app-accent">{highlights.length}</div>
                    <div className="text-xs text-app-muted">{lang === 'en' ? 'Highlights' : 'أبرز النشاطات'}</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <div className="text-2xl font-bold text-green-400">{activities.length}</div>
                    <div className="text-xs text-app-muted">{lang === 'en' ? 'Activities' : 'نشاطات'}</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <div className="text-2xl font-bold text-blue-400">{topUsers.length}</div>
                    <div className="text-xs text-app-muted">{lang === 'en' ? 'Contributors' : 'مساهمين'}</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-2xl">
                    <div className="text-2xl font-bold text-gold">{topUsers.reduce((acc, user) => acc + user.score, 0)}</div>
                    <div className="text-xs text-app-muted">{lang === 'en' ? 'Total Points' : 'إجمالي النقاط'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        lang={lang}
        initialType="article"
        initialCategorySlug="community"
        categoryFilter="non-sidebar"
        modalTitle={profile?.role === 'admin' ? 'Create Community Post' : 'Submit Community Post'}
        modalSubtitle={
          profile?.role === 'admin'
            ? 'Publish to Community page only, separate from sidebar icons.'
            : 'Your post will be sent for admin approval before appearing in community.'
        }
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchData();
          window.dispatchEvent(new Event('posts-updated'));
        }}
      />

      <CreatePostModal
        isOpen={!!editingPost}
        onClose={() => setEditingPost(null)}
        lang={lang}
        onSuccess={() => {
          setEditingPost(null);
          fetchData();
        }}
        postToEdit={editingPost}
      />
    </>
  );
};
