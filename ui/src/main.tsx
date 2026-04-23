import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './lawha';
import { LanguageProvider } from './language';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>
);
