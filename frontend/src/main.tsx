import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Logging detallado para debugging en producción
console.log('=== APPLICATION STARTUP DEBUG ===');
console.log('Timestamp:', new Date().toISOString());
console.log('Environment variables:', {
  NODE_ENV: import.meta.env.MODE,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  BASE_URL: import.meta.env.BASE_URL,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});
console.log('Window location:', {
  href: window.location.href,
  origin: window.location.origin,
  pathname: window.location.pathname,
  search: window.location.search,
  hash: window.location.hash
});
console.log('User Agent:', navigator.userAgent);
console.log('================================');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
