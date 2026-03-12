import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { SidebarQuickActions } from './SidebarQuickActions';
import { MouseParticles } from './MouseParticles';

interface LayoutProps {
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onAuthClick: () => void;
  onCreatePost: () => void;
  onCreateQuiz?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  lang,
  setLang,
  theme,
  toggleTheme,
  onAuthClick,
  onCreatePost,
  onCreateQuiz
}) => {
  return (
    <div className={theme}>
      <MouseParticles language={lang} />
      <Navbar 
        lang={lang} 
        setLang={setLang} 
        theme={theme} 
        toggleTheme={toggleTheme}
        onAuthClick={onAuthClick}
        onCreatePost={onCreatePost}
      />
      
      <Outlet />
      
      <Footer lang={lang} />
      <SidebarQuickActions lang={lang} onCreatePost={onCreatePost} onCreateQuiz={onCreateQuiz || (() => {})} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .mask-gradient-en {
          mask-image: linear-gradient(to left, black, transparent);
        }
        .mask-gradient-ar {
          mask-image: linear-gradient(to right, black, transparent);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};
