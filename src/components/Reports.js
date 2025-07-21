import React, { useState, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';

function Reports() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', mobile: '' });

  useEffect(() => {
    fetchReports();
  }, [filters]);

  const fetchReports = async () => {
    const reports = await window.ipc.invoke('get-sales-report', filters);
    setReports(reports);
  };

  const exportToExcel = () => {
    const ws = utils.json_to_sheet(reports.map(r => ({
      BillID: r.id,
      Customer: r.name,
      Mobile: r.mobile,
      Total: r.total,
      Date: r.date
    })));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sales Report');
    writeFile(wb, 'sales_report.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Sales Report', 10, 10);
    let y = 20;
    reports.forEach(r => {
      doc.text(`Bill #${r.id} | ${r.name} | ₹${r.total} | ${r.date}`, 10, y);
      y += 10;
    });
    doc.save('sales_report.pdf');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Sales Reports</h2>
      <div style={{ display: 'flex', marginBottom: '16px' }}>
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '8px',
            fontSize: '14px'
          }}
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '8px',
            fontSize: '14px'
          }}
        />
        <input
          type="text"
          placeholder="Search by Phone"
          value={filters.mobile}
          onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
          style={{
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            marginRight: '8px',
            fontSize: '14px'
          }}
        />
        <button
          onClick={exportToExcel}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '8px',
            fontSize: '14px'
          }}
        >
          Export Excel
        </button>
        <button
          onClick={exportToPDF}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Export PDF
        </button>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ backgroundColor: '#f1f1f1' }}>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Bill ID</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Customer</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Mobile</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Total</th>
            <th style={{ padding: '8px', border: '1px solid #ccc' }}>Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{report.id}</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{report.name}</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{report.mobile}</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>₹{report.total}</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>{report.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;
