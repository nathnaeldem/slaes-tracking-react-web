import React, { useState } from 'react';
import { recordSpending } from '../services/expenseService';
import { useAuth } from '../auth/AuthContext';
import './RecordSpendingPage.css';

const RecordSpendingPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    category: 'purchase',
    reason: '',
    comment: '',
    payment_method: 'cash',
    bank_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const categories = [
    { label: 'Purchase', value: 'purchase' },
    { label: 'Logistics', value: 'logistics' },
    { label: 'Consumption', value: 'consumption' },
  ];

  const banks = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!formData.reason.trim()) {
      setError('Please enter a reason for the spending.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const spendingData = {
        ...formData,
        user_id: user.id,
        amount: parseFloat(formData.amount),
        bank_name: formData.payment_method === 'bank' ? formData.bank_name : null,
      };

      const response = await recordSpending(spendingData);

      if (response.success) {
        setSuccess('Spending recorded successfully!');
        setFormData({
          amount: '',
          category: 'purchase',
          reason: '',
          comment: '',
          payment_method: 'cash',
          bank_name: '',
        });
      } else {
        throw new Error(response.message || 'Failed to record spending.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while recording spending.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spending-page-container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card spending-form-card">
            <div className="card-body">
              <h2 className="card-title text-center">Record Spending</h2>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && (
                <div className="alert-success-custom">
                  <span className="material-icons">check_circle</span>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="amount" className="form-label">Amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="amount"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="reason" className="form-label">Reason</label>
                  <input
                    type="text"
                    className="form-control"
                    id="reason"
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Reason for spending"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="category" className="form-label">Category</label>
                  <select
                    className="form-select"
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Payment Method</label>
                  <div className="method-selector">
                    <div
                      className={`method-option ${formData.payment_method === 'cash' ? 'selected' : ''}`}
                      onClick={() => handleChange({ target: { name: 'payment_method', value: 'cash' } })}
                    >
                      Cash
                    </div>
                    <div
                      className={`method-option ${formData.payment_method === 'bank' ? 'selected' : ''}`}
                      onClick={() => handleChange({ target: { name: 'payment_method', value: 'bank' } })}
                    >
                      Bank
                    </div>
                  </div>
                </div>

                {formData.payment_method === 'bank' && (
                  <div className="mb-3">
                    <label className="form-label">Select Bank</label>
                    <div className="method-selector">
                      {banks.map((bank) => (
                        <div
                          key={bank}
                          className={`method-option ${formData.bank_name === bank ? 'selected' : ''}`}
                          onClick={() => handleChange({ target: { name: 'bank_name', value: bank } })}
                        >
                          {bank}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="comment" className="form-label">Comment (Optional)</label>
                  <textarea
                    className="form-control"
                    id="comment"
                    name="comment"
                    rows="3"
                    value={formData.comment}
                    onChange={handleChange}
                    placeholder="Add any additional comments here"
                  ></textarea>
                </div>

                <div className="d-grid">
                  <button type="submit" className="btn btn-primary submit-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Recording...
                      </>
                    ) : (
                      'Record Spending'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordSpendingPage;
