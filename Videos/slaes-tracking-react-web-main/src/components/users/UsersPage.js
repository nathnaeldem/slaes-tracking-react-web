import React from 'react';
import Layout from '../components/shared/Layout';
import UserList from '../components/users/UserList';
import ActivityLog from '../components/users/ActivityLog';

const UsersPage = () => {
  return (
    <Layout>
      <div className="page-header">
        <h2>User Administration</h2>
        <p>Manage team members and monitor activity</p>
      </div>
      
      <div className="grid-2col">
        <div className="grid-col">
          <div className="card">
            <h3>Team Members</h3>
            <p className="subtitle">
              Manage roles, status, and access permissions
            </p>
            <UserList />
          </div>
        </div>
        
        <div className="grid-col">
          <div className="card">
            <h3>Security Dashboard</h3>
            <p className="subtitle">
              Monitor login attempts and user activities
            </p>
            <ActivityLog />
          </div>
          
          <div className="card security-stats">
            <div className="stat-item">
              <div className="stat-value">12</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">3</div>
              <div className="stat-label">Admin Users</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">2</div>
              <div className="stat-label">Failed Logins (24h)</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}; export default UsersPage