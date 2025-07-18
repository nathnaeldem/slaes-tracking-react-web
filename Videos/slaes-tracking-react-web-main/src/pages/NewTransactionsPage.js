import React, { useState, useEffect } from 'react';
import { getNewTransactions, payTransaction } from '../services/salesService';
import { useAuth } from '../auth/AuthContext';
import './NewTransactionsPage.css';

const NewTransactionsPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [paidAmounts, setPaidAmounts] = useState({});

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getNewTransactions();
      if (response.success) {
        setTransactions(response.transactions);
      } else {
        throw new Error(response.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(`Failed to load transactions: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => `ETB ${Number(amount).toFixed(2)}`;

  const calculateTransactionTotal = (items) =>
    items.reduce((total, item) => total + item.quantity * item.unit_price, 0);

  const updatePaidAmount = (transactionId, text) => {
    setPaidAmounts((prev) => ({ ...prev, [transactionId]: text }));
  };

  const handlePay = async (transactionId) => {
    const paidAmount = paidAmounts[transactionId];
    if (!paidAmount || isNaN(paidAmount) || parseFloat(paidAmount) <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    try {
      const response = await payTransaction(transactionId, parseFloat(paidAmount));
      if (response.success) {
        alert('Payment successful!');
        fetchTransactions(); // Refresh the list
      } else {
        throw new Error(response.message || 'Failed to process payment');
      }
    } catch (err) {
      alert(`Payment failed: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchTransactions}>Retry</button>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="transaction-card">
          <h4>{transaction.customer_name || 'No name'}</h4>
          <p className="date">{formatDate(transaction.transaction_date)}</p>
          <p>Payment: {transaction.payment_method}</p>
          <p>Total: {formatCurrency(calculateTransactionTotal(transaction.items))}</p>
          {transaction.unpaid_amount > 0 && (
            <p className="unpaid">Unpaid: {formatCurrency(transaction.unpaid_amount)}</p>
          )}
          <h5>Items:</h5>
          {transaction.items.map((item, index) => (
            <div key={index} className="item-row">
              <span>Product ID: {item.product_id}</span>
              <span>Quantity: {item.quantity}</span>
              <span>Unit Price: {formatCurrency(item.unit_price)}</span>
              <span>Total: {formatCurrency(item.quantity * item.unit_price)}</span>
            </div>
          ))}
          <input
            type="number"
            className="payment-input"
            placeholder="Enter payment amount"
            value={paidAmounts[transaction.id] || ''}
            onChange={(e) => updatePaidAmount(transaction.id, e.target.value)}
          />
          <button onClick={() => handlePay(transaction.id)}>Pay</button>
        </div>
      ))}
    </div>
  );
};

export default NewTransactionsPage;
