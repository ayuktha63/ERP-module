import React, { useEffect, useState } from 'react';

function Dashboard() {
  const [stats, setStats] = useState({ sales: 0, lowStock: 0, expenses: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const date = new Date().toISOString().split('T')[0];
      const daybook = await window.ipc.invoke('get-daybook', date);
      const products = await window.ipc.invoke('get-products');
      const lowStock = products.filter(p => p.stock < 10).length;
      setStats({ sales: daybook.sales, lowStock, expenses: daybook.purchases });
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#bfdbfe', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px' }}>Today's Sales</h3>
          <p style={{ fontSize: '24px' }}>₹{stats.sales.toFixed(2)}</p>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fecaca', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px' }}>Low Stock Items</h3>
          <p style={{ fontSize: '24px' }}>{stats.lowStock}</p>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '18px' }}>Today's Expenses</h3>
          <p style={{ fontSize: '24px' }}>₹{stats.expenses.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
