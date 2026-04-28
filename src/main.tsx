import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import 'katex/dist/katex.min.css';
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

  // Capture referral code from URL if present
  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');
  if (refCode) {
    if (sessionStorage.getItem('ref_code') !== refCode) {
      sessionStorage.setItem('ref_code', refCode);
      // Blindly increment clicks
      import('./firebase').then(({ db }) => {
        import('firebase/firestore').then(({ doc, updateDoc, increment }) => {
          updateDoc(doc(db, 'affiliates', refCode), { clicks: increment(1) }).catch(() => {});
        });
      });
    }
  }
} catch (e) {
  console.warn('Storage access denied', e);
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
