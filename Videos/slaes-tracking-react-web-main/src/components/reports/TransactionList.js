import React from 'react';

const TransactionList = ({ title, data, renderItem }) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h4 className="card-title">{title}</h4>
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <tbody>
              {Array.isArray(data) && data.length > 0 ? (
                data.map((item, index) => renderItem({ item, index }))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center text-muted">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TransactionList;
