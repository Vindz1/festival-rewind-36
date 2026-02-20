import React from "react";
import ReactDOM from "react-dom"; 
import { createRoot } from "react-dom/client"; 
import App from "./App.tsx";
import "./index.css";
import { preventMusicTranslation } from './utils/preventTranslation';

// 🛡️ LE BOUCLIER
(window as any).ReactDOM = ReactDOM;

// Active la protection
preventMusicTranslation();

// Rendu SANS le BrowserRouter ici
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
