import React, { useState, useEffect } from 'react';
import { Line, Pie } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import DatePicker from 'react-datepicker';
import { useAuth } from '../auth/AuthContext';
import api from '../services/api2';
import 'react-datepicker/dist/react-datepicker.css';
import './ReportsPage.css';

// Register Chart.js components
Chart.register(...registerables);

const ReportsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [bankDeposits, setBankDeposits] = useState([]);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('', {}, {
        params: {
          action: 'getAnalyticsAndReports',
          start_date: formatDate(startDate),
          end_date: formatDate(endDate)
        }
      });

      if (response.data.success) {
        setReportData(response.data);
        setBankDeposits(response.data.bank_deposits || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch report');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  const formatCurrency = (amount) => {
    return `ETB ${Number(amount).toFixed(2)}`;
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const chartConfig = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const renderLineChart = () => {
    if (!reportData?.daily_summary || reportData.daily_summary.length === 0) {
      return null;
    }

    const data = {
      labels: reportData.daily_summary.map(d => new Date(d.date).getDate()),
      datasets: [
        {
          label: 'Sales',
          data: reportData.daily_summary.map(d => Number(d.sales)),
          borderColor: 'rgb(0, 184, 148)',
          backgroundColor: 'rgba(0, 184, 148, 0.5)',
        },
        {
          label: 'Expenses',
          data: reportData.daily_summary.map(d => Number(d.expenses)),
          borderColor: 'rgb(225, 112, 85)',
          backgroundColor: 'rgba(225, 112, 85, 0.5)',
        },
      ],
    };

    return (
      <div className="card">
        <div className="card-header">
          <h3>Sales vs Expenses Trend</h3>
        </div>
        <div className="chart-container">
          <Line data={data} options={chartConfig} />
        </div>
      </div>
    );
  };

  const renderPieChart = (title, chartData, colors) => {
    if (!chartData || Object.keys(chartData).length === 0) {
      return null;
    }

    const data = {
      labels: Object.keys(chartData),
      datasets: [
        {
          label: title,
          data: Object.values(chartData).map(Number),
          backgroundColor: colors,
        }
      ],
    };

    return (
      <div className="card">
        <div className="card-header">
          <h3>{title}</h3>
        </div>
        <div className="chart-container">
          <Pie data={data} options={chartConfig} />
        </div>
        <div className="legend-container">
          {Object.entries(chartData).map(([name, value], index) => (
            <div key={name} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: colors[index] }}
              ></div>
              <span>{name}: </span>
              <strong>{formatCurrency(value)}</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSummaryCard = (title, value, color = '#2d3436') => (
    <div className="summary-card">
      <div className="summary-title">{title}</div>
      <div className="summary-value" style={{ color }}>{formatCurrency(value)}</div>
    </div>
  );

  return (
    <div className="reports-container">
      <div className="page-header">
        <h2>Financial Analytics Report</h2>
      </div>

      {/* Date Range Selector */}
      <div className="date-range-selector">
        <div className="date-picker-group">
          <label>From:</label>
          <DatePicker
            selected={startDate}
            onChange={date => setStartDate(date)}
            dateFormat="yyyy-MM-dd"
          />
        </div>
        
        <div className="date-picker-group">
          <label>To:</label>
          <DatePicker
            selected={endDate}
            onChange={date => setEndDate(date)}
            dateFormat="yyyy-MM-dd"
            minDate={startDate}
          />
        </div>
        
        <button className="btn refresh-btn" onClick={fetchReport}>
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Generating report...</p>
        </div>
      )}

      {/* Error Message */}
      {error && !loading && (
        <div className="alert alert-danger">
          {error}
          <button className="btn retry-btn" onClick={fetchReport}>
            Retry
          </button>
        </div>
      )}

      {/* Report Content */}
      {reportData && !loading && !error && (
        <div className="report-content">
          {/* Date Range Info */}
          <div className="date-range-info">
            Report Period: {new Date(reportData.start_date).toLocaleDateString()} to {new Date(reportData.end_date).toLocaleDateString()}
          </div>
          
          {/* Financial Summary */}
          <div className="card">
            <div className="card-header">
              <h3>Financial Summary</h3>
            </div>
            <div className="summary-container">
              {renderSummaryCard('Total Sales', reportData.summary.total_sales)}
              {renderSummaryCard('Total Expenses', reportData.summary.total_expenses, '#e74c3c')}
              {renderSummaryCard(
                'Net Income', 
                reportData.summary.net_income, 
                reportData.summary.net_income >= 0 ? '#27ae60' : '#e74c3c'
              )}
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="charts-grid">
            {renderLineChart()}
            {renderPieChart(
              "Sales by Category", 
              reportData.summary.category_sales, 
              ['#00b894', '#00cec9', '#55efc4', '#81ecec', '#74b9ff']
            )}
            {renderPieChart(
              "Expenses by Category", 
              reportData.summary.expense_categories, 
              ['#d63031', '#e17055', '#ff7675', '#fab1a0', '#fd79a8']
            )}
          </div>
          
          {/* Cash and Bank Balances */}
          <div className="card">
            <div className="card-header">
              <h3>Cash & Bank Balances</h3>
            </div>
            <div className="balances-container">
              <div className="balance-row">
                <span className="balance-label">Cash Balance:</span>
                <span className="balance-value" style={{ 
                  color: reportData.summary.cash_balance >= 0 ? '#27ae60' : '#e74c3c' 
                }}>
                  {formatCurrency(reportData.summary.cash_balance)}
                </span>
              </div>
              
              <h4 className="sub-section-title">Bank Balances</h4>
              {Object.entries(reportData.summary.bank_balances).map(([bank, balance]) => (
                <div key={bank} className="balance-row">
                  <span className="bank-name">{bank}</span>
                  <span className="bank-balance" style={{ 
                    color: balance >= 0 ? '#27ae60' : '#e74c3c' 
                  }}>
                    {formatCurrency(balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Sales Transactions */}
          <div className="card">
            <div className="card-header">
              <h3>Sales Transactions</h3>
              <span className="count-badge">{reportData.sales.length} transactions</span>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Payment Method</th>
                    <th>Unpaid</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.sales.map((item, index) => (
                    <tr key={`${item.transaction_id}_${index}`}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.quantity * item.unit_price)}</td>
                      <td>{item.payment_method} {item.bank_name ? `(${item.bank_name})` : ''}</td>
                      <td>{item.item_unpaid > 0 ? formatCurrency(item.item_unpaid) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Expenses */}
          <div className="card">
            <div className="card-header">
              <h3>Expenses</h3>
              <span className="count-badge">{reportData.expenses.length} records</span>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Reason</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Payment Method</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.expenses.map(item => (
                    <tr key={`${item.type}_${item.id}`}>
                      <td>{item.reason}</td>
                      <td>{item.type === 'spending' ? 'Expense' : 'Order'}</td>
                      <td>{formatCurrency(item.amount)}</td>
                      <td>{item.payment_method} {item.bank_name ? `(${item.bank_name})` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Bank Deposits */}
          {bankDeposits && bankDeposits.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3>Bank Deposits</h3>
                <span className="count-badge">{bankDeposits.length} records</span>
              </div>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Bank Name</th>
                      <th>Amount</th>
                      <th>Reference #</th>
                      <th>Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankDeposits.map((deposit, index) => (
                      <tr key={index}>
                        <td>{new Date(deposit.deposit_date).toLocaleDateString()}</td>
                        <td>{deposit.bank_name}</td>
                        <td>{formatCurrency(deposit.amount)}</td>
                        <td>{deposit.reference_number}</td>
                        <td>{deposit.comment}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;