import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { useAuth } from '../../context/useAuth';
import { api } from '../../api/api';
import LeoMark from '../../components/branding/LeoMark';
import ButtonSpinner from '../../components/loading/ButtonSpinner';
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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form, 'Signing in');
      if (res.success && res.body) {
        const user = res.body.user || res.body;
        if (res.body.token) {
          localStorage.setItem('leo_token', res.body.token);
        }
        login(user);
        navigate(getDestination(user.role));
      } else {
        const message = res.message || 'Login failed';
        if (/deactivate|inactive|suspend|pending owner approval/i.test(message)) {
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
      notify({ type: 'error', message: 'Could not connect to server.' });
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = () => {
    notify({
      type: 'info',
      message: 'Contact your shop owner or support to reset your password.',
    });
  };

  return (
    <div className={`${styles.page} ${styles.loginPage}`}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}><LeoMark /></div>
          <div className={styles.brand}>Leo <span>POS</span></div>
        </div>
        <h2>Welcome back</h2>
        <p className={styles.sub}>Sign in to your Leo account.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>
            Username or email
            <input
              type="text"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter your username or email"
              autoComplete="username"
              required
              disabled={loading}
            />
          </label>

          <label>
            <span className={styles.loginLabelRow}>
              <span>Password</span>
              <button
                type="button"
                className={styles.loginForgot}
                onClick={handleForgot}
              >
                Forgot password?
              </button>
            </span>
            <span className={styles.loginPasswordWrap}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
              <button
                type="button"
                className={styles.loginPasswordToggle}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <MdVisibilityOff /> : <MdVisibility />}
              </button>
            </span>
          </label>

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? (
              <>
                <ButtonSpinner ariaLabel="Signing in..." />
                <span>Signing in...</span>
              </>
            ) : 'Log in'}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <span>New to Leo?</span>
          <Link to="/register">Sign up</Link>
        </div>
      </div>
    </div>
  );
}