import React, { useState, useEffect } from 'react';

function Daybook() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [daybook, setDaybook] = useState({ sales: 0, purchases: 0, profit: 0 });

  useEffect(() => {
    window.ipc.invoke('get-daybook', date).then(setDaybook);
  }, [date]);

  return (
    <div className="daybook-container">
      <h2 className="heading">Daybook</h2>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="date-input"
      />
      <div className="grid">
        <div className="card blue">
          <h3>Sales</h3>
          <p>₹{daybook.sales.toFixed(2)}</p>
        </div>
        <div className="card yellow">
          <h3>Purchases</h3>
          <p>₹{daybook.purchases.toFixed(2)}</p>
        </div>
        <div className="card green">
          <h3>Profit</h3>
          <p>₹{daybook.profit.toFixed(2)}</p>
        </div>
      </div>

      <style>{`
        .daybook-container {
          padding: 20px;
          font-family: sans-serif;
        }
        .heading {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .date-input {
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 200px;
        }
        .grid {
          display: flex;
          gap: 20px;
        }
        .card {
          flex: 1;
          padding: 20px;
          border-radius: 8px;
          color: #333;
        }
        .card h3 {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .card p {
          font-size: 24px;
          font-weight: bold;
        }
        .blue {
          background-color: #e0f0ff;
        }
        .yellow {
          background-color: #fff7cc;
        }
        .green {
          background-color: #d8f8d8;
        }
      `}</style>
    </div>
  );
}

export default Daybook;
