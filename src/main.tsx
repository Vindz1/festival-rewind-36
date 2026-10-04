import React from 'react';
import ReactDOM from 'react-dom';
import { createRoot } from 'react-dom/client';
import App from './App';
// Thème Vinyl AVANT index.css : les classes utilitaires Tailwind gardent la priorité
import './styles/vinyl-theme.css';
import './index.css';
import { preventMusicTranslation } from './utils/preventTranslation';

// Garde-fou historique (traduction automatique)
(window as any).ReactDOM = ReactDOM;

// Protège les noms de groupes de la traduction automatique
preventMusicTranslation();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
