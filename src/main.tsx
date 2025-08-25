// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// ✅ Provider quản lý bộ sưu tập pet (context + localStorage)
import { PetCollectionProvider } from '@/hooks/usePetCollection';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PetCollectionProvider>
      <App />
    </PetCollectionProvider>
  </React.StrictMode>
);
