import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { api } from '../../api/api';
import { useFeedback } from '../../context/useFeedback';
import styles from './Auth.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const { notify } = useFeedback();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      if (res.success && res.body) {
        const userObj = res.body.user || res.body;
        const token = res.body.token;
        if (token) {
          localStorage.setItem('leo_token', token);
        }
        login(userObj);
        navigate(userObj.role === 'OWNER' ? '/dashboard' : '/pos');
      } else {
        notify({ type: 'error', message: res.message || 'Login failed' });
      }
    } catch {
      notify({ type: 'error', message: 'Could not connect to server. Check backend connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>L</div>
          <div className={styles.brand}>Leo <span>POS </span></div>
        </div>
        <h2>Welcome back</h2>
        <p className={styles.sub}>Login to your account below</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Username / Email
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="e.g. admin or staff"
              required
            />
          </label>
          <label>Password
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          </label>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.foot}>
          New business? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
