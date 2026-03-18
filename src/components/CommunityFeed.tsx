import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  MessageCircle,
  Heart,
  Trophy,
  Clock,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { postService } from '../services/postService';
import { Activity } from '../types';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext';
import { siteLinks } from '../config/siteLinks';

type Language = 'en' | 'ar';

const copy = {
  en: {
    title: 'Community Activity',
    subtitle: 'Real-time updates from our global community',
    like: 'Like',
    comments: 'Comments',
    share: 'Share',
    writeComment: 'Write a comment...',
    joinTitle: 'Join the Vision',
    joinBody: 'Share your Islamic knowledge, write articles, or give feedback to help us grow our community.',
    getStarted: 'Get Started',
    topContributors: 'Top Contributors',
    emptyTitle: 'No activity yet',
    error: 'Could not load community feed.',
    retry: 'Try Again',
    member: 'Member',
    points: 'pts',
  },
  ar: {
    title: 'نشاط المجتمع',
    subtitle: 'تحديثات مباشرة من مجتمعنا العالمي',
    like: 'إعجاب',
    comments: 'تعليقات',
    share: 'مشاركة',
    writeComment: 'اكتب تعليقًا...',
    joinTitle: 'انضم إلى الرؤية',
    joinBody: 'شارك معرفتك الإسلامية، واكتب مقالات، أو قدّم ملاحظاتك لمساعدتنا في تنمية مجتمعنا.',
    getStarted: 'ابدأ الآن',
    topContributors: 'أبرز المساهمين',
    emptyTitle: 'لا يوجد نشاط مجتمعي بعد',
    error: 'تعذر تحميل نشاط المجتمع الآن.',
    retry: 'إعادة المحاولة',
    member: 'عضو مجتمع',
    points: 'نقطة',
  },
} as const;

type CommunityFeedProps = {
  lang: Language;
  onAuthClick?: () => void;
};

export const CommunityFeed = ({ lang, onAuthClick }: CommunityFeedProps) => {
  const { profile } = useAuth();
  const t = copy[lang];
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoadError('');
      const data = await postService.getActivities(20);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setLoadError(t.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchActivities();
    const activitySub = supabase.channel('activities_channel').on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'activities' }, () => { void fetchActivities(); }).subscribe();
    const commentSub = supabase.channel('comments_channel').on('postgres_changes' as any, { event: '*', schema: 'public', table: 'comments' }, () => { void fetchActivities(); }).subscribe();
    return () => { supabase.removeChannel(activitySub); supabase.removeChannel(commentSub); };
  }, [profile, t.error]);

  const handleAddComment = async (activityId: string) => {
    if (!profile) {
      onAuthClick?.();
      return;
    }
    const text = commentText[activityId];
    if (!text?.trim()) return;
    setSubmittingComment(activityId);
    try {
      await postService.addComment({ activity_id: activityId, user_id: profile.id, content: text });
      setCommentText(p => ({ ...p, [activityId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
      setLoadError(t.error);
    } finally {
      setSubmittingComment(null);
    }
  };

  return (
    <section id="community" className="bg-app-bg py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className={cn("flex flex-col gap-12", lang === 'ar' && "text-right")}>
          <div className={cn("flex items-center gap-5", lang === 'ar' && "flex-row-reverse")}>
             <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-app-accent text-app-bg shadow-2xl shadow-app-accent/30">
                <Users className="h-8 w-8" />
             </div>
             <div>
                <h2 className="text-4xl font-bold text-app-text tracking-tight sm:text-5xl">{t.title}</h2>
                <p className="mt-2 text-lg text-app-muted">{t.subtitle}</p>
             </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-10 lg:col-span-8">
              {loading ? (
                <div className="space-y-8">{[1, 2, 3].map(i => <div key={i} className="h-96 animate-pulse rounded-[3rem] bg-app-card" />)}</div>
              ) : loadError ? (
                <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-8">
                  <p className="mb-4 text-base font-semibold text-red-300">{loadError}</p>
                  <button
                    onClick={() => {
                      setLoading(true);
                      void fetchActivities();
                    }}
                    className="rounded-xl bg-app-accent px-4 py-2 text-sm font-bold text-app-bg"
                  >
                    {t.retry}
                  </button>
                </div>
              ) : (
                <div className="space-y-10">
                  {activities.map((activity, i) => (
                    <motion.div key={activity.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} className="overflow-hidden rounded-[3rem] border border-white/5 bg-app-card shadow-2xl transition-all hover:border-white/10">
                      <div className="p-8 md:p-12">
                         <div className={cn("mb-8 flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                            <div className={cn("flex items-center gap-5", lang === 'ar' && "flex-row-reverse")}>
                               <div className="h-16 w-16 overflow-hidden rounded-2xl bg-app-accent text-2xl font-bold text-app-bg flex items-center justify-center">
                                  {activity.user?.avatar ? <img src={activity.user.avatar} className="h-full w-full object-cover" /> : activity.user?.name?.[0]}
                               </div>
                               <div>
                                  <h4 className="text-xl font-bold text-app-text">{activity.user?.name}</h4>
                                  <p className="text-sm font-bold text-app-accent uppercase tracking-widest">{activity.type}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-app-muted font-bold"><Clock className="h-4 w-4" /> {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                         </div>

                         {/* ENLARGED CONTENT */}
                         <p className={cn("mb-10 text-2xl font-bold leading-[1.6] text-app-text", lang === 'ar' && "text-right")}>{activity.content}</p>

                         <div className={cn("flex items-center gap-8 border-t border-white/5 pt-8", lang === 'ar' && "flex-row-reverse")}>
                            <button className="flex items-center gap-3 text-sm font-bold text-app-muted transition-colors hover:text-app-accent">
                               <Heart className="h-6 w-6" /> {t.like}
                            </button>
                            <button className="flex items-center gap-3 text-sm font-bold text-app-muted transition-colors hover:text-app-accent">
                               <MessageCircle className="h-6 w-6" /> {activity.comments?.length || 0} {t.comments}
                            </button>
                         </div>
                      </div>

                      {/* COMMENTS SECTION */}
                      <div className="bg-white/[0.02] p-8 md:p-12 border-t border-white/5">
                        <div className="mb-8 space-y-6">
                           {activity.comments?.map(comment => (
                             <div key={comment.id} className={cn("flex gap-4", lang === 'ar' && "flex-row-reverse")}>
                               <div className="h-10 w-10 flex-shrink-0 rounded-xl bg-white/5 flex items-center justify-center text-sm font-bold">{comment.user?.name?.[0]}</div>
                               <div className={cn("flex-1 rounded-2xl bg-white/[0.03] p-4", lang === 'ar' && "text-right")}>
                                  <p className="text-sm font-bold text-app-text mb-1">{comment.user?.name}</p>
                                  <p className="text-sm text-app-muted">{comment.content}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                        <div className="relative">
                           <input type="text" value={commentText[activity.id] || ''} onChange={(e) => setCommentText(p => ({ ...p, [activity.id]: e.target.value }))} className={cn("w-full rounded-2xl bg-app-bg py-5 px-6 text-sm border border-white/10 outline-none focus:border-app-accent/50", lang === 'ar' && "text-right")} placeholder={t.writeComment} />
                           <button
                             onClick={() => void handleAddComment(activity.id)}
                             disabled={submittingComment === activity.id}
                             className={cn("absolute top-1/2 -translate-y-1/2 h-10 w-10 bg-app-accent rounded-xl flex items-center justify-center text-app-bg disabled:opacity-60", lang === 'ar' ? "left-3" : "right-3")}
                           >
                             {submittingComment === activity.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <aside className="lg:col-span-4 space-y-8">
               {profile?.role === 'admin' && (
               <div className={cn("rounded-[3rem] border border-white/5 bg-app-card p-10", lang === 'ar' && "text-right")}>
                  <h3 className="text-xl font-bold text-app-text mb-8 flex items-center gap-3"><Trophy className="h-6 w-6 text-gold" /> {t.topContributors}</h3>
                  <div className="space-y-6">
                     {[1,2,3].map(i => (
                        <div key={i} className={cn("flex items-center justify-between", lang === 'ar' && "flex-row-reverse")}>
                           <div className={cn("flex items-center gap-4", lang === 'ar' && "flex-row-reverse")}>
                              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-xs font-bold">{i}</div>
                              <p className="text-sm font-bold">Contributor {i}</p>
                           </div>
                           <p className="text-sm font-bold text-app-accent">{1000 - (i*100)} {t.points}</p>
                        </div>
                     ))}
                  </div>
               </div>
               )}

               <div className="relative overflow-hidden rounded-[3rem] bg-app-accent p-12 text-app-bg shadow-2xl shadow-app-accent/20">
                  <div className="absolute top-0 right-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 bg-white/10 blur-[80px]" />
                  <div className="relative z-10">
                     <Sparkles className="mb-6 h-12 w-12 opacity-40" />
                     <h3 className="mb-4 text-3xl font-bold leading-tight">{t.joinTitle}</h3>
                     <p className="mb-8 text-sm font-bold leading-relaxed text-app-bg/80">{t.joinBody}</p>
                     <a
                       href={siteLinks.social.youtube}
                       target="_blank"
                       rel="noreferrer"
                       className="block w-full rounded-2xl bg-app-bg py-4 text-center text-sm font-bold uppercase tracking-widest text-app-accent transition-all hover:scale-105"
                     >
                       {t.getStarted}
                     </a>
                  </div>
               </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
};