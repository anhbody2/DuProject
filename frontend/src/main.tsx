import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
// Lexend: per-weight files cover latin + vietnamese via unicode-range.
import '@fontsource/lexend/400.css';
import '@fontsource/lexend/500.css';
import '@fontsource/lexend/700.css';
import '@fontsource/lexend/800.css';
import '@fontsource/lexend/900.css';
import 'leaflet/dist/leaflet.css';
import './styles/base.css';
import Providers from './providers';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Providers>
        <App />
      </Providers>
    </BrowserRouter>
  </StrictMode>,
);
