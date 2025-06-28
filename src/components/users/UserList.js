import React, { useState, useEffect } from 'react';
import { getUsers, updateUser, resetPassword } from '../../services/userService';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [tempPassword, setTempPassword] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleStatusChange = async (userId, isActive) => {
    await updateUser(userId, { is_active: isActive ? 1 : 0 });
    fetchUsers(); // Refresh list
  };

  const handleRoleChange = async (userId, newRole) => {
    await updateUser(userId, { role: newRole });
    fetchUsers(); // Refresh list
  };

  const handlePasswordReset = async (userId) => {
    const { data } = await resetPassword(userId);
    setTempPassword({
      userId,
      password: data.temp_password
    });
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h3>User Management</h3>
        <button className="btn-primary">+ Add User</button>
      </div>
      
      <div className="table-responsive">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    className="role-select"
                  >
                    {['admin', 'manager', 'worker'].map(role => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      checked={user.is_active} 
                      onChange={(e) => handleStatusChange(user.id, e.target.checked)}
                    />
                    <span className="slider"></span>
                  </label>
                  <span className="status-label">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    className="btn-sm warning"
                    onClick={() => handlePasswordReset(user.id)}
                  >
                    🔑 Reset
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tempPassword && (
        <div className="password-modal">
          <div className="modal-content">
            <h4>Password Reset Complete</h4>
            <p>
              Temporary password for <strong>{users.find(u => u.id === tempPassword.userId)?.username}</strong>:
            </p>
            <div className="temp-password">{tempPassword.password}</div>
            <p className="warning-text">
              This password is only shown once. Please provide it to the user.
            </p>
            <button 
              className="btn-primary"
              onClick={() => setTempPassword(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default UserList;