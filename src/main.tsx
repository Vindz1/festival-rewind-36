import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App';
// Thème Vinyl AVANT index.css : les classes utilitaires Tailwind gardent la priorité
import './styles/vinyl-theme.css';
import './index.css';
import './styles/mobile.css';

// Garde-fou historique
(window as any).ReactDOM = ReactDOM;

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
