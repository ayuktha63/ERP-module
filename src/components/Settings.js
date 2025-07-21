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
    try {
      await window.ipc.invoke('update-settings', settings);
      alert('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error.message, error.stack);
      alert('Error saving settings. Please try again.');
    }
  };

  return (
    <div className="settings-wrapper">
      <h2 className="heading">Settings</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={settings.business_name}
          onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
          placeholder="Business Name"
          className="input"
        />
        <input
          type="text"
          value={settings.logo}
          onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
          placeholder="Logo Path"
          className="input"
        />
        <input
          type="number"
          value={settings.gst_percentage}
          onChange={(e) => setSettings({ ...settings, gst_percentage: parseFloat(e.target.value) || 18 })}
          placeholder="GST Percentage"
          className="input"
          min="0"
        />
        <input
          type="text"
          value={settings.units}
          onChange={(e) => setSettings({ ...settings, units: e.target.value })}
          placeholder="Units (comma-separated)"
          className="input"
        />
        <textarea
          value={settings.invoice_footer}
          onChange={(e) => setSettings({ ...settings, invoice_footer: e.target.value })}
          placeholder="Invoice Footer"
          className="input textarea"
        />
        <select
          value={settings.invoice_layout}
          onChange={(e) => setSettings({ ...settings, invoice_layout: e.target.value })}
          className="input"
        >
          <option value="default">Default</option>
          <option value="modern">Modern</option>
        </select>
        <button type="submit" className="btn">Save Settings</button>
      </form>
      <div className="about-us">
        <h3 className="about-heading">About Us</h3>
        <p>Orque Innovations LLP</p>
        <p>Contact Number: 7012256258</p>
        <p>Version: 1.0.0</p>
      </div>

      <style>{`
        .settings-wrapper {
          padding: 20px 30px;
          font-family: 'Segoe UI', sans-serif;
          width: 100%;
          max-width: 100%;
        }

        .heading {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .input {
          display: block;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          width: 100%;
          margin-bottom: 12px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .textarea {
          height: 100px;
          resize: vertical;
        }

        .btn {
          padding: 10px 16px;
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .about-us {
          margin-top: 20px;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: #f8f8f8;
        }

        .about-heading {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #0066cc;
        }

        .about-us p {
          margin: 5px 0;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default Settings;