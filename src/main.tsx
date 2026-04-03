import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext.tsx';
import { isNativeApp } from './lib/runtime.ts';

document.documentElement.classList.add('app-ready');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        {!isNativeApp() && <Analytics />}
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
