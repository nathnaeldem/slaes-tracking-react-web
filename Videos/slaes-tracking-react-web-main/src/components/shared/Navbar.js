import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

const Navbar = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
    { path: '/products', icon: 'inventory_2', label: 'Products' },
    { path: '/reports', icon: 'analytics', label: 'Reports' },
    { path: '/SalesPage', icon: 'sell', label: 'Sales Page' },
    { path: '/record-spending', icon: 'payments', label: 'Record Spending' },
    { path: '/bank-deposit', icon: 'account_balance', label: 'Bank Deposit' },
    { path: '/transactions', icon: 'receipt_long', label: 'Transactions' },
    { path: '/credit-register', icon: 'credit_card', label: 'Credit Register' },
  { path: '/new-transactions', icon: 'receipt_long', label: 'New Transactions' },
    
  ];

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <div className="org-logo">GS</div>
        <h2>GreenSecure</h2>
        <p>Business Portal</p>
      </div>
      
      <div className="nav-items">
        {navItems.map(item => (
          <Link 
            to={item.path} 
            key={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="material-icons">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
      
      <div className="user-card">
        <div className="user-avatar">
          {user?.username.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <strong>{user?.username}</strong>
          <span>Administrator</span>
        </div>
        <button 
          className="logout-btn"
          onClick={logout}
          title="Logout"
        >
          <span className="material-icons">logout</span>
        </button>
      </div>
    </nav>
  );
}; export default Navbar;