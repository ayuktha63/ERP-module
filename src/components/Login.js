import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ setAuth, setRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    window.ipc.invoke('test-ipc').then((result) => {
      console.log(result); // Should log 'IPC is working'
    }).catch((err) => {
      console.error('IPC test error:', err);
    });
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!window.ipc) {
        throw new Error('IPC bridge not available');
      }
      const user = await window.ipc.invoke('login', { username, password });
      if (user) {
        setAuth(true);
        setRole(user.role);
        navigate('/');
      } else {
        alert('Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed: ' + err.message);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '80px auto',
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}

export default Login;