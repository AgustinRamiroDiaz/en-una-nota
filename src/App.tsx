import React, { useEffect, useRef } from 'react';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App(): React.ReactElement {
  const { isAuthenticated, isLoading, handleCallback } = useAuth();
  const hasHandledCallback = useRef(false);

  useEffect(() => {
    // Check for OAuth callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    // Only handle callback once (prevents double-call in StrictMode)
    if (code && !hasHandledCallback.current) {
      hasHandledCallback.current = true;
      handleCallback(code);
    }
  }, [handleCallback]);

  if (isLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading">Authenticating...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? <Dashboard /> : <Login />}
    </div>
  );
}

export default App;

