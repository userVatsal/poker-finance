import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App';
import { initAnalytics } from './analytics/googleAnalytics';
import './styles/theme.css';

initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {/* Cookie-free page-view analytics. Only reports when deployed on Vercel. */}
    <Analytics />
  </StrictMode>,
);
