import React from 'react';

const SummaryCard = ({ title, value, color }) => {
  const cardStyle = {
    borderLeft: `5px solid ${color || '#2d3436'}`,
  };

  return (
    <div className="col-md-4 mb-4">
      <div className="card h-100 shadow-sm" style={cardStyle}>
        <div className="card-body">
          <h5 className="card-title text-muted text-uppercase">{title}</h5>
          <h3 className="card-text fw-bold">{value}</h3>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
