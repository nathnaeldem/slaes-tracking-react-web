import React from 'react';
import { useAuth } from '../auth/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const storedToken = localStorage.getItem('authToken');
  console.log(storedToken);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Welcome, {user?.name || user?.username}!</h1>
        <button className="btn-logout" onClick={logout}>
          Logout
        </button>
      </header>

      <main className="dashboard-main">
        <p>This is your secure dashboard. You can fetch and display data here.</p>
        {/* e.g. 
          <StatsPanel /> 
          <RecentActivity /> 
          <Charts /> 
        */}
      </main>
    </div>
  );
}
