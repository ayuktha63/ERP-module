import React, { useState, useEffect } from 'react';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    const customers = await window.ipc.invoke('get-customers');
    setCustomers(customers);
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile.includes(search)
  );

  return (
    <div className="customer-container">
      <h2 className="heading">Customer Management</h2>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or mobile"
        className="input-field"
      />
      <table className="table">
        <thead>
          <tr className="table-header">
            <th>Name</th>
            <th>Mobile</th>
            <th>GSTIN</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map(customer => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.mobile}</td>
              <td>{customer.gstin}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Embedded CSS */}
      <style>{`
        .customer-container {
          padding: 20px;
          font-family: sans-serif;
        }
        .heading {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .input-field {
          width: 100%;
          padding: 10px;
          margin-bottom: 20px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
        }
        .table th, .table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        .table-header {
          background-color: #f5f5f5;
        }
      `}</style>
    </div>
  );
}

export default Customers;
