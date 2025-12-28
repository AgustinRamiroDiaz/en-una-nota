/**
 * Login Component
 * Displays the landing page with Spotify login button
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../i18n/I18nContext';

function Login() {
  const { login } = useAuth();
  const { t } = useI18n();

  return (
    <div className="login-container">
      <div className="login-content">
        <h1>{t('appName')}</h1>
        <p>{t('welcome')}</p>
        <button className="login-button" onClick={login}>
          {t('login')}
        </button>
      </div>
    </div>
  );
}

export default Login;
