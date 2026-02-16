import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { preventMusicTranslation } from './utils/preventTranslation';

createRoot(document.getElementById("root")!).render(<App />);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Active la protection
preventMusicTranslation();
