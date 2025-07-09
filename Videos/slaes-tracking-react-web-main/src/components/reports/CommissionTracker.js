import React, { useState, useEffect } from 'react';
import { getCommissionReport } from '../../services/reportService';

const CommissionTracker = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await getCommissionReport();
      setCommissions(data);
    } catch (error) {
      console.error('Failed to load commission data', error);
    }
    setLoading(false);
  };

  const calculateCommission = (totalSales) => {
    // Example commission structure (customize based on business rules)
    if (totalSales < 10000) return totalSales * 0.05;
    if (totalSales < 50000) return totalSales * 0.07;
    return totalSales * 0.1;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Commission Tracking</h3>
      </div>
      
      <div className="card-body">
        {loading ? (
          <p>Loading commission data...</p>
        ) : commissions.length > 0 ? (
          <div className="commission-grid">
            {commissions.map((worker, index) => (
              <div className="commission-card" key={index}>
                <div className="worker-header">
                  <div className="avatar">{worker.worker.charAt(0)}</div>
                  <h4>{worker.worker}</h4>
                </div>
                
                <div className="commission-stats">
                  <div className="stat">
                    <span>Total Sales:</span>
                    <strong>{worker.total_sales} ETB</strong>
                  </div>
                  <div className="stat">
                    <span>Commissions Paid:</span>
                    <strong>{worker.commissions_paid} ETB</strong>
                  </div>
                  <div className="stat">
                    <span>Pending Commission:</span>
                    <strong className="pending">
                      {calculateCommission(worker.total_sales) - worker.commissions_paid} ETB
                    </strong>
                  </div>
                </div>
                
                <button className="btn-pay">Record Payment</button>
              </div>
            ))}
          </div>
        ) : (
          <p>No commission data available</p>
        )}
      </div>
    </div>
  );
};
export default CommissionTracker;