import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';

function Billing() {
  const [products, setProducts] = useState([]);
  const [rows, setRows] = useState([{ name: '', quantity: 1 }]);
  const [customer, setCustomer] = useState({ name: '', mobile: '', gstin: '' });
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(18);
  const [settings, setSettings] = useState({});
  const [showCustomerPrompt, setShowCustomerPrompt] = useState(false);
  const [suggestions, setSuggestions] = useState({});
  const suggestionRefs = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      setProducts(await window.ipc.invoke('get-products'));
      setSettings(await window.ipc.invoke('get-settings'));
    };
    fetchData();
  }, []);

  const handleRowChange = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;

    if (field === 'name') {
      const filtered = products.filter(p =>
        p.name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(prev => ({ ...prev, [index]: filtered }));

      const match = products.find(p => p.name.toLowerCase() === value.toLowerCase());
      if (match) {
        updated[index] = {
          ...updated[index],
          ...match,
          name: match.name,
          quantity: updated[index].quantity || 1,
        };
        setSuggestions(prev => ({ ...prev, [index]: [] }));
      }

      if (value.trim() === '') {
        updated[index] = { name: '', quantity: 1 };
        setSuggestions(prev => ({ ...prev, [index]: [] }));
      }
    }

    setRows(updated);

    if (field === 'name' && value && index === rows.length - 1) {
      setRows([...updated, { name: '', quantity: 1 }]);
    }
  };

  const handleSuggestionClick = (index, product) => {
    const updated = [...rows];
    updated[index] = {
      ...updated[index],
      ...product,
      name: product.name,
      quantity: 1,
    };
    setRows(updated);
    setSuggestions(prev => ({ ...prev, [index]: [] }));
  };

  const calculateTotal = () => {
    const subtotal = rows.reduce((sum, item) => sum + (item.sale_price || 0) * (item.quantity || 0), 0);
    const gstAmount = subtotal * (gst / 100);
    return (subtotal + gstAmount - discount).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!customer.name || !customer.mobile) {
      alert("Please enter customer details.");
      return;
    }

    const customerData = { name: customer.name, mobile: customer.mobile };
    let customerId = customer.id;
    if (!customerId) {
      const result = await window.ipc.invoke('add-customer', customerData);
      customerId = result.lastInsertRowid;
    }

    const bill = {
      customer_id: customerId,
      items: rows.filter(row => row.name && row.sale_price),
      discount,
      gst,
      total: calculateTotal(),
      date: new Date().toISOString().split('T')[0]
    };

    await window.ipc.invoke('save-bill', bill);
    generatePDF(bill);

    setRows([{ name: '', quantity: 1 }]);
    setCustomer({ name: '', mobile: '', gstin: '' });
    setDiscount(0);
  };

  const generatePDF = (bill) => {
    const doc = new jsPDF();
    doc.text(settings.business_name || 'My Business', 10, 10);
    doc.text(`Invoice #${bill.id || Math.floor(Math.random() * 10000)}`, 10, 20);
    doc.text(`Customer: ${customer.name} (${customer.mobile})`, 10, 30);
    let y = 40;
    bill.items.forEach(item => {
      doc.text(`${item.name} x ${item.quantity}: ₹${(item.sale_price * item.quantity).toFixed(2)}`, 10, y);
      y += 10;
    });
    doc.text(`Discount: ₹${discount}`, 10, y);
    doc.text(`GST (${gst}%): ₹${(bill.total * (gst / 100)).toFixed(2)}`, 10, y + 10);
    doc.text(`Total: ₹${bill.total}`, 10, y + 20);
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
            <tr key={idx} style={{ position: 'relative' }}>
              <td style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                  className="input name-input"
                />
                {suggestions[idx]?.length > 0 && (
                  <ul className="suggestion-box">
                    {suggestions[idx].slice(0, 5).map((p, i) => (
                      <li key={i} onClick={() => handleSuggestionClick(idx, p)}>
                        {p.name}
                      </li>
                    ))}
                  </ul>
                )}
              </td>
              <td>
                <input
                  type="number"
                  value={row.quantity || 1}
                  onChange={(e) => handleRowChange(idx, 'quantity', parseInt(e.target.value))}
                  className="input short-input"
                />
              </td>
              <td>₹{row.sale_price || 0}</td>
              <td>₹{((row.sale_price || 0) * (row.quantity || 1)).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bottom bar */}
      <div className="bottom-fixed-bar">
        <input
          type="number"
          value={discount}
          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
          placeholder="Discount"
          className="input short-input"
        />
        <span className="total-display">Total: ₹{calculateTotal()}</span>
        <button className="btn" onClick={() => setShowCustomerPrompt(true)}>Submit</button>
      </div>

      {/* Customer Prompt */}
      {showCustomerPrompt && (
        <div className="modal">
          <div className="modal-content">
            <h3>Enter Customer Details</h3>
            <input
              type="text"
              placeholder="Name"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="input"
            />
            <input
              type="text"
              placeholder="Mobile"
              value={customer.mobile}
              onChange={(e) => setCustomer({ ...customer, mobile: e.target.value })}
              className="input"
            />
            <button className="btn" onClick={handleSubmit}>Generate Invoice</button>
          </div>
        </div>
      )}

      <style>{`
        .billing-wrapper {
          padding: 20px 30px;
          font-family: 'Segoe UI', sans-serif;
          padding-bottom: 100px;
          width: 100%;
          box-sizing: border-box;
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
          width: 300px;
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
