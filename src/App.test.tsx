import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './i18n/I18nContext';

test('renders app', () => {
  render(
    <I18nProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </I18nProvider>
  );
  // The app should render the login page initially
  const loginButton = screen.getByRole('button', { name: /login|iniciar sesión/i });
  expect(loginButton).toBeInTheDocument();
});

