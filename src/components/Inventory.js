import React, { useState, useEffect } from 'react';

function Inventory() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', category: '', unit: 'PCS', purchase_price: 0, sale_price: 0, stock: 0 });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const products = await window.ipc.invoke('get-products');
    setProducts(products);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingId) {
      await window.ipc.invoke('update-product', editingId, form);
      setEditingId(null);
    } else {
      await window.ipc.invoke('add-product', form);
    }
    setForm({ code: '', name: '', category: '', unit: 'PCS', purchase_price: 0, sale_price: 0, stock: 0 });
    fetchProducts();
  };

  const handleEdit = (product) => {
    setForm(product);
    setEditingId(product.id);
  };

  const handleDelete = async (id) => {
    await window.ipc.invoke('delete-product', id);
    fetchProducts();
  };

  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Inventory Management</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <input
          type="text"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Product Code"
          style={inputStyle}
        />
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Product Name"
          style={inputStyle}
        />
        <input
          type="text"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="Category"
          style={inputStyle}
        />
        <select
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          style={inputStyle}
        >
          <option value="PCS">PCS</option>
          <option value="KG">KG</option>
        </select>
        <input
          type="number"
          value={form.purchase_price}
          onChange={(e) => setForm({ ...form, purchase_price: parseFloat(e.target.value) })}
          placeholder="Purchase Price"
          style={inputStyle}
        />
        <input
          type="number"
          value={form.sale_price}
          onChange={(e) => setForm({ ...form, sale_price: parseFloat(e.target.value) })}
          placeholder="Sale Price"
          style={inputStyle}
        />
        <input
          type="number"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) })}
          placeholder="Stock"
          style={inputStyle}
        />
        <button type="submit" style={{ padding: '8px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px' }}>
          {editingId ? 'Update' : 'Add'} Product
        </button>
      </form>

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
        <thead>
          <tr style={{ backgroundColor: '#e5e7eb' }}>
            {['Code', 'Name', 'Category', 'Unit', 'Purchase Price', 'Sale Price', 'Stock', 'Actions'].map((col) => (
              <th key={col} style={cellStyle}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map(product => (
            <tr key={product.id} style={{ backgroundColor: product.stock < 10 ? '#fee2e2' : 'transparent' }}>
              <td style={cellStyle}>{product.code}</td>
              <td style={cellStyle}>{product.name}</td>
              <td style={cellStyle}>{product.category}</td>
              <td style={cellStyle}>{product.unit}</td>
              <td style={cellStyle}>₹{product.purchase_price}</td>
              <td style={cellStyle}>₹{product.sale_price}</td>
              <td style={cellStyle}>{product.stock}</td>
              <td style={cellStyle}>
                <button
                  onClick={() => handleEdit(product)}
                  style={{ ...buttonStyle, backgroundColor: '#f59e0b', marginRight: '8px' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{ ...buttonStyle, backgroundColor: '#ef4444' }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const inputStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  minWidth: '120px',
};

const cellStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  textAlign: 'left',
};

const buttonStyle = {
  padding: '6px 10px',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
};

export default Inventory;
