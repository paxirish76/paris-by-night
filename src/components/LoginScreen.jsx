import { useState } from 'react';
import { useAuth } from './AuthContext';
import './LoginScreen.css';

function LoginScreen() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(false);
  const [shaking, setShaking]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(password);
    if (!result) {
      setError(true);
      setShaking(true);
      setPassword('');
      setTimeout(() => setShaking(false), 600);
    }
  };

  return (
    <div className="login-screen">
      <div className={`login-box ${shaking ? 'shake' : ''}`}>
        <div className="login-ornament">✦</div>
        <h1 className="login-title">Paris by Night</h1>
        <p className="login-subtitle">Domaine de François Villon</p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="password"
            className={`login-input ${error ? 'error' : ''}`}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            autoFocus
            autoComplete="off"
          />
          {error && (
            <p className="login-error">Accès refusé.</p>
          )}
          <button type="submit" className="login-btn">
            Entrer
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginScreen;
