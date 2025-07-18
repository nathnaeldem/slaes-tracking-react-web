import React, { useEffect, useState } from 'react';
import './../components/dashboard/Dashboard.css'; // Import the new CSS
import StatsCard from '../components/dashboard/StatsCard';
import SalesChart from '../components/dashboard/SalesChart'; // Import the new chart component
import { getDashboardStats } from '../services/reportService';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('daily'); // 'daily', 'weekly', 'monthly'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getDashboardStats();
        if (response.data.success) {
          setStats(response.data.stats);
          setCharts(response.data.charts);
        } else {
          console.error('API call was not successful:', response.data.message);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const RecentActivity = ({ activities }) => (
    <div className="recent-activity">
      <h3>Recent Activity</h3>
      {activities?.length > 0 ? (
        <ul>
          {activities.map((activity, index) => (
            <li key={index}>
              <strong>{activity.activity_type}</strong>: {activity.description} - 
              <small>{new Date(activity.activity_time).toLocaleString()}</small>
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
            value={`ETB ${stats?.monthlySales?.toFixed(2) || 0}`} 
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
          <StatsCard 
            title="Total Unpaid"
            value={`ETB ${stats?.totalUnpaid?.toFixed(2) || 0}`}
            icon="💸"
          />

          <div className="sales-chart-section">
            <h3>Sales Analytics</h3>
            <div className="chart-controls">
              <button onClick={() => setActiveChart('daily')} className={activeChart === 'daily' ? 'active' : ''}>Daily</button>
              <button onClick={() => setActiveChart('weekly')} className={activeChart === 'weekly' ? 'active' : ''}>Weekly</button>
              <button onClick={() => setActiveChart('monthly')} className={activeChart === 'monthly' ? 'active' : ''}>Monthly</button>
            </div>
            <SalesChart 
              chartData={charts ? charts[activeChart] : null}
              title={`${activeChart.charAt(0).toUpperCase() + activeChart.slice(1)} Sales`}
            />
          </div>
          
          <div className="recent-activity-section">
            <RecentActivity activities={stats?.recentActivities || []} />
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;