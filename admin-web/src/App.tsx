import { useEffect, useState } from 'react';
import { setAuthToken } from './api';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'));

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  function onLoggedIn(nextToken: string) {
    localStorage.setItem('admin_token', nextToken);
    setToken(nextToken);
  }

  function onLogout() {
    localStorage.removeItem('admin_token');
    setToken(null);
  }

  if (!token) {
    return <LoginPage onLoggedIn={onLoggedIn} />;
  }

  return <DashboardPage onLogout={onLogout} />;
}

export default App;
