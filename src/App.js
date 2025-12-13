import React, { useEffect } from 'react';
import './App.css';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const { isAuthenticated, isLoading, handleCallback } = useAuth();

  useEffect(() => {
    // Check for OAuth callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
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
