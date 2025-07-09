import React, { useState, useEffect } from 'react';
import { getActivityLogs } from '../../services/userService';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    const offset = (page - 1) * itemsPerPage;
    const { data } = await getActivityLogs(itemsPerPage, offset);
    setLogs(data);
    setLoading(false);
  };

  const formatDescription = (description) => {
    // Highlight important actions
    if (description.includes('logged in')) return <span className="success">{description}</span>;
    if (description.includes('failed')) return <span className="error">{description}</span>;
    if (description.includes('added') || description.includes('created')) 
      return <span className="success">{description}</span>;
    if (description.includes('deleted') || description.includes('removed')) 
      return <span className="error">{description}</span>;
    return description;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>Activity Logs</h3>
        <div className="pagination">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            ◀
          </button>
          <span>Page {page}</span>
          <button 
            disabled={logs.length < itemsPerPage}
            onClick={() => setPage(p => p + 1)}
          >
            ▶
          </button>
        </div>
      </div>
      
      <div className="log-list">
        {loading ? (
          <p>Loading activity logs...</p>
        ) : logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className="log-item">
              <div className="log-header">
                <div className="log-type">{log.activity_type}</div>
                <div className="log-time">
                  {new Date(log.activity_time).toLocaleString()}
                </div>
                <div className="log-user">{log.user_id ? `User#${log.user_id}` : 'System'}</div>
              </div>
              <div className="log-description">
                {formatDescription(log.description)}
              </div>
              <div className="log-ip">{log.ip_address}</div>
            </div>
          ))
        ) : (
          <p>No activity logs found</p>
        )}
      </div>
    </div>
  );
};
export default ActivityLog;