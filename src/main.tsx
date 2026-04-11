import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useSettingsStore, applyColorMode } from './store/settingsStore';

// Apply color mode on initial load
applyColorMode(useSettingsStore.getState().colorMode);

// Re-apply when system preference changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  applyColorMode(useSettingsStore.getState().colorMode);
});

// Re-apply when store changes
useSettingsStore.subscribe((s) => applyColorMode(s.colorMode));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
