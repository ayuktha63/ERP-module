import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

function Billing() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: '', mobile: '', gstin: '' });
  const [discount, setDiscount] = useState(0);
  const [gst, setGst] = useState(0);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      setProducts(await window.ipc.invoke('get-products'));
      setSettings(await window.ipc.invoke('get-settings'));
    };
    fetchData();
  }, []);

  const handleCustomerSearch = async (e) => {
    const mobile = e.target.value;
    setCustomer({ ...customer, mobile });
    if (mobile.length >= 10) {
      const existing = await window.ipc.invoke('find-customer', mobile);
      if (existing) setCustomer(existing);
    }
  };

  const addToCart = (product, quantity) => {
    setCart([...cart, { ...product, quantity }]);
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.sale_price * item.quantity, 0);
    const gstAmount = subtotal * (gst / 100);
    return (subtotal + gstAmount - discount).toFixed(2);
  };

  const saveBill = async () => {
    const customerData = { name: customer.name, mobile: customer.mobile, gstin: customer.gstin };
    let customerId = customer.id;
    if (!customerId) {
      const result = await window.ipc.invoke('add-customer', customerData);
      customerId = result.lastInsertRowid;
    }
    const bill = {
      customer_id: customerId,
      items: cart,
      discount,
      gst,
      total: calculateTotal(),
      date: new Date().toISOString().split('T')[0]
    };
    await window.ipc.invoke('save-bill', bill);
    generatePDF(bill);
    setCart([]);
    setCustomer({ name: '', mobile: '', gstin: '' });
    setDiscount(0);
    setGst(settings.gst_percentage || 18);
  };

  const generatePDF = (bill) => {
    const doc = new jsPDF();
    doc.text(settings.business_name || 'My Business', 10, 10);
    doc.text(`Invoice #${bill.id}`, 10, 20);
    doc.text(`Customer: ${customer.name} (${customer.mobile})`, 10, 30);
    let y = 40;
    bill.items.forEach(item => {
      doc.text(`${item.name} x ${item.quantity}: ₹${(item.sale_price * item.quantity).toFixed(2)}`, 10, y);
      y += 10;
    });
    doc.text(`Discount: ₹${discount}`, 10, y);
    doc.text(`GST (${gst}%): ₹${(bill.total * (gst / 100)).toFixed(2)}`, 10, y + 10);
    doc.text(`Total: ₹${bill.total}`, 10, y + 20);
    doc.text(settings.invoice_footer || 'Thank you!', 10, y + 30);
    doc.save(`invoice_${bill.id}.pdf`);
  };

  return (
    <div className="billing-container">
      <h2 className="heading">POS Billing</h2>
      <div className="row">
        <div className="column">
          <h3 className="subheading">Customer Details</h3>
          <input
            type="text"
            value={customer.mobile}
            onChange={handleCustomerSearch}
            placeholder="Mobile"
            className="input-field"
          />
          <input
            type="text"
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            placeholder="Name"
            className="input-field"
          />
          <input
            type="text"
            value={customer.gstin}
            onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
            placeholder="GSTIN"
            className="input-field"
          />
        </div>
        <div className="column">
          <h3 className="subheading">Add Items</h3>
          <select
            onChange={(e) => {
              const product = products.find(p => p.id === parseInt(e.target.value));
              if (product) addToCart(product, 1);
            }}
            className="input-field"
          >
            <option value="">Select Product</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newCart = [...cart];
                        newCart[index].quantity = parseInt(e.target.value);
                        setCart(newCart);
                      }}
                      className="qty-input"
                    />
                  </td>
                  <td>₹{item.sale_price}</td>
                  <td>₹{(item.sale_price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="totals">
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="Discount"
              className="input-field short"
            />
            <input
              type="number"
              value={gst}
              onChange={(e) => setGst(parseFloat(e.target.value) || 0)}
              placeholder="GST %"
              className="input-field short"
            />
            <p className="total">Grand Total: ₹{calculateTotal()}</p>
            <button onClick={saveBill} className="btn">Save & Print</button>
          </div>
        </div>
      </div>

      {/* Embedded CSS */}
      <style>{`
        .billing-container {
          padding: 20px;
          font-family: sans-serif;
        }
        .heading {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .subheading {
          font-size: 18px;
          margin-bottom: 10px;
        }
        .row {
          display: flex;
          gap: 20px;
        }
        .column {
          flex: 1;
        }
        .input-field {
          padding: 8px;
          margin-bottom: 10px;
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        .short {
          width: 120px;
          margin-right: 10px;
        }
        .table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .table th, .table td {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        .qty-input {
          width: 60px;
          padding: 4px;
          border: 1px solid #aaa;
          border-radius: 4px;
        }
        .totals {
          margin-top: 20px;
        }
        .total {
          font-size: 18px;
          margin: 10px 0;
        }
        .btn {
          padding: 10px 16px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
}

export default Billing;
