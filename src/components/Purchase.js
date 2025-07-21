import React, { useState, useEffect } from 'react';

function Purchase() {
  const [products, setProducts] = useState([]);
  const [purchase, setPurchase] = useState({
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    window.ipc.invoke('get-products').then(setProducts);
  }, []);

  const addItem = () => {
    if (selectedProduct) {
      setPurchase({
        ...purchase,
        items: [...purchase.items, { ...selectedProduct, quantity }],
      });
      setSelectedProduct(null);
      setQuantity(1);
    }
  };

  const savePurchase = async () => {
    const total = purchase.items.reduce(
      (sum, item) => sum + item.purchase_price * item.quantity,
      0
    );
    await window.ipc.invoke('add-purchase', { ...purchase, total });
    setPurchase({
      vendor: '',
      date: new Date().toISOString().split('T')[0],
      items: [],
    });
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Purchase Entry</h2>

      <input
        type="text"
        value={purchase.vendor}
        onChange={(e) => setPurchase({ ...purchase, vendor: e.target.value })}
        placeholder="Vendor Name"
        style={inputFullStyle}
      />
      <input
        type="date"
        value={purchase.date}
        onChange={(e) => setPurchase({ ...purchase, date: e.target.value })}
        style={inputFullStyle}
      />

      <div style={{ display: 'flex', marginBottom: '16px', gap: '8px' }}>
        <select
          onChange={(e) => setSelectedProduct(products.find(p => p.id === parseInt(e.target.value)))}
          style={inputStyle}
        >
          <option value="">Select Product</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          placeholder="Quantity"
          style={inputStyle}
        />
        <button onClick={addItem} style={buttonStyle}>
          Add Item
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ backgroundColor: '#e5e7eb' }}>
            <th style={cellStyle}>Name</th>
            <th style={cellStyle}>Quantity</th>
            <th style={cellStyle}>Price</th>
            <th style={cellStyle}>Total</th>
          </tr>
        </thead>
        <tbody>
          {purchase.items.map((item, index) => (
            <tr key={index}>
              <td style={cellStyle}>{item.name}</td>
              <td style={cellStyle}>{item.quantity}</td>
              <td style={cellStyle}>₹{item.purchase_price}</td>
              <td style={cellStyle}>₹{(item.purchase_price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={savePurchase} style={{ ...buttonStyle, marginTop: '16px' }}>
        Save Purchase
      </button>
    </div>
  );
}

const inputStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  minWidth: '120px',
  flexGrow: 1,
};

const inputFullStyle = {
  ...inputStyle,
  marginBottom: '8px',
  width: '100%',
};

const cellStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  textAlign: 'left',
};

const buttonStyle = {
  padding: '8px 12px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default Purchase;
