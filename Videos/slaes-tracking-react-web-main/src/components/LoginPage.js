import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const result = await login({ username, password, role });
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(true);
      setMessage(result.message || 'Invalid credentials');
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const styles = {
    container: {
      fontFamily: `'Poppins', sans-serif`,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: `linear-gradient(135deg, #1c1b2d, #2b2d42)`,
      backgroundSize: 'cover',
    },
    card: {
      width: '100%',
      maxWidth: 400,
      background: 'rgba(255, 255, 255, 0.05)',
      borderRadius: '20px',
      padding: '40px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(15px)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
    },
    roleSelector: {
      display: 'flex',
      justifyContent: 'center',
      gap: '10px',
    },
    roleBadge: (isActive) => ({
      padding: '6px 12px',
      borderRadius: '30px',
      border: `1px solid ${isActive ? '#00ffcc' : '#777'}`,
      color: isActive ? '#00ffcc' : '#aaa',
      cursor: 'pointer',
      fontSize: '14px',
      transition: '0.3s',
    }),
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    input: {
      padding: '12px',
      borderRadius: '10px',
      border: 'none',
      backgroundColor: '#2d2f4a',
      color: '#fff',
      fontSize: '15px',
      outline: 'none',
      boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.2)',
    },
    button: {
      padding: '12px',
      backgroundColor: '#00ffcc',
      color: '#000',
      fontWeight: 'bold',
      border: 'none',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '16px',
      transition: '0.3s',
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed',
    },
    errorMessage: {
      color: '#ff6b6b',
      background: '#2b2d42',
      padding: '10px',
      borderRadius: '8px',
      textAlign: 'center',
    },
    forgot: {
      textAlign: 'right',
      fontSize: '13px',
      color: '#aaa',
      marginTop: '5px',
      textDecoration: 'underline',
      cursor: 'pointer',
    },
  };

  return (
    <>
      {/* Optional Google Font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap"
        rel="stylesheet"
      />
      <div style={styles.container}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <div style={styles.header}>
            <h2 style={{ marginBottom: '5px',textAlign:'center',alignItems:'center',justifyContent:'center' }}>🔐 GreenSecure</h2>
            <p style={{ fontSize: '14px', color: '#ccc' }}>
              BETSE CENTERAL
            </p>
          </div>

          {message && (
            <div style={styles.errorMessage}>{message}</div>
          )}

          <div style={styles.roleSelector}>
            {['admin'].map((r) => (
              <div
                key={r}
                style={styles.roleBadge(role === r)}
                onClick={() => setRole(r)}
              >
                {r}
              </div>
            ))}
          </div>

          <div style={styles.inputGroup}>
            <label>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Login to your account'}
          </button>

          <div style={styles.forgot}>Forgot password?</div>
        </form>
      </div>
    </>
  );
}
