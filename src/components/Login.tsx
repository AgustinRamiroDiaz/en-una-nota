/**
 * Login Component
 * Displays the landing page with Spotify login button
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function Login(): React.ReactElement {
  const { login } = useAuth();
  const { t } = useI18n();

  return (
    <div className="login">
      <div className="login-card nb-card">
        <h1 className="login-title" aria-label={t('appName')}>
          {t('appName').split(' ').map((word, i) => (
            <span key={i} className="login-word" aria-hidden="true">{word}</span>
          ))}
        </h1>
        <p className="login-tagline">{t('welcome')}</p>
        <button className="nb-btn nb-btn--yellow login-button" onClick={login}>
          {t('login')}
        </button>
        <p className="login-note">{t('premiumNote')}</p>
      </div>
    </div>
  );
}

export default Login;

