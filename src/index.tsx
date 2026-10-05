import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './i18n/I18nContext';

// localStorage is per origin, so the PKCE verifier saved before the Spotify
// redirect is only readable if login starts on the redirect URI's origin
// (e.g. 127.0.0.1, not localhost).
const redirectUri = process.env.REACT_APP_REDIRECT_URI;
const redirectOrigin = redirectUri ? new URL(redirectUri).origin : window.location.origin;
if (window.location.origin !== redirectOrigin) {
  const { pathname, search, hash } = window.location;
  window.location.replace(redirectOrigin + pathname + search + hash);
} else {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

