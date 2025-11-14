import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// @ts-expect-error: virtual:pwa-register is a Vite PWA virtual module
import { registerSW } from 'virtual:pwa-register';

import './index.css'; // <-- PASTIKAN BARIS INI ADA

registerSW({ onNeedRefresh() {}, onOfflineReady() {} });

const rootElement = typeof document !== 'undefined' ? document.getElementById('root') : null;
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
const queryClient = new QueryClient();
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
