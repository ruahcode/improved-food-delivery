import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './user.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useContext(AuthContext);
  const { login, user } = auth || {};
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';
  const message = location.state?.message;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('Login form submitted with:', { email, password: password ? 'provided' : 'missing' });
    
    try {
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        // The AuthContext will handle the redirection
        return;
      } else {
        setError(result.error || result.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login form error:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {message && <div className="alert alert-info">{message}</div>}
      {error && <div className="alert alert-danger" style={{ color: 'red', marginBottom: '1rem', padding: '0.5rem', border: '1px solid red', borderRadius: '4px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <input
            type="password"
            className="form-control"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary w-100">
          Login
        </button>
      </form>
      <div className="mt-3 text-center">
        <p>
          Don't have an account?{' '}
          <button 
            className="btn btn-link p-0"
            onClick={() => navigate('/register', { state: { from: location.state?.from } })}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;