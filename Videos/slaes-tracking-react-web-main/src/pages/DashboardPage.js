import React, { useEffect, useState, useCallback } from 'react';
import './../components/dashboard/Dashboard.css'; // Import the new CSS
import StatsCard from '../components/dashboard/StatsCard';
import SalesChart from '../components/dashboard/SalesChart'; // Import the new chart component
import { getDashboardStats, getUnpaidTransactions, payUnpaidAmount } from '../services/reportService';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [unpaidTransactions, setUnpaidTransactions] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [showUnpaidListModal, setShowUnpaidListModal] = useState(false);

  const fetchData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchData();
    fetchUnpaidTransactions();
  }, [fetchData]);

  const fetchUnpaidTransactions = async () => {
    try {
      const response = await getUnpaidTransactions();
      if (response.data.success) {
        setUnpaidTransactions(response.data.transactions || []);
      } else {
        console.error('Failed to fetch unpaid transactions:', response.data.message);
      }
    } catch (error) {
      console.error('Error fetching unpaid transactions:', error);
    }
  };

  const handleOpenPaymentModal = (transaction) => {
    setSelectedTransaction(transaction);
    setPaymentAmount('');
    setPaymentError('');
    setShowPaymentModal(true);
  };

  const handlePayment = async (isFullPayment = false) => {
    const amountToPay = isFullPayment ? selectedTransaction.unpaid_amount : parseFloat(paymentAmount);

    if (isNaN(amountToPay) || amountToPay <= 0) {
      setPaymentError('Please enter a valid amount.');
      return;
    }
    if (amountToPay > selectedTransaction.unpaid_amount) {
      setPaymentError('Amount cannot be greater than the unpaid balance.');
      return;
    }

    try {
      const response = await payUnpaidAmount(selectedTransaction.id, amountToPay);
      if (response.data.success) {
        setShowPaymentModal(false);
        fetchUnpaidTransactions(); // Refresh the list
        fetchData(); // Refresh stats to update total unpaid
        // Also refresh dashboard stats if you want the total unpaid to update
        // fetchData(); 
      } else {
        setPaymentError(response.data.message || 'Payment failed.');
      }
    } catch (error) {
      setPaymentError('An error occurred during payment.');
      console.error('Payment error:', error);
    }
  };

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
            icon="fas fa-box-open"
          />
          <StatsCard
            title="Monthly Sales"
            value={`ETB ${stats?.monthlySales?.toFixed(2) || 0}`}
            icon="fas fa-dollar-sign"
          />
          <StatsCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon="fas fa-users"
          />
          <StatsCard
            title="Low Stock Items"
            value={stats?.lowStockItems || 0}
            icon="fas fa-exclamation-triangle"
          />
          <div onClick={() => setShowUnpaidListModal(true)} style={{ cursor: 'pointer' }}>
            <StatsCard title="Total Unpaid" value={`ETB ${stats?.totalUnpaid.toFixed(2)}`} icon="fas fa-file-invoice-dollar" />
          </div>

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

      {/* Unpaid Credits List Modal */}
      {showUnpaidListModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <h3>Unpaid Credits</h3>
            <div className="unpaid-list">
              {unpaidTransactions.length > 0 ? (
                unpaidTransactions.map(tx => (
                  <div key={tx.id} className="unpaid-item">
                    <div className="item-details">
                      <span className="customer-name">{tx.customer_name || 'N/A'}</span>
                      <span className="unpaid-amount">ETB {parseFloat(tx.unpaid_amount).toFixed(2)}</span>
                      <span className="transaction-date">{new Date(tx.transaction_date).toLocaleDateString()}</span>
                    </div>
                    <div className="item-actions">
                      <button onClick={() => { setShowUnpaidListModal(false); handleOpenPaymentModal(tx); }}>Pay</button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No unpaid credits found.</p>
              )}
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowUnpaidListModal(false)} className="cancel-btn">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Pay Credit for {selectedTransaction.customer_name}</h3>
            <p>Unpaid Amount: ETB {parseFloat(selectedTransaction.unpaid_amount).toFixed(2)}</p>
            <input
              type="number"
              placeholder="Enter amount to pay"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              min="0"
              step="0.01"
            />
            {paymentError && <p className="error-message">{paymentError}</p>}
            <div className="modal-actions">
              <button onClick={() => handlePayment(true)} className="pay-full-btn">Pay Full</button>
              <button onClick={() => handlePayment(false)} className="pay-partial-btn">Pay Partial</button>
              <button onClick={() => setShowPaymentModal(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;