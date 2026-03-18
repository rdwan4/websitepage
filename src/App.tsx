import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { App as CapacitorApp } from '@capacitor/app';
import { cn } from './lib/utils';
import { useAuth } from './context/AuthContext';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { LocationPermissionGate } from './components/LocationPermissionGate';


import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SidebarQuickActions } from './components/SidebarQuickActions';
import { MouseParticles } from './components/MouseParticles';
import { Footer } from './components/Footer';
import { SeoMeta } from './components/SeoMeta';
import { ProtectedRoute } from './components/ProtectedRoute';

import { ContentCategory, QuizQuestion } from './types';
import { isNativeApp } from './lib/runtime';
import { prayerSettingsService } from './services/prayerSettingsService';
import { prayerNotificationService } from './services/prayerNotificationService';
import { offlineReminderService } from './services/offlineReminderService';
import { broadcastNotificationService } from './services/broadcastNotificationService';
import { computePrayerTimesAsync, getManualLocation } from './lib/prayer';

const PrayerTimePage = lazy(() => import('./pages/PrayerTimePage').then((module) => ({ default: module.PrayerTimePage })));
const PrayerSettingsPage = lazy(() => import('./pages/PrayerSettingsPage').then((module) => ({ default: module.PrayerSettingsPage })));
const CommunityHighlightsPage = lazy(() => import('./pages/CommunityHighlightsPage').then((module) => ({ default: module.CommunityHighlightsPage })));

const DailyGuidancePage = lazy(() => import('./pages/DailyGuidancePage').then((module) => ({ default: module.DailyGuidancePage })));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage').then((module) => ({ default: module.ArticlesPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const VoicesPage = lazy(() => import('./pages/VoicesPage').then((module) => ({ default: module.VoicesPage })));
const AccountPage = lazy(() => import('./pages/AccountPage').then((module) => ({ default: module.AccountPage })));
const QuizPage = lazy(() => import('./pages/QuizPage').then((module) => ({ default: module.QuizPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then((module) => ({ default: module.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage').then((module) => ({ default: module.TermsOfServicePage })));
const AdminPostApprovalsPage = lazy(() => import('./pages/AdminPostApprovalsPage').then((module) => ({ default: module.AdminPostApprovalsPage })));
const QuranReaderPage = lazy(() => import('./pages/QuranReaderPage').then((module) => ({ default: module.QuranReaderPage })));
const PostDetailPage = lazy(() => import('./pages/PostDetailPage').then((module) => ({ default: module.PostDetailPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })));

const Hero = lazy(() => import('./components/Hero').then((module) => ({ default: module.Hero })));
const FeaturedArticles = lazy(() => import('./components/FeaturedArticles').then((module) => ({ default: module.FeaturedArticles })));
const CommunityFeed = lazy(() => import('./components/CommunityFeed').then((module) => ({ default: module.CommunityFeed })));
const QuizSection = lazy(() => import('./components/QuizSection').then((module) => ({ default: module.QuizSection })));
const AuthModal = lazy(() => import('./components/AuthModal').then((module) => ({ default: module.AuthModal })));
const CreatePostModal = lazy(() => import('./components/CreatePostModal').then(m => ({ default: m.CreatePostModal })));
import { CategoryFilterMode } from './components/CreatePostModal';
const CreateQuizQuestionModal = lazy(() => import('./components/CreateQuizQuestionModal').then((module) => ({ default: module.CreateQuizQuestionModal })));

const RouteLoader = ({ lang = 'en' }: { lang?: Language }) => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-app-card/70 px-5 py-3 text-sm text-app-muted backdrop-blur-md">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-app-accent/30 border-t-app-accent" />
      {lang === 'ar' ? 'جاري التحميل...' : 'Loading...'}
    </div>
  </div>
);

type Language = 'en' | 'ar';
type Themes = 'dark' | 'light';

const LANGUAGE_KEY = 'app-language';
const THEME_KEY = 'app-theme';

function App() {
  const { profile, loading, initialized } = useAuth();
  const [lang, setLang] = useState<Language>(() => (window.localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'ar'));
  const [theme, setTheme] = useState<Themes>(() => (window.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'));
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
  const [postModalCategory, setPostModalCategory] = useState<ContentCategory | string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const startupRef = useRef(false);

  useEffect(() => {
    if (!isNativeApp() || startupRef.current) return;
    if (location.pathname === '/') {
      startupRef.current = true;
      navigate('/prayer', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    window.localStorage.setItem(LANGUAGE_KEY, lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [location.pathname]);

  useEffect(() => {
    const sync = async () => {
      console.log('App: Starting sync process...');
      try {
        const [settings, gps] = await Promise.all([
          prayerSettingsService.getSettings(), 
          prayerSettingsService.getGpsLocation()
        ]);
        console.log('App: Settings loaded.', { locationMode: settings.locationMode, notifications: settings.notificationsEnabled });

        const activeLoc = settings.locationMode === 'gps' && gps ? gps : await getManualLocation(settings);
        console.log('App: Active location resolved:', activeLoc.label);

        const times = await computePrayerTimesAsync(new Date(), activeLoc);
        console.log('App: Prayer times computed.');

        if (settings.notificationsEnabled) {
          console.log('App: Scheduling notifications...');
          const result = await prayerNotificationService.schedulePrayerNotifications({ settings, prayerTimes: times, location: activeLoc, lang });
          console.log('App: Scheduling result:', result);
        }

        console.log('App: Initializing offline services...');
        await broadcastNotificationService.init();
        await broadcastNotificationService.syncTokenToProfile();
        await offlineReminderService.init();
        await offlineReminderService.scheduleRandom(lang);
        console.log('App: Sync complete.');
      } catch (e) { 
        console.error('App: Sync FAILED:', e); 
      }
    };

    if (isNativeApp()) {
      CapacitorApp.addListener('appStateChange', ({ isActive }) => isActive && void sync());
    }

    void sync();

    const handleUpdate = () => {
      console.log('App: Settings update event received, resyncing...');
      void sync();
    };

    window.addEventListener('prayer-settings-updated', handleUpdate);
    return () => {
      window.removeEventListener('prayer-settings-updated', handleUpdate);
    };
  }, [lang]);

  const [postModalFilter, setPostModalFilter] = useState<CategoryFilterMode>('sidebar');

  const openCreatePost = (category?: ContentCategory | string, filter: CategoryFilterMode = 'sidebar') => {
    setPostModalCategory(category || null);
    setPostModalFilter(filter);
    setIsCreatePostModalOpen(true);
  };

  const openCreateQuiz = () => setIsCreateQuizModalOpen(true);

  return (
    <AppErrorBoundary lang={lang}>
      <LocationPermissionGate />

      <div className={cn('flex flex-col min-h-screen bg-app-bg pb-24 text-app-text md:pb-0')}>
        <SeoMeta pathname={location.pathname} lang={lang} />

        <SidebarQuickActions
          lang={lang}
          onCreatePost={openCreatePost}
          onCreateQuiz={openCreateQuiz}
        />

        <Navbar
          lang={lang}
          theme={theme}
          setLang={setLang}
          toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onAuthClick={() => setIsAuthModalOpen(true)}
          onCreatePost={openCreatePost}
        />

        <BottomNav
          lang={lang}
          onAuthClick={() => setIsAuthModalOpen(true)}
        />

        <main className="flex-grow">
          <AnimatePresence mode="wait">
            <Suspense fallback={<RouteLoader lang={lang} />}>
              <Routes location={location} key={location.pathname}>
                <Route index element={<HomePage lang={lang} onAuthClick={() => setIsAuthModalOpen(true)} />} />
                <Route path="/prayer" element={<PrayerTimePage lang={lang} setLang={setLang} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />} />
                <Route path="/prayer/settings" element={<PrayerSettingsPage lang={lang} />} />
                <Route path="/community" element={<CommunityHighlightsPage lang={lang} />} />
                <Route path="/community/:postId/:slug?" element={<PostDetailPage lang={lang} />} />
                <Route path="/academy" element={<CommunityHighlightsPage lang={lang} initialCategory="academy" />} />
                <Route path="/academy/:postId/:slug?" element={<PostDetailPage lang={lang} />} />

                <Route path="/articles" element={<ArticlesPage lang={lang} />} />
                <Route path="/articles/:postId/:slug?" element={<PostDetailPage lang={lang} />} />
                <Route path="/quran" element={<QuranReaderPage lang={lang} />} />
                <Route path="/guidance" element={<DailyGuidancePage lang={lang} />} />
                <Route path="/voices" element={<VoicesPage lang={lang} />} />
                <Route path="/quiz" element={<QuizPage lang={lang} />} />
                <Route path="/privacy" element={<PrivacyPolicyPage lang={lang} />} />
                <Route path="/terms" element={<TermsOfServicePage lang={lang} />} />
                <Route path="/account" element={<ProtectedRoute allow={Boolean(profile)} loading={loading || !initialized}><AccountPage lang={lang} /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute allow={profile?.role === 'admin'} loading={loading || !initialized}><AdminDashboard lang={lang} /></ProtectedRoute>} />
                <Route path="/admin/posts" element={<ProtectedRoute allow={profile?.role === 'admin'} loading={loading || !initialized}><AdminPostApprovalsPage lang={lang} /></ProtectedRoute>} />
                <Route path="*" element={<NotFoundPage lang={lang} />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </main>

        {!isNativeApp() && <Footer lang={lang} />}

        <Suspense fallback={null}>
          {isAuthModalOpen && (
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} lang={lang} onSuccess={() => setIsAuthModalOpen(false)} />
          )}

          {isCreatePostModalOpen && (
            <CreatePostModal
              isOpen={isCreatePostModalOpen}
              onClose={() => { setIsCreatePostModalOpen(false); setPostModalCategory(null); }}
              lang={lang}
              categoryFilter={postModalFilter}
              initialCategorySlug={postModalCategory}
              onSuccess={() => { setIsCreatePostModalOpen(false); setPostModalCategory(null); window.dispatchEvent(new Event('posts-updated')); }}
            />
          )}

          {isCreateQuizModalOpen && (
            <CreateQuizQuestionModal
              isOpen={isCreateQuizModalOpen}
              onClose={() => setIsCreateQuizModalOpen(false)}
              lang={lang}
              onSuccess={() => { setIsCreateQuizModalOpen(false); window.dispatchEvent(new Event('quiz-updated')); }}
            />
          )}
        </Suspense>
      </div>
    </AppErrorBoundary>
  );
}

const HomePage = ({
  lang,
  onAuthClick,
}: {
  lang: Language;
  onAuthClick: () => void;
}) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="container mx-auto px-4 md:px-6 space-y-10 pt-10">
    <Hero lang={lang} />
    <FeaturedArticles lang={lang} />
    <QuizSection lang={lang} onAuthClick={onAuthClick} />
    <CommunityFeed lang={lang} onAuthClick={onAuthClick} />
  </motion.div>
);

export default App;