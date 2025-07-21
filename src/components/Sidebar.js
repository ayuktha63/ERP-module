import React from 'react';
import { Link } from 'react-router-dom';

function Sidebar({ role }) {
  return (
    <div className="sidebar">
      <h2 className="title">ERP Accounting</h2>
      <nav>
        <ul className="menu">
          <li><Link to="/" className="menu-link">Dashboard</Link></li>
          <li><Link to="/inventory" className="menu-link">Inventory</Link></li>
          <li><Link to="/billing" className="menu-link">Billing</Link></li>
          <li><Link to="/customers" className="menu-link">Customers</Link></li>
          <li><Link to="/purchase" className="menu-link">Purchase</Link></li>
          <li><Link to="/reports" className="menu-link">Reports</Link></li>
          <li><Link to="/daybook" className="menu-link">Daybook</Link></li>
          {role === 'admin' && (
            <li><Link to="/settings" className="menu-link">Settings</Link></li>
          )}
        </ul>
      </nav>

      <style>{`
        .sidebar {
          width: 250px;
          background-color: #2d3748;
          color: white;
          height: 100vh;
          padding: 20px;
          box-sizing: border-box;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 24px;
        }
        .menu {
          list-style: none;
          padding: 0;
        }
        .menu li {
          margin-bottom: 8px;
        }
        .menu-link {
          display: block;
          padding: 10px 16px;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }
        .menu-link:hover {
          background-color: #4a5568;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
