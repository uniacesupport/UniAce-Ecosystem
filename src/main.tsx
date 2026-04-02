import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import ErrorBoundary from './components/ErrorBoundary';

import { ThemeProvider } from './context/ThemeContext';

// Initialize theme immediately to prevent flash
console.log('Main.tsx: Initializing application...');
try {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch (e) {
  console.warn('localStorage access denied, falling back to light theme');
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registered: ', registration);
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

console.log('Main.tsx: Starting render...');

try {
  createRoot(document.getElementById('root')!).render(
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <CourseProvider>
            <App />
          </CourseProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>,
  );
  console.log('Main.tsx: Render call completed.');
} catch (e) {
  console.error('Main.tsx: Render failed:', e);
}
