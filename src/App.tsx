import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { useAuth } from './context/AuthContext';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { SidebarQuickActions } from './components/SidebarQuickActions';
import { AuthModal } from './components/AuthModal';
import { CreatePostModal } from './components/CreatePostModal';
import { CreateQuizQuestionModal } from './components/CreateQuizQuestionModal';
import { MouseParticles } from './components/MouseParticles';
import { Footer } from './components/Footer';
import { SeoMeta } from './components/SeoMeta';
import { ProtectedRoute } from './components/ProtectedRoute';

import { AcademyPage } from './pages/AcademyPage';
import { CommunityHighlightsPage } from './pages/CommunityHighlightsPage';
import { LibraryPage } from './pages/LibraryPage';
import { DailyGuidancePage } from './pages/DailyGuidancePage';
import { ArticlesPage } from './pages/ArticlesPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { VoicesPage } from './pages/VoicesPage';
import { AccountPage } from './pages/AccountPage';
import { QuizPage } from './pages/QuizPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { AdminPostApprovalsPage } from './pages/AdminPostApprovalsPage';
import { QuranReaderPage } from './pages/QuranReaderPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { ContentCategory, QuizQuestion } from './types';

import { Hero } from './components/Hero';
import { FeaturedArticles } from './components/FeaturedArticles';
import { CommunityFeed } from './components/CommunityFeed';
import { QuizSection } from './components/QuizSection';

type Language = 'en' | 'ar';
type Theme = 'dark' | 'light';

const LANGUAGE_KEY = 'app-language';
const THEME_KEY = 'app-theme';

const HomePage = ({
  lang,
  onAuthClick,
}: {
  lang: Language;
  onAuthClick: () => void;
}) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
    <Hero lang={lang} />
    <FeaturedArticles lang={lang} />
    <QuizSection lang={lang} onAuthClick={onAuthClick} />
    <CommunityFeed lang={lang} onAuthClick={onAuthClick} />
  </motion.div>
);

const getStoredLanguage = (): Language => {
  const value = window.localStorage.getItem(LANGUAGE_KEY);
  return value === 'ar' ? 'ar' : 'en';
};

const getStoredTheme = (): Theme => {
  const value = window.localStorage.getItem(THEME_KEY);
  return value === 'light' ? 'light' : 'dark';
};

function App() {
  const { profile, loading, initialized } = useAuth();
  const [lang, setLang] = useState<Language>(() => getStoredLanguage());
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCreateQuizModalOpen, setIsCreateQuizModalOpen] = useState(false);
  const [postModalCategory, setPostModalCategory] = useState<ContentCategory | null>(null);
  const location = useLocation();

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
    const handleOpenCreatePost = () => setIsCreatePostModalOpen(true);
    const handleOpenCreateQuiz = () => setIsCreateQuizModalOpen(true);
    window.addEventListener('open-create-post', handleOpenCreatePost as EventListener);
    window.addEventListener('open-create-quiz', handleOpenCreateQuiz as EventListener);

    return () => {
      window.removeEventListener('open-create-post', handleOpenCreatePost as EventListener);
      window.removeEventListener('open-create-quiz', handleOpenCreateQuiz as EventListener);
    };
  }, []);

  const openCreatePost = (category?: ContentCategory) => {
    setPostModalCategory(category || null);
    setIsCreatePostModalOpen(true);
  };

  return (
    <div className={cn('min-h-screen bg-app-bg pb-24 text-app-text selection:bg-app-accent selection:text-app-bg md:pb-0')}>
      <SeoMeta pathname={location.pathname} lang={lang} />
      <MouseParticles language={lang} />
      <SidebarQuickActions
        lang={lang}
        onCreatePost={openCreatePost}
        onCreateQuiz={() => setIsCreateQuizModalOpen(true)}
      />

      <Navbar
        lang={lang}
        theme={theme}
        setLang={setLang}
        toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onCreatePost={openCreatePost}
      />

      <BottomNav lang={lang} onAuthClick={() => setIsAuthModalOpen(true)} />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route index element={<HomePage lang={lang} onAuthClick={() => setIsAuthModalOpen(true)} />} />
          <Route path="/academy" element={<AcademyPage lang={lang} />} />
          <Route path="/academy/:postId/:slug?" element={<PostDetailPage lang={lang} />} />
          <Route path="/community" element={<CommunityHighlightsPage lang={lang} />} />
          <Route path="/community/:postId/:slug?" element={<PostDetailPage lang={lang} />} />
          <Route path="/library" element={<LibraryPage lang={lang} />} />
          <Route path="/library/:postId/:slug?" element={<PostDetailPage lang={lang} />} />
          <Route path="/articles" element={<ArticlesPage lang={lang} />} />
          <Route path="/articles/:postId/:slug?" element={<PostDetailPage lang={lang} />} />
          <Route path="/quran" element={<QuranReaderPage lang={lang} />} />
          <Route path="/guidance" element={<DailyGuidancePage lang={lang} />} />
          <Route path="/voices" element={<VoicesPage lang={lang} />} />
          <Route path="/quiz" element={<QuizPage lang={lang} />} />
          <Route path="/privacy" element={<PrivacyPolicyPage lang={lang} />} />
          <Route path="/terms" element={<TermsOfServicePage lang={lang} />} />
          <Route path="/reminders" element={<QuranReaderPage lang={lang} />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute allow={Boolean(profile)} loading={loading || !initialized}>
                <AccountPage lang={lang} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allow={profile?.role === 'admin'} loading={loading || !initialized}>
                <AdminDashboard lang={lang} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/posts"
            element={
              <ProtectedRoute allow={profile?.role === 'admin'} loading={loading || !initialized}>
                <AdminPostApprovalsPage lang={lang} />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AnimatePresence>

      <Footer lang={lang} />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        lang={lang}
        onSuccess={() => {
          setIsAuthModalOpen(false);
        }}
      />

      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => {
          setIsCreatePostModalOpen(false);
          setPostModalCategory(null);
        }}
        lang={lang}
        categoryFilter="sidebar"
        modalTitle="Create Sidebar Post"
        modalSubtitle="Publish text, PDF, video, image, or audio into sidebar categories only."
        initialCategorySlug={postModalCategory}
        onSuccess={() => {
          setIsCreatePostModalOpen(false);
          setPostModalCategory(null);
          window.dispatchEvent(new Event('posts-updated'));
        }}
      />

      <CreateQuizQuestionModal
        isOpen={isCreateQuizModalOpen}
        onClose={() => setIsCreateQuizModalOpen(false)}
        lang={lang}
        onSuccess={(_newQuestion: QuizQuestion) => {
          setIsCreateQuizModalOpen(false);
          window.dispatchEvent(new Event('quiz-updated'));
        }}
      />
    </div>
  );
}

export default App;
