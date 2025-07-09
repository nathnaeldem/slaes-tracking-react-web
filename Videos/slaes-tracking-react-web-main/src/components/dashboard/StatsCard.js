import React from 'react';

const StatsCard = ({ title, value, icon, trend, description }) => {
  return (
    <div className="stats-card">
      <div className="card-icon">{icon}</div>
      <div className="card-content">
        <h3>{title}</h3>
        <div className="card-value">{value}</div>
        {trend && (
          <div className={`card-trend ${trend.type}`}>
            <span className="trend-icon">
              {trend.type === 'up' ? '↑' : '↓'}
            </span>
            {trend.value}
          </div>
        )}
        {description && (
          <div className="card-description">{description}</div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;