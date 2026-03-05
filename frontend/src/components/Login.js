import React, { useState } from 'react';

function Login({ API_URL, onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';

    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      if (isSignup) {
        setMessage('Account created! Check your email to confirm, then log in.');
        setIsSignup(false);
      } else {
        localStorage.setItem('access_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        localStorage.setItem('user_email', data.user.email);
        onLogin(data.session.access_token);
      }
    } catch {
      setError('Could not connect to server.');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Rentals.</h1>
        <p className="login-subtitle">{isSignup ? 'Create your account' : 'Sign in to continue'}</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="login-input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : isSignup ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {error && <p className="login-error">{error}</p>}
        {message && <p className="login-message">{message}</p>}

        <p className="login-toggle">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button className="toggle-btn" onClick={() => { setIsSignup(!isSignup); setError(''); setMessage(''); }}>
            {isSignup ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
