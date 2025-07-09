import React, { useEffect, useState } from 'react';

import StatsCard from '../components/dashboard/StatsCard';
import { getDashboardStats } from '../services/reportService';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Temporary RecentActivity component
  const RecentActivity = ({ activities }) => (
    <div className="recent-activity">
      <h3>Recent Activity</h3>
      {activities?.length > 0 ? (
        <ul>
          {activities.map((activity, index) => (
            <li key={index}>
              <strong>{activity.activity_type}</strong>: {activity.description}
            </li>
          ))}
        </ul>
      ) : (
        <p>No recent activity</p>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard Overview</h2>
        <p>Key metrics and business insights</p>
      </div>
      
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          <StatsCard 
            title="Total Products" 
            value={stats?.totalProducts || 0} 
            icon="📦"
          />
          <StatsCard 
            title="Monthly Sales" 
            value={`ETB ${stats?.monthlySales || 0}`} 
            icon="💰"
          />
          <StatsCard 
            title="Active Users" 
            value={stats?.activeUsers || 0} 
            icon="👥"
          />
          <StatsCard 
            title="Low Stock Items" 
            value={stats?.lowStockItems || 0} 
            icon="⚠️"
          />
          
          <div className="recent-activity-section">
            <RecentActivity activities={stats?.recentActivities || []} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;