import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { queryClient } from './lib/queryClient.js';
import './index.css';
import App from './App.jsx';

// Apply saved zoom before first render so layout is correct from the start
const _savedZoom = localStorage.getItem('nexora-zoom');
if (_savedZoom) document.body.style.zoom = _savedZoom;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
