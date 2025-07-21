import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Inventory from './components/Inventory';
import Billing from './components/Billing';
import Customers from './components/Customers';
import Purchase from './components/Purchase';
import Reports from './components/Reports';
import Daybook from './components/Daybook';
import Settings from './components/Settings';
import './styles.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);

  return (
    <Router>
      <div style={{ display: 'flex', height: '100vh' }}>
        {isAuthenticated && <Sidebar role={userRole} />}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Routes>
            <Route path="/login" element={<Login setAuth={setIsAuthenticated} setRole={setUserRole} />} />
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/inventory" element={isAuthenticated ? <Inventory /> : <Navigate to="/login" />} />
            <Route path="/billing" element={isAuthenticated ? <Billing /> : <Navigate to="/login" />} />
            <Route path="/customers" element={isAuthenticated ? <Customers /> : <Navigate to="/login" />} />
            <Route path="/purchase" element={isAuthenticated ? <Purchase /> : <Navigate to="/login" />} />
            <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/login" />} />
            <Route path="/daybook" element={isAuthenticated ? <Daybook /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated && userRole === 'admin' ? <Settings /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
