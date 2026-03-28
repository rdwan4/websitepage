import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Camera,
  FileText,
  Loader2,
  MessageCircle,
  PenSquare,
  Shield,
  UserRound,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';
import { isNativeApp } from '../lib/runtime';
import { useAuth } from '../context/AuthContext';
import { postService } from '../services/postService';
import { broadcastNotificationService } from '../services/broadcastNotificationService';
import { Preferences } from '@capacitor/preferences';
import { PushNotifications } from '@capacitor/push-notifications';
import { Activity, Comment, Post, PostProgress, QuizScore } from '../types';

const labels = {
  en: {
    back: 'Back to Home',
    title: 'My Account',
    subtitle: 'Manage your profile, view your activity, and keep your Islamic learning journey in sync.',
    displayName: 'Display name',
    email: 'Email',
    role: 'Role',
    joined: 'Joined',
    save: 'Save Changes',
    posts: 'My Posts',
    comments: 'My Comments',
    reminders: 'My Reminders',
    activity: 'Recent Activity',
    quizScores: 'Quiz Scores',
    noPosts: 'No posts yet.',
    noComments: 'No comments yet.',
    noReminders: 'No reminders yet.',
    noActivity: 'No recent activity yet.',
    noScores: 'No quiz scores yet.',
    updated: 'Profile updated successfully.',
    avatarUpdated: 'Profile photo updated successfully.',
  },
  ar: {
    back: 'العودة إلى الرئيسية',
    title: 'حسابي',
    subtitle: 'أدر ملفك الشخصي وراجع نشاطك وحافظ على مزامنة رحلتك التعليمية.',
    displayName: 'الاسم الظاهر',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    joined: 'تاريخ الانضمام',
    save: 'حفظ التغييرات',
    posts: 'منشوراتي',
    comments: 'تعليقاتي',
    reminders: 'تذكيراتي',
    activity: 'آخر النشاط',
    quizScores: 'نتائج الاختبارات',
    noPosts: 'لا توجد منشورات بعد.',
    noComments: 'لا توجد تعليقات بعد.',
    noReminders: 'لا توجد تذكيرات بعد.',
    noActivity: 'لا يوجد نشاط حديث بعد.',
    noScores: 'لا توجد نتائج اختبارات بعد.',
    updated: 'تم تحديث الملف الشخصي بنجاح.',
    avatarUpdated: 'تم تحديث الصورة الشخصية بنجاح.',
  },
};

export const AccountPage = ({ lang }: { lang: 'en' | 'ar' }) => {
  const t = labels[lang];
  const nativeApp = isNativeApp();
  const { profile, updateProfile, uploadAvatar } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [scores, setScores] = useState<QuizScore[]>([]);
  const [progress, setProgress] = useState<Array<PostProgress & { post?: Post }>>([]);
  const [pushStatus, setPushStatus] = useState<{ token?: string; permission?: string }>({});

  useEffect(() => {
    setDisplayName(profile?.display_name || '');
  }, [profile?.display_name]);

  useEffect(() => {
    const loadAccountData = async () => {
      if (!profile) return;

      setLoading(true);
      setError('');

      try {
        const [postsData, commentsData, activitiesData, scoresData, progressData] = await Promise.all([
          postService.getUserPosts(profile.id, 100),
          postService.getCommentsByUser(profile.id, 6),
          postService.getActivitiesByUser(profile.id, 8),
          postService.getQuizScoresByUser(profile.id, 6),
          postService.getUserProgress(profile.id, 100),
        ]);

        setPosts(postsData);
        setComments(commentsData);
        setActivities(activitiesData);
        setScores(scoresData);
        const postsById = new Map(postsData.map((post) => [post.id, post]));
        setProgress(
          progressData
            .map((item) => ({ ...item, post: postsById.get(item.post_id) }))
            .filter((item) => Boolean(item.post))
            .slice(0, 8)
        );
      } catch (err: any) {
        setError(err.message || 'Failed to load account data.');
      } finally {
        setLoading(false);
      }
    };

    loadAccountData();

    if (nativeApp) {
      const checkPush = async () => {
        const { value: token } = await Preferences.get({ key: 'last-fcm-token-v6' });
        const perm = await PushNotifications.checkPermissions();
        setPushStatus({ token: token || undefined, permission: perm.receive });
      };
      checkPush();
    }
  }, [profile, nativeApp]);

  const handleManualSync = async () => {
    setSaving(true);
    try {
      await broadcastNotificationService.init();
      await broadcastNotificationService.syncTokenToProfile();
      const { value: token } = await Preferences.get({ key: 'last-fcm-token-v6' });
      const perm = await PushNotifications.checkPermissions();
      setPushStatus({ token: token || undefined, permission: perm.receive });
      setMessage(lang === 'en' ? 'Push token re-synced successfully.' : 'تم إعادة مزامنة معرف الإشعارات بنجاح.');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return null;
  }

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await updateProfile({
        display_name: displayName.trim() || profile.display_name,
        avatar_url: profile.avatar_url,
      });
      setMessage(t.updated);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await uploadAvatar(file);
      setMessage(t.avatarUpdated);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile image.');
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  const stats = [
    { label: t.posts, value: posts.length, icon: PenSquare },
    { label: t.comments, value: comments.length, icon: MessageCircle },
    { label: t.quizScores, value: scores.length, icon: FileText },
  ];

  return (
    <div className={cn('min-h-screen bg-app-bg', nativeApp ? 'pt-24 pb-28 md:pb-20' : 'pt-32 pb-20')}>
      <div className={cn('container mx-auto', nativeApp ? 'px-4 md:px-6' : 'px-6')}>
        <div className={cn('flex flex-col md:flex-row md:items-center justify-between', nativeApp ? 'gap-5 mb-8' : 'gap-8 mb-10', lang === 'ar' && 'md:flex-row-reverse text-right')}>
          <div className="max-w-3xl">
            {!nativeApp && (
              <Link to="/" className={cn('inline-flex items-center gap-2 text-app-accent mb-6 hover:underline group', lang === 'ar' && 'flex-row-reverse')}>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                {t.back}
              </Link>
            )}
            <h1 className={cn('font-serif text-app-text', nativeApp ? 'mb-2 text-3xl md:text-4xl' : 'mb-4 text-5xl md:text-6xl')}>{t.title}</h1>
            {!nativeApp && <p className="text-app-muted text-lg">{t.subtitle}</p>}
          </div>
        </div>

        {error && <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400">{error}</div>}
        {message && <div className="mb-6 rounded-2xl border border-app-accent/20 bg-app-accent/10 px-5 py-4 text-sm text-app-accent">{message}</div>}

        <div className={cn('grid grid-cols-1 xl:grid-cols-3', nativeApp ? 'gap-4 md:gap-6' : 'gap-6')}>
          <div className="xl:col-span-1 space-y-6">
            <div className={cn('bg-app-card border border-white/10 shadow-xl', nativeApp ? 'rounded-[1.6rem] p-5 md:rounded-[2.5rem] md:p-8' : 'rounded-[2.5rem] p-8')}>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className={cn('overflow-hidden bg-app-accent/10 border border-app-accent/20 flex items-center justify-center text-app-accent font-bold', nativeApp ? 'h-24 w-24 rounded-[1.4rem] text-3xl md:h-28 md:w-28 md:rounded-[2rem] md:text-4xl' : 'h-28 w-28 rounded-[2rem] text-4xl')}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                    ) : (
                      profile.display_name[0]
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-11 h-11 rounded-2xl bg-app-accent text-app-bg flex items-center justify-center cursor-pointer shadow-lg shadow-app-accent/20">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </label>
                </div>

                <h2 className={cn('font-bold text-app-text', nativeApp ? 'text-xl' : 'text-2xl')}>{profile.display_name}</h2>
                <p className="text-sm text-app-muted mt-1">{profile.email}</p>
                <div className="mt-4 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-widest text-app-text">
                  {profile.role === 'admin' && <Shield className="w-3.5 h-3.5 text-app-accent" />}
                  {profile.role}
                </div>
              </div>
            </div>

            <div className={cn('bg-app-card border border-white/10 shadow-xl', nativeApp ? 'rounded-[1.6rem] p-5 md:rounded-[2.5rem] md:p-8' : 'rounded-[2.5rem] p-8')}>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-app-muted mb-2">{t.displayName}</label>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-app-text focus:outline-none focus:border-app-accent/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-app-muted mb-2">{t.email}</label>
                  <input value={profile.email} disabled className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-app-muted" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-left">
                  <InfoBadge label={t.role} value={profile.role} />
                  <InfoBadge label={t.joined} value={new Date(profile.created_at).toLocaleDateString()} />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-app-accent px-5 py-3 text-sm font-bold uppercase tracking-widest text-app-bg transition-all hover:scale-[1.01] disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t.save}
                </button>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className={cn('grid grid-cols-2 lg:grid-cols-4', nativeApp ? 'gap-3 md:gap-4' : 'gap-4')}>
              {stats.map((stat) => (
                <div key={stat.label} className={cn('bg-app-card border border-white/10', nativeApp ? 'rounded-[1.25rem] p-4 md:rounded-3xl md:p-5' : 'rounded-3xl p-5')}>
                  <stat.icon className="w-5 h-5 text-app-accent mb-4" />
                  <div className="text-3xl font-bold text-app-text">{stat.value}</div>
                  <div className="text-xs uppercase tracking-widest text-app-muted mt-2">{stat.label}</div>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-app-accent" />
              </div>
            ) : (
              <>
                <SectionCard title={t.activity}>
                  {activities.length ? (
                    <div className="space-y-3">
                      {activities.map((activity) => (
                        <motion.div key={activity.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <p className="text-sm text-app-text">{activity.content}</p>
                          <div className="mt-2 text-xs text-app-muted">{new Date(activity.created_at).toLocaleString()}</div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState text={t.noActivity} />
                  )}
                </SectionCard>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SectionCard title={t.posts}>
                    {posts.length ? (
                      <div className="space-y-3">
                        {posts.slice(0, 6).map((post) => (
                          <div key={post.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="font-semibold text-app-text">{post.title}</p>
                              {!post.is_approved && (
                                <span className="shrink-0 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                  {lang === 'en' ? 'Pending Admin Approval' : 'بانتظار موافقة المشرف'}
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-app-muted line-clamp-2">{post.excerpt || post.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text={t.noPosts} />
                    )}
                  </SectionCard>

                  <SectionCard title={t.comments}>
                    {comments.length ? (
                      <div className="space-y-3">
                        {comments.map((comment) => (
                          <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-sm text-app-text">{comment.content}</p>
                            <p className="mt-2 text-xs text-app-muted">{comment.post?.title || 'Activity comment'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text={t.noComments} />
                    )}
                  </SectionCard>

                  <SectionCard title={t.quizScores}>
                    {scores.length ? (
                      <div className="space-y-3">
                        {scores.map((score) => (
                          <div key={score.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-app-text">{score.category}</p>
                              <span className="text-xs text-app-muted">
                                {score.score}/{score.total_questions}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-app-muted">{new Date(score.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text={t.noScores} />
                    )}
                  </SectionCard>

                  <SectionCard title={lang === 'en' ? 'Continue Learning' : 'مواصلة التعلم'}>
                    {progress.length ? (
                      <div className="space-y-3">
                        {progress.map((item) => (
                          <div key={`${item.user_id}-${item.post_id}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <p className="font-semibold text-app-text">
                                {item.post?.series_title || item.post?.title}
                              </p>
                              <span className="text-xs text-app-accent">{item.last_position_seconds}s</span>
                            </div>
                            <p className="mt-1 text-xs text-app-muted">
                              {lang === 'en' ? 'Lesson' : 'الدرس'} {item.post?.lesson_order || 1} · {item.post?.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState text={lang === 'en' ? 'No lesson progress saved yet.' : 'لا توجد بيانات تقدم محفوظة بعد.'} />
                    )}
                  </SectionCard>

                  {nativeApp && (
                    <SectionCard title={lang === 'en' ? 'Device & Push Status' : 'حالة الجهاز والإشعارات'}>
                       <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4">
                            <div>
                               <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Push Permission</div>
                               <div className={cn("text-sm font-bold", pushStatus.permission === 'granted' ? "text-emerald-500" : "text-amber-500")}>
                                 {pushStatus.permission || 'Checking...'}
                               </div>
                            </div>
                            <Bell className={cn("h-5 w-5", pushStatus.permission === 'granted' ? "text-emerald-500" : "text-amber-500")} />
                          </div>

                          <div className={cn("rounded-2xl bg-white/5 p-4", !profile.fcm_token && "border border-amber-500/30")}>
                             <div className="text-[10px] uppercase tracking-widest text-app-muted mb-1">Server Token Status</div>
                             <div className="text-sm font-bold text-app-text">
                               {profile.fcm_token ? (
                                 <span className="text-emerald-500">Registered on Server</span>
                               ) : (
                                 <span className="text-amber-500">Not Synced to Supabase</span>
                               )}
                             </div>
                             {pushStatus.token && (
                               <div className="mt-2 text-[9px] font-mono text-app-muted break-all">
                                 Local: {pushStatus.token.substring(0, 20)}...
                               </div>
                             )}
                          </div>

                          <button 
                            onClick={handleManualSync}
                            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-app-accent/30 bg-app-accent/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-app-accent transition-colors hover:bg-app-accent/10"
                          >
                             <RefreshCw className={cn("h-4 w-4", saving && "animate-spin")} />
                             Force Refresh Token
                          </button>
                       </div>
                    </SectionCard>
                  )}
                </div>

              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-app-card border border-white/10 rounded-[2.5rem] p-6 shadow-xl">
    <h3 className="text-xl font-bold text-app-text mb-4">{title}</h3>
    {children}
  </div>
);

const InfoBadge = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
    <div className="text-[11px] uppercase tracking-widest text-app-muted mb-2">{label}</div>
    <div className="text-sm font-semibold text-app-text flex items-center gap-2">
      <UserRound className="w-4 h-4 text-app-accent" />
      {value}
    </div>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-app-muted">
    {text}
  </div>
);
