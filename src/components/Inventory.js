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

  const isFormValid = () => {
    const { code, name, category, unit, purchase_price, sale_price, stock } = form;
    return (
      code.trim() !== '' &&
      name.trim() !== '' &&
      category.trim() !== '' &&
      unit.trim() !== '' &&
      purchase_price > 0 &&
      sale_price > 0 &&
      stock >= 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) return;

    if (editingId) {
      await window.ipc.invoke('update-product', {
        id: editingId,
        product: form,
      });
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
      <form onSubmit={handleSubmit} style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        <div style={inputGroupStyle}>
          <label htmlFor="code">Product Code</label>
          <input
            id="code"
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="name">Product Name</label>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="category">Category</label>
          <input
            id="category"
            type="text"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="unit">Unit</label>
          <select
            id="unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
            style={inputStyle}
          >
            <option value="PCS">PCS</option>
            <option value="KG">KG</option>
          </select>
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="purchase_price">Purchase Price</label>
          <input
            id="purchase_price"
            type="number"
            value={form.purchase_price}
            onChange={(e) => setForm({ ...form, purchase_price: parseFloat(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="sale_price">Sale Price</label>
          <input
            id="sale_price"
            type="number"
            value={form.sale_price}
            onChange={(e) => setForm({ ...form, sale_price: parseFloat(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
        <div style={inputGroupStyle}>
          <label htmlFor="stock">Stock</label>
          <input
            id="stock"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={!isFormValid()}
            style={{
              padding: '8px',
              backgroundColor: isFormValid() ? '#3b82f6' : '#9ca3af',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: isFormValid() ? 'pointer' : 'not-allowed'
            }}
          >
            {editingId ? 'Update' : 'Add'} Product
          </button>
        </div>
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

const inputGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: '120px',
};

const inputStyle = {
  padding: '8px',
  border: '1px solid #ccc',
  borderRadius: '4px',
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
