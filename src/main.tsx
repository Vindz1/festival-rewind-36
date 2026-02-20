import React from "react";
import ReactDOM from "react-dom"; // Import classique pour le bouclier global
import { createRoot } from "react-dom/client"; // Import moderne pour React 18
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { preventMusicTranslation } from './utils/preventTranslation';

// 🛡️ LE BOUCLIER : On expose ReactDOM globalement pour les librairies tierces
(window as any).ReactDOM = ReactDOM;

// Active la protection de traduction
preventMusicTranslation();

// Un seul rendu propre de l'application
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
