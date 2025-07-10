import React, { useState } from 'react';
import { recordBankDeposit } from '../services/bankService';
import { useAuth } from '../auth/AuthContext';
import './RecordSpendingPage.css'; // Reusing the same CSS for a consistent look

const BankDepositPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    bank_name: 'CBE',
    account_number: '',
    amount: '',
    deposit_date: new Date().toISOString().split('T')[0],
    reference_number: '',
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const banks = ['CBE', 'Awash', 'Dashen', 'Abyssinia', 'Birhan', 'Telebirr'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (bank) => {
    setFormData((prev) => ({ ...prev, bank_name: bank }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const depositData = {
        ...formData,
        user_id: user.id,
        organization_id: user.organization_id,
        amount: parseFloat(formData.amount),
      };

      const response = await recordBankDeposit(depositData);

      if (response.success) {
        setSuccess('Bank deposit recorded successfully!');
        setFormData({
          bank_name: 'CBE',
          account_number: '',
          amount: '',
          deposit_date: new Date().toISOString().split('T')[0],
          reference_number: '',
          comment: '',
        });
      } else {
        throw new Error(response.message || 'Failed to record deposit.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while recording the deposit.');
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
              <h2 className="card-title text-center">Record Bank Deposit</h2>

              {error && <div className="alert alert-danger">{error}</div>}
              {success && (
                <div className="alert-success-custom">
                  <span className="material-icons">check_circle</span>
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label">Bank Name</label>
                  <div className="method-selector">
                    {banks.map((bank) => (
                      <div
                        key={bank}
                        className={`method-option ${formData.bank_name === bank ? 'selected' : ''}`}
                        onClick={() => handleBankChange(bank)}
                      >
                        {bank}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label htmlFor="account_number" className="form-label">Account Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="account_number"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleChange}
                    placeholder="Enter account number"
                  />
                </div>

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
                  <label htmlFor="deposit_date" className="form-label">Deposit Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="deposit_date"
                    name="deposit_date"
                    value={formData.deposit_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="reference_number" className="form-label">Reference Number</label>
                  <input
                    type="text"
                    className="form-control"
                    id="reference_number"
                    name="reference_number"
                    value={formData.reference_number}
                    onChange={handleChange}
                    placeholder="Enter reference number"
                  />
                </div>

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
                    {loading ? 'Recording...' : 'Record Deposit'}
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

export default BankDepositPage;
