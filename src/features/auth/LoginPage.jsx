import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { api } from '../../api/api';
import LeoMark from '../../components/branding/LeoMark';
import { useFeedback } from '../../context/useFeedback';
import styles from './Auth.module.css';

function getDestination(role) {
  if (role === 'SUPER_ADMIN') return '/owner/admin/tenants';
  if (role === 'OWNER') return '/owner/dashboard';
  return '/client/pos';
}

export default function LoginPage() {
  const { login } = useAuth();
  const { alert, notify } = useFeedback();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      if (res.success && res.body) {
        const user = res.body.user || res.body;
        if (res.body.token) {
          localStorage.setItem('leo_token', res.body.token);
        }
        login(user);
        navigate(getDestination(user.role));
      } else {
        const message = res.message || 'Login failed';
        if (/deactivat|inactive|suspend|pending owner approval/i.test(message)) {
          alert({
            title: /pending owner approval/i.test(message)
              ? 'Account awaiting approval'
              : /suspend/i.test(message)
                ? 'Shop suspended'
                : 'Account deactivated',
            message,
          });
        } else {
          notify({ type: 'error', message });
        }
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
          <div className={styles.brandIcon}><LeoMark /></div>
          <div className={styles.brand}>Leo <span>POS</span></div>
        </div>
        <h2>Welcome back</h2>
        <p className={styles.sub}>Sign in to your Leo account.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Username or email
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter your username or email"
              autoComplete="username"
              required
            />
          </label>
          <label>Password
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
