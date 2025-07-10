import React, { useState, useEffect, useMemo } from 'react';
import { getAllTransactions } from '../services/transactionService';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './TransactionsPage.css';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'descending' });
  const [filter, setFilter] = useState('all');

  const formatDate = (date) => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getAllTransactions(formatDate(startDate), formatDate(endDate));
        if (response.success) {
          const sales = response.sales?.map(s => ({
            id: `sale-${s.transaction_id}-${s.product_id}`,
            date: s.transaction_date,
            type: 'Sale',
            description: s.product_name,
            amount: s.quantity * s.unit_price,
          })) || [];

          const expenses = response.expenses?.map(e => ({
            id: `expense-${e.id}`,
            date: e.transaction_date,
            type: 'Expense',
            description: e.reason,
            amount: -Math.abs(e.amount),
          })) || [];

          const deposits = response.bank_deposits?.map(d => ({
            id: `deposit-${d.id}`,
            date: d.deposit_date,
            type: 'Deposit',
            description: `Deposit to ${d.bank_name}`,
            amount: d.amount,
          })) || [];

          setTransactions([...sales, ...expenses, ...deposits]);
        } else {
          throw new Error(response.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        setError(err.message || 'Failed to load transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [startDate, endDate]);

  const sortedTransactions = useMemo(() => {
    let sortableItems = [...transactions];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [transactions, sortConfig]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return sortedTransactions;
    return sortedTransactions.filter(t => t.type.toLowerCase() === filter);
  }, [sortedTransactions, filter]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortClassName = (name) => {
    if (!sortConfig) return '';
    return sortConfig.key === name ? sortConfig.direction : '';
  };

  const formatCurrency = (amount) => {
    const value = Number(amount);
    const colorClass = value >= 0 ? 'text-success' : 'text-danger';
    return <span className={colorClass}>{`ETB ${value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}</span>;
  };

  return (
    <div className="transactions-page-container">
      <div className="card shadow-sm">
        <div className="card-body">
          <h2 className="card-title">All Transactions</h2>
          <div className="controls-container">
            <div className="date-pickers">
              <DatePicker selected={startDate} onChange={date => setStartDate(date)} className="form-control" />
              <DatePicker selected={endDate} onChange={date => setEndDate(date)} className="form-control" />
            </div>
            <div className="filter-buttons">
              <button className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setFilter('all')}>All</button>
              <button className={`btn ${filter === 'sale' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => setFilter('sale')}>Sales</button>
              <button className={`btn ${filter === 'expense' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => setFilter('expense')}>Expenses</button>
              <button className={`btn ${filter === 'deposit' ? 'btn-info' : 'btn-outline-info'}`} onClick={() => setFilter('deposit')}>Deposits</button>
            </div>
          </div>

          {loading && <div className="text-center"><div className="spinner-border" /></div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && !error && (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('date')} className={`sortable ${getSortClassName('date')}`}>Date</th>
                    <th onClick={() => requestSort('type')} className={`sortable ${getSortClassName('type')}`}>Type</th>
                    <th onClick={() => requestSort('description')} className={`sortable ${getSortClassName('description')}`}>Description</th>
                    <th onClick={() => requestSort('amount')} className={`sortable ${getSortClassName('amount')}`}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td>{new Date(t.date).toLocaleDateString()}</td>
                      <td><span className={`badge bg-${t.type.toLowerCase()}`}>{t.type}</span></td>
                      <td>{t.description}</td>
                      <td>{formatCurrency(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
