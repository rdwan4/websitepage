import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Share2, 
  Trophy, 
  CheckCircle2, 
  Clock, 
  Send, 
  Loader2, 
  Sparkles,
  ArrowRight,
  Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { postService } from '../services/postService';
import { Activity } from '../types';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

type Language = 'en' | 'ar';

export const CommunityFeed = ({ lang, onAuthClick }: { lang: Language, onAuthClick: () => void }) => {
  const { profile } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<string[]>([]);

  const fetchActivities = async () => {
    try {
      const data = await postService.getActivities(20);
      setActivities(data);
      if (profile) {
        const liked = await postService.getCommentLikes(profile.id);
        setLikedComments(liked);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();

    // Real-time subscription for activities
    const activitySubscription = supabase
      .channel('activities_channel')
      .on(
        'postgres_changes' as any, 
        { event: 'INSERT', schema: 'public', table: 'activities' }, 
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    // Real-time subscription for comments
    const commentSubscription = supabase
      .channel('comments_channel')
      .on(
        'postgres_changes' as any, 
        { event: '*', schema: 'public', table: 'comments' }, 
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    const commentLikesSubscription = supabase
      .channel('comment_likes_channel')
      .on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: 'comment_likes' },
        (payload) => {
          if (profile) {
            if (payload.eventType === 'INSERT') {
              setLikedComments(prev => [...prev, payload.new.comment_id]);
            } else if (payload.eventType === 'DELETE') {
              setLikedComments(prev => prev.filter(id => id !== payload.old.comment_id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitySubscription);
      supabase.removeChannel(commentSubscription);
      supabase.removeChannel(commentLikesSubscription);
    };
  }, []);

  const handleAddComment = async (activityId: string) => {
    if (!profile) {
      onAuthClick();
      return;
    }

    const text = commentText[activityId];
    if (!text?.trim()) return;

    setSubmittingComment(activityId);
    try {
      await postService.addComment({
        activity_id: activityId,
        user_id: profile.id,
        content: text
      });
      setCommentText(prev => ({ ...prev, [activityId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(null);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!profile) return onAuthClick();
    try {
      await postService.likeComment(commentId, profile.id);
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!profile) return;
    try {
      await postService.deleteComment(commentId, profile.id);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <section id="community" className="py-32 bg-app-bg relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-16", lang === 'ar' && "flex-row-reverse")}>
          
          {/* Left Column: Feed */}
          <div className={cn("lg:col-span-8", lang === 'ar' && "order-2")}>
            <div className={cn("flex items-center gap-4 mb-12", lang === 'ar' && "flex-row-reverse")}>
              <div className="w-16 h-16 bg-app-accent rounded-2xl flex items-center justify-center text-app-bg shadow-lg shadow-app-accent/30">
                <Users className="w-8 h-8" />
              </div>
              <div className={cn(lang === 'ar' && "text-right")}>
                <h2 className="text-4xl font-serif text-app-text">{lang === 'en' ? 'Community Feed' : 'نشاط المجتمع'}</h2>
                <p className="text-app-muted text-sm mt-1">{lang === 'en' ? 'Real-time updates from our global community' : 'تحديثات مباشرة من مجتمعنا العالمي'}</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-8">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-64 bg-app-card rounded-[3rem] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                {activities.map((activity, i) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass rounded-[3rem] border border-white/10 overflow-hidden shadow-xl"
                  >
                    <div className="p-8">
                      <div className={cn("flex items-start justify-between mb-8", lang === 'ar' && "flex-row-reverse")}>
                        <div className={cn("flex items-center gap-4", lang === 'ar' && "flex-row-reverse")}>
                          <div className="w-14 h-14 rounded-2xl bg-app-accent flex items-center justify-center text-app-bg font-bold text-xl overflow-hidden">
                            {activity.user?.avatar ? <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full object-cover" /> : activity.user?.name?.[0]}
                          </div>
                          <div className={cn(lang === 'ar' && "text-right")}>
                            <h4 className="text-lg font-bold text-app-text">{activity.user?.name}</h4>
                            <div className={cn("flex items-center gap-2 text-xs text-app-muted mt-1", lang === 'ar' && "flex-row-reverse")}>
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              <span className="w-1 h-1 bg-white/10 rounded-full" />
                              <span className="text-app-accent font-bold uppercase tracking-widest">{activity.type}</span>
                            </div>
                          </div>
                        </div>
                        {activity.score_earned && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-app-accent/10 border border-app-accent/20 rounded-xl text-app-accent font-bold text-sm">
                            <Trophy className="w-4 h-4" />
                            +{activity.score_earned}
                          </div>
                        )}
                      </div>

                      <p className={cn("text-xl text-app-text leading-relaxed mb-8", lang === 'ar' && "text-right")}>
                        {activity.content}
                      </p>

                      <div className={cn("flex items-center gap-6 pt-6 border-t border-white/5", lang === 'ar' && "flex-row-reverse")}>
                        <button className="flex items-center gap-2 text-app-muted hover:text-app-accent transition-colors text-sm font-bold">
                          <Heart className="w-5 h-5" />
                          {lang === 'en' ? 'Like' : 'إعجاب'}
                        </button>
                        <button className="flex items-center gap-2 text-app-muted hover:text-app-accent transition-colors text-sm font-bold">
                          <MessageCircle className="w-5 h-5" />
                          {activity.comments?.length || 0} {lang === 'en' ? 'Comments' : 'تعليقات'}
                        </button>
                        <button className="flex items-center gap-2 text-app-muted hover:text-app-accent transition-colors text-sm font-bold">
                          <Share2 className="w-5 h-5" />
                          {lang === 'en' ? 'Share' : 'مشاركة'}
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-white/5 p-8 border-t border-white/5">
                      <div className="space-y-6 mb-8">
                        {activity.comments?.map((comment) => (
                          <div key={comment.id} className={cn("flex gap-4", lang === 'ar' && "flex-row-reverse")}>
                            <div className="w-10 h-10 rounded-xl bg-app-card flex items-center justify-center text-app-text/60 font-bold text-sm overflow-hidden flex-shrink-0">
                              {comment.user?.avatar ? <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full object-cover" /> : comment.user?.name?.[0]}
                            </div>
                            <div className={cn("flex-1 bg-white/5 p-4 rounded-2xl border border-white/5", lang === 'ar' && "text-right")}>
                              <div className={cn("flex items-center justify-between mb-2", lang === 'ar' && "flex-row-reverse")}>
                                <span className="text-sm font-bold text-app-text">{comment.user?.name}</span>
                                <span className="text-[10px] text-app-muted">{new Date(comment.created_at).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-app-muted leading-relaxed">{comment.content}</p>
                              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/10">
                                <button 
                                  onClick={() => handleLikeComment(comment.id)}
                                  className={cn(
                                    "flex items-center gap-1 text-xs text-app-muted hover:text-app-accent transition-colors",
                                    likedComments.includes(comment.id) && "text-app-accent"
                                  )}
                                >
                                  <Heart className="w-3.5 h-3.5" />
                                  {lang === 'en' ? 'Like' : 'إعجاب'}
                                </button>
                                {profile?.id === comment.user_id && (
                                  <button 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    {lang === 'en' ? 'Delete' : 'حذف'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="relative">
                        <input 
                          type="text"
                          value={commentText[activity.id] || ''}
                          onChange={(e) => setCommentText(prev => ({ ...prev, [activity.id]: e.target.value }))}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddComment(activity.id)}
                          placeholder={lang === 'en' ? 'Write a comment...' : 'اكتب تعليقاً...'}
                          className={cn(
                            "w-full bg-app-bg border border-white/10 rounded-2xl py-4 text-sm text-app-text focus:outline-none focus:border-app-accent/50 transition-all",
                            lang === 'ar' ? "pr-6 pl-14" : "pl-6 pr-14"
                          )}
                        />
                        <button 
                          onClick={() => handleAddComment(activity.id)}
                          disabled={submittingComment === activity.id || !commentText[activity.id]?.trim()}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-app-accent text-app-bg rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50",
                            lang === 'ar' ? "left-2" : "right-2"
                          )}
                        >
                          {submittingComment === activity.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Stats & CTA */}
          <div className={cn("lg:col-span-4 space-y-8", lang === 'ar' && "order-1")}>
            {/* Join the Vision CTA */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-app-accent rounded-[3rem] p-10 text-app-bg relative overflow-hidden shadow-2xl shadow-app-accent/30"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="relative z-10">
                <Sparkles className="w-12 h-12 mb-6 opacity-40" />
                <h3 className="text-3xl font-serif mb-4 leading-tight">
                  {lang === 'en' ? 'Join the Vision' : 'انضم إلى الرؤية'}
                </h3>
                <p className="text-app-bg/80 text-sm mb-8 leading-relaxed">
                  {lang === 'en' 
                    ? 'Share your Islamic knowledge, write articles, or give feedback to help us grow our community.' 
                    : 'شارك معرفتك الإسلامية، اكتب مقالات، أو قدم ملاحظاتك لمساعدتنا في تنمية مجتمعنا.'}
                </p>
                <button 
                  onClick={onAuthClick}
                  className="w-full py-4 bg-app-bg text-app-accent rounded-2xl font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2"
                >
                  {lang === 'en' ? 'Get Started' : 'ابدأ الآن'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>

            {/* Top Contributors */}
            <div className={cn("glass rounded-[3rem] border border-white/10 p-10", lang === 'ar' && "text-right")}>
              <h3 className="text-xl font-bold text-app-text mb-8 flex items-center gap-3">
                <Trophy className="w-6 h-6 text-gold" />
                {lang === 'en' ? 'Top Contributors' : 'أبرز المساهمين'}
              </h3>
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                    <div className={cn("flex items-center gap-3", lang === 'ar' && "flex-row-reverse")}>
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-app-text/40 font-bold text-sm">
                        {i}
                      </div>
                      <div className={cn(lang === 'ar' && "text-right")}>
                        <p className="text-sm font-bold text-app-text">User {i}</p>
                        <p className="text-[10px] text-app-muted uppercase tracking-widest">Visionary</p>
                      </div>
                    </div>
                    <div className="text-app-accent font-bold text-sm">
                      {1000 - i * 100} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};