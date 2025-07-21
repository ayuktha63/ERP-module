import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';

function Billing() {
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([{ name: '', quantity: 0 }]);
  const [customer, setCustomer] = useState({ name: '', mobile: '', gstin: '' });
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);
  const [settings, setSettings] = useState({});
  const [showCustomerPrompt, setShowCustomerPrompt] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState({});
  const inputRefs = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, settingsData] = await Promise.all([
          window.ipc.invoke('get-products'),
          window.ipc.invoke('get-settings'),
        ]);
        setProducts(productsData || []);
        setSettings(settingsData || {});
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchData();

    const handleKeyDown = (e) => {
      if (e.key === 'F5') {
        e.preventDefault();
        setShowCustomerPrompt(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    if (field === 'name') {
      updated[index][field] = value;
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(prev => ({ ...prev, [index]: filtered }));
      setSelectedSuggestionIndex(prev => ({ ...prev, [index]: 0 }));

      const match = products.find(p => p.name.toLowerCase() === value.toLowerCase());
      if (match) {
        updated[index] = {
          ...updated[index],
          ...match,
          name: match.name,
          quantity: updated[index].quantity || 0,
        };
        setSuggestions(prev => ({ ...prev, [index]: [] }));
      }

      if (value.trim() === '') {
        updated[index] = { name: '', quantity: 0 };
        setSuggestions(prev => ({ ...prev, [index]: [] }));
      }
    } else if (field === 'quantity') {
      const newQuantity = value === '' ? 0 : parseInt(value, 10);
      if (!isNaN(newQuantity) && newQuantity >= 0) {
        updated[index][field] = newQuantity;
      }
    }

    setRows(updated);

    if (field === 'name' && value && index === rows.length - 1) {
      setRows([...updated, { name: '', quantity: 0 }]);
    }
  };

  const handleKeyDown = (e, index) => {
    const list = suggestions[index] || [];
    if (list.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => ({
        ...prev,
        [index]: Math.min((prev[index] || 0) + 1, list.length - 1),
      }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => ({
        ...prev,
        [index]: Math.max((prev[index] || 0) - 1, 0),
      }));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = list[selectedSuggestionIndex[index] || 0];
      if (selected) handleSuggestionClick(index, selected);
    }
  };

  const handleSuggestionClick = (index, product) => {
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      ...product,
      name: product.name,
      quantity: updated[index].quantity || 0,
    };
    setRows(updated);
    setSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const validateMobile = (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  };

  const validateGSTIN = (gstin) => {
    if (!gstin) return true; // GSTIN is optional
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
  };

  const validateBillItems = (items) => {
    return items.every(item => 
      item.name && 
      item.id && 
      Number.isFinite(item.sale_price) && 
      Number.isFinite(item.quantity) && 
      item.quantity > 0 // Require quantity > 0 for valid items
    );
  };

  const handleMobileChange = async (mobile) => {
    setCustomer(prev => ({ ...prev, mobile }));
    if (validateMobile(mobile)) {
      try {
        const existingCustomer = await window.ipc.invoke('find-customer', mobile);
        if (existingCustomer) {
          setCustomer(prev => ({ ...prev, name: existingCustomer.name || '', id: existingCustomer.id, gstin: existingCustomer.gstin || '' }));
        } else {
          setCustomer(prev => ({ ...prev, name: '', id: null, gstin: '' }));
        }
      } catch (error) {
        console.error('Error finding customer:', error.message, error.stack);
      }
    } else {
      setCustomer(prev => ({ ...prev, name: '', id: null, gstin: '' }));
    }
  };

  const calculateTotal = () => {
    const subtotal = rows.reduce((sum, item) => sum + ((item.sale_price || 0) * (item.quantity || 0)), 0);
    const gstAmount = subtotal * (gst / 100);
    console.log('Calculate Total:', { subtotal, gst, gstAmount, discount });
    return (subtotal + gstAmount - discount).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!validateMobile(customer.mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!validateGSTIN(customer.gstin)) {
      alert("Please enter a valid GSTIN or leave it empty.");
      return;
    }

    const billItems = rows.filter(row => row.name && Number.isFinite(row.sale_price) && row.quantity > 0);
    if (!billItems.length || !validateBillItems(billItems)) {
      alert("Please add at least one valid item with name, price, and quantity greater than 0.");
      return;
    }

    const customerData = { 
      name: customer.name ? customer.name.trim() : `Customer_${customer.mobile}`,
      mobile: customer.mobile,
      gstin: customer.gstin || ''
    };
    let customerId = customer.id;

    if (!customerId) {
      try {
        const result = await window.ipc.invoke('add-customer', customerData);
        if (result && (result.id || result.lastInsertRowid)) {
          customerId = result.id || result.lastInsertRowid;
        } else {
          console.error('Customer creation failed: Invalid response', result);
          alert('Error creating customer. Please try again.');
          return;
        }
      } catch (error) {
        console.error('Error adding customer:', error.message, error.stack);
        alert(`Error creating customer: ${error.message}. Please try again.`);
        return;
      }
    }

    const bill = {
      customer_id: customerId,
      items: billItems,
      discount,
      gst,
      total: calculateTotal(),
      date: new Date().toISOString().split('T')[0]
    };

    try {
      await window.ipc.invoke('save-bill', bill);
      generatePDF(bill);
      setRows([{ name: '', quantity: 0 }]);
      setCustomer({ name: '', mobile: '', id: null, gstin: '' });
      setDiscount(0);
      setShowCustomerPrompt(false);
    } catch (error) {
      console.error('Error saving bill:', error.message, error.stack);
      alert(`Error generating invoice: ${error.message}. Please try again.`);
    }
  };

  const generatePDF = (bill) => {
    const doc = new jsPDF();
    
    // Set document properties
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;
    const maxWidth = pageWidth - 2 * margin;

    // Header with block color
    doc.setFillColor(0, 102, 204); // Blue header
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255); // White text for header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(settings.business_name || 'My Business', margin, 20);
    doc.setFontSize(10);
    doc.text(`Invoice #${bill.id || Math.floor(Math.random() * 10000)}`, pageWidth - margin - 60, 20);
    doc.setTextColor(0, 0, 0); // Reset to black text

    // Invoice details
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let y = 40;
    doc.text(`Date: ${bill.date}`, margin, y);
    y += 10;
    doc.text(`Customer: ${customer.name || 'Customer_' + customer.mobile} (${customer.mobile})`, margin, y);
    y += 10;
    if (customer.gstin) {
      doc.text(`GSTIN: ${customer.gstin}`, margin, y);
      y += 10;
    }

    // Manual table rendering
    try {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setFillColor(0, 102, 204);
      doc.rect(margin, y, maxWidth, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text('Item Name', margin + 2, y + 7);
      doc.text('Quantity', margin + maxWidth * 0.4 + 2, y + 7);
      doc.text('Unit Price', margin + maxWidth * 0.55 + 2, y + 7);
      doc.text('Total', margin + maxWidth * 0.8 + 2, y + 7);
      doc.setTextColor(0, 0, 0);
      y += 10;

      bill.items.forEach((item, index) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const rowColor = index % 2 === 0 ? [255, 255, 255] : [240, 240, 240];
        doc.setFillColor(...rowColor);
        doc.rect(margin, y, maxWidth, 10, 'F');
        doc.text(item.name, margin + 2, y + 7);
        doc.text(item.quantity.toString(), margin + maxWidth * 0.4 + 2, y + 7);
        doc.text(`INR ${(item.sale_price || 0).toFixed(2)}`, margin + maxWidth * 0.55 + 2, y + 7);
        doc.text(`INR ${((item.sale_price || 0) * item.quantity).toFixed(2)}`, margin + maxWidth * 0.8 + 2, y + 7);
        y += 10;
        doc.setLineWidth(0.1);
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, margin + maxWidth, y);
      });
      y += 10;
    } catch (error) {
      console.error('Error rendering table:', error.message, error.stack);
      doc.text('Error rendering items table', margin, y);
      y += 10;
    }

    // Summary section
    const subtotal = bill.items.reduce((sum, item) => sum + ((item.sale_price || 0) * item.quantity), 0);
    const gstAmount = subtotal * (gst / 100);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Subtotal: INR ${subtotal.toFixed(2)}`, pageWidth - margin - 50, y);
    y += 8;
    doc.text(`Discount: INR ${discount.toFixed(2)}`, pageWidth - margin - 50, y);
    y += 8;
    doc.text(`GST (${gst}%): INR ${gstAmount.toFixed(2)}`, pageWidth - margin - 50, y);
    y += 8;
    doc.setFontSize(12);
    doc.setFillColor(0, 102, 204);
    doc.rect(pageWidth - margin - 50, y - 4, 50, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`Total: INR ${bill.total}`, pageWidth - margin - 50, y);
    doc.setTextColor(0, 0, 0);

    // Footer
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(settings.invoice_footer || 'Thank you for your business!', margin, pageHeight - margin);

    // Save the PDF
    doc.save(`invoice_${bill.id || Date.now()}.pdf`);
  };

  return (
    <div className="billing-wrapper">
      <h2 className="heading">Billing</h2>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: '40%' }}>Product Name</th>
            <th style={{ width: '15%' }}>Qty</th>
            <th style={{ width: '20%' }}>Price</th>
            <th style={{ width: '25%' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td style={{ position: 'relative' }}>
                <input
                  ref={el => inputRefs.current[idx] = el}
                  type="text"
                  value={row.name}
                  onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  className="input name-input"
                />
                {suggestions[idx]?.length > 0 && (
                  <ul className="suggestion-box">
                    {suggestions[idx].slice(0, 5).map((p, i) => (
                      <li
                        key={i}
                        onClick={() => handleSuggestionClick(idx, p)}
                        style={{
                          backgroundColor: selectedSuggestionIndex[idx] === i ? '#d0e7ff' : 'white',
                        }}
                      >
                        {p.name}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td>
                <input
                  type="number"
                  value={row.quantity || 0}
                  onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                  className="input short-input"
                  min="0"
                />
              </td>
              <td>INR {(row.sale_price || 0).toFixed(2)}</td>
              <td>INR {((row.sale_price || 0) * (row.quantity || 0)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bottom-fixed-bar">
        <label className="discount-label">Discount:</label>
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          placeholder="Discount"
          className="input short-input"
          min="0"
        />
        <span className="total-display">Total: INR {calculateTotal()}</span>
        <button className="btn" onClick={() => setShowCustomerPrompt(true)}>Submit (F5)</button>
      </div>

      {showCustomerPrompt && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Customer Details</h3>
            <input
              type="text"
              placeholder="Mobile (10 digits)"
              value={customer.mobile}
              onChange={(e) => handleMobileChange(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Name (optional)"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="GSTIN (optional)"
              value={customer.gstin}
              onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
              className="input"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
              <button
                className="btn"
                onClick={() => setShowCustomerPrompt(false)}
                style={{ backgroundColor: '#ccc', color: '#000' }}
              >
                Back
              </button>
              <button className="btn" onClick={handleSubmit}>
                Generate Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .billing-wrapper {
          padding: 20px 30px;
          font-family: 'Segoe UI', sans-serif;
          padding-bottom: 100px;
          width: 100%;
          max-width: 100%;
        }

        .heading {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
        }

        .table th, .table td {
          border: 1px solid #ddd;
          padding: 10px;
        }

        .input {
          padding: 8px;
          font-size: 16px;
          width: 100%;
          box-sizing: border-box;
        }

        .short-input {
          width: 80px;
        }

        .discount-label {
          font-size: 16px;
          font-weight: bold;
          align-self: center;
        }

        .bottom-fixed-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 15px 40px;
          background: #f8f8f8;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          gap: 20px;
        }

        .total-display {
          font-size: 20px;
          font-weight: bold;
        }

        .btn {
          padding: 10px 25px;
          background-color: #007bff;
          color: white;
          font-size: 16px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        }

        .modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .modal-content {
          background: #fff;
          padding: 30px;
          border-radius: 8px;
          width: 320px;
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .suggestion-box {
          position: absolute;
          z-index: 100;
          background: #fff;
          border: 1px solid #ccc;
          max-height: 120px;
          overflow-y: auto;
          width: 100%;
          list-style: none;
          padding: 0;
          margin-top: 2px;
        }

        .suggestion-box li {
          padding: 8px;
          cursor: pointer;
        }

        .suggestion-box li:hover {
          background: #f0f0f0;
        }
      `}</style>
    </div>
  );
}

export default Billing;