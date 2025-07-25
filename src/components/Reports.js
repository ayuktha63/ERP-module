import React, { useState, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';

function Reports() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', mobile: '' });
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsData, settingsData] = await Promise.all([
          window.ipc.invoke('get-sales-report', filters),
          window.ipc.invoke('get-settings'),
        ]);
        setReports(reportsData || []);
        setSettings(settingsData || {});
      } catch (error) {
        console.error('Error fetching reports or settings:', error);
        setReports([]);
      }
    };
    fetchData();
  }, [filters]);

  const exportToExcel = () => {
    if (!reports.length) {
      alert('No data to export.');
      return;
    }

    const ws = utils.json_to_sheet(reports.map(r => ({
      'Bill ID': r.id,
      Customer: r.name || `Customer_${r.mobile}`,
      Mobile: r.mobile,
      Total: `INR ${Number(r.total).toFixed(2)}`,
      Date: r.date
    })));

    // Set column widths
    ws['!cols'] = [
      { wch: 10 }, // Bill ID
      { wch: 20 }, // Customer
      { wch: 15 }, // Mobile
      { wch: 15 }, // Total
      { wch: 15 }  // Date
    ];

    // Add header styling (bold)
    ws['A1'].s = { font: { bold: true } };
    ws['B1'].s = { font: { bold: true } };
    ws['C1'].s = { font: { bold: true } };
    ws['D1'].s = { font: { bold: true } };
    ws['E1'].s = { font: { bold: true } };

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Sales Report');
    writeFile(wb, `sales_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    console.log('Exported sales report to Excel');
  };

  const exportToPDF = () => {
    if (!reports.length) {
      alert('No data to export.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;

    // Header
    doc.setFillColor(0, 102, 204); // Blue header
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.business_name || 'My Business', margin, 20);
    doc.setFontSize(14);
    doc.text('Sales Report', pageWidth / 2, 20, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    // Filters and date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 40;
    if (filters.dateFrom) doc.text(`From: ${filters.dateFrom}`, margin, y);
    if (filters.dateTo) doc.text(`To: ${filters.dateTo}`, pageWidth - margin - 30, y);
    y += 10;
    if (filters.mobile) doc.text(`Mobile: ${filters.mobile}`, margin, y);
    y += 10;

    // Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(0, 102, 204);
    doc.rect(margin, y, maxWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text('Bill ID', margin + 2, y + 7);
    doc.text('Customer', margin + maxWidth * 0.2 + 2, y + 7);
    doc.text('Mobile', margin + maxWidth * 0.5 + 2, y + 7);
    doc.text('Total', margin + maxWidth * 0.7 + 2, y + 7);
    doc.text('Date', margin + maxWidth * 0.85 + 2, y + 7);
    doc.setTextColor(0, 0, 0);
    y += 10;

    reports.forEach((report, index) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const rowColor = index % 2 === 0 ? [255, 255, 255] : [240, 240, 240];
      doc.setFillColor(...rowColor);
      doc.rect(margin, y, maxWidth, 10, 'F');
      doc.text(report.id.toString(), margin + 2, y + 7);
      doc.text(report.name || `Customer_${report.mobile}`, margin + maxWidth * 0.2 + 2, y + 7);
      doc.text(report.mobile, margin + maxWidth * 0.5 + 2, y + 7);
      doc.text(`INR ${Number(report.total).toFixed(2)}`, margin + maxWidth * 0.7 + 2, y + 7);
      doc.text(report.date, margin + maxWidth * 0.85 + 2, y + 7);
      y += 10;
      doc.setLineWidth(0.1);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, margin + maxWidth, y);
    });

    // Summary
    y += 10;
    const totalSales = reports.reduce((sum, r) => sum + Number(r.total), 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Sales: INR ${totalSales.toFixed(2)}`, pageWidth - margin - 50, y);

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text(settings.invoice_footer || 'Generated by My Business', margin, doc.internal.pageSize.height - margin);

    doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
    console.log('Exported sales report to PDF');
  };

  return (
    <div className="reports-wrapper">
      <h2 className="heading">Sales Reports</h2>
      <div className="filter-bar">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          className="input"
        />
        <input
          type="date"
          value={filters.dateTo}
          onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          className="input"
        />
        <input
          type="text"
          placeholder="Search by Phone"
          value={filters.mobile}
          onChange={(e) => setFilters({ ...filters, mobile: e.target.value })}
          className="input"
        />
        <button onClick={exportToExcel} className="btn btn-excel">Export Excel</button>
        <button onClick={exportToPDF} className="btn btn-pdf">Export PDF</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Bill ID</th>
            <th>Customer</th>
            <th>Mobile</th>
            <th>Total</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {reports.map(report => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.name || `Customer_${report.mobile}`}</td>
              <td>{report.mobile}</td>
              <td>INR {Number(report.total).toFixed(2)}</td>
              <td>{report.date}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <style>{`
        .reports-wrapper {
          padding: 20px 30px;
          font-family: 'Segoe UI', sans-serif;
          width: 95%;
          max-width: 100%;
        }

        .heading {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .filter-bar {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .input {
          padding: 8px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 150px;
        }

        .btn {
          padding: 8px 16px;
          font-size: 14px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          color: white;
        }

        .btn-excel {
          background-color: #28a745;
        }

        .btn-pdf {
          background-color: #007bff;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .table th, .table td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }

        .table th {
          background-color: #0066cc;
          color: white;
          font-weight: bold;
        }

        .table tr:nth-child(even) {
          background-color: #f0f0f0;
        }
      `}</style>
    </div>
  );
}

export default Reports;