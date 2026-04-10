import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useDarkModeStore, applyDarkMode } from './store/darkModeStore';

// Apply dark mode on initial load
applyDarkMode(useDarkModeStore.getState().mode);

// Re-apply when system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyDarkMode(useDarkModeStore.getState().mode);
});

// Re-apply when store changes
useDarkModeStore.subscribe((s) => applyDarkMode(s.mode));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
