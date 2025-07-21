import React, { useState, useEffect } from 'react';

function Settings() {
  const [settings, setSettings] = useState({
    business_name: '',
    logo: '',
    gst_percentage: 18,
    units: 'PCS,KG',
    invoice_footer: '',
    invoice_layout: 'default',
  });

  useEffect(() => {
    window.ipc.invoke('get-settings').then(setSettings);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await window.ipc.invoke('update-settings', settings);
    alert('Settings saved!');
  };

  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Settings</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={settings.business_name}
          onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
          placeholder="Business Name"
          style={inputStyle}
        />
        <input
          type="text"
          value={settings.logo}
          onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
          placeholder="Logo Path"
          style={inputStyle}
        />
        <input
          type="number"
          value={settings.gst_percentage}
          onChange={(e) => setSettings({ ...settings, gst_percentage: parseFloat(e.target.value) })}
          placeholder="GST Percentage"
          style={inputStyle}
        />
        <input
          type="text"
          value={settings.units}
          onChange={(e) => setSettings({ ...settings, units: e.target.value })}
          placeholder="Units (comma-separated)"
          style={inputStyle}
        />
        <textarea
          value={settings.invoice_footer}
          onChange={(e) => setSettings({ ...settings, invoice_footer: e.target.value })}
          placeholder="Invoice Footer"
          style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
        />
        <select
          value={settings.invoice_layout}
          onChange={(e) => setSettings({ ...settings, invoice_layout: e.target.value })}
          style={inputStyle}
        >
          <option value="default">Default</option>
          <option value="modern">Modern</option>
        </select>
        <button type="submit" style={buttonStyle}>Save Settings</button>
      </form>
    </div>
  );
}

const inputStyle = {
  display: 'block',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  width: '100%',
  marginBottom: '12px',
  fontSize: '14px',
};

const buttonStyle = {
  padding: '10px 16px',
  backgroundColor: '#3b82f6',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  fontSize: '14px',
  cursor: 'pointer',
};

export default Settings;
