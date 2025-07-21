import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Sidebar({ role }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const menuItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Inventory', path: '/inventory' },
    { name: 'Billing', path: '/billing' },
    { name: 'Customers', path: '/customers' },
    { name: 'Purchase', path: '/purchase' },
    { name: 'Reports', path: '/reports' },
    { name: 'Daybook', path: '/daybook' },
    ...(role === 'admin' ? [{ name: 'Settings', path: '/settings' }] : [])
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button className="toggle-btn" onClick={toggleSidebar}>
        {isCollapsed ? '☰' : '⮜'}
      </button>
      {!isCollapsed && <h2 className="title">ERP Accounting</h2>}

      <nav>
        <ul className="menu">
          {menuItems.map(item => (
            <li key={item.path}>
              <Link to={item.path} className="menu-link">
                {isCollapsed ? item.name[0] : item.name}
              </Link>
            </li>
          ))}
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
          transition: width 0.3s ease;
        }
        .collapsed {
          width: 70px;
          padding: 20px 10px;
        }
        .toggle-btn {
          background: #4a5568;
          color: white;
          border: none;
          padding: 6px 12px;
          cursor: pointer;
          margin-bottom: 20px;
          border-radius: 4px;
          font-size: 16px;
        }
        .title {
          font-size: 20px;
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
          white-space: nowrap;
          overflow: hidden;
        }
        .menu-link:hover {
          background-color: #4a5568;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;
