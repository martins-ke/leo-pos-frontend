import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdShield } from 'react-icons/md';
import { api } from '../../api/api';
import LeoMark from '../../components/branding/LeoMark';
import { useAuth } from '../../context/useAuth';
import { useFeedback } from '../../context/useFeedback';
import styles from './Auth.module.css';

const initialForm = {
  setupKey: '',
  username: '',
  email: '',
  password: '',
  confirm_password: '',
};

export default function PlatformSetupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { notify } = useFeedback();
  const [form, setForm] = useState(initialForm);
  const [setupStatus, setSetupStatus] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.get('/auth/setup/status')
      .then(res => {
        if (active) {
          setSetupStatus(res.success ? res.body : { setupAvailable: false, setupKeyRequired: false });
          setStatusMessage(res.message || 'Could not check platform setup.');
        }
      })
      .catch(() => {
        if (active) {
          setSetupStatus({ setupAvailable: false, setupKeyRequired: false });
          setStatusMessage('Could not check platform setup. Please try again later.');
        }
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/auth/setup', form);
      if (!res.success || !res.body) {
        setError(res.message || 'Platform setup failed. Please try again.');
        return;
      }

      const user = res.body.user || res.body;
      if (user.role !== 'SUPER_ADMIN' || !res.body.token) {
        setError('Setup completed but the server did not return platform owner access. Contact your system administrator.');
        notify({ type: 'error', message: 'Platform setup response was incomplete.' });
        return;
      }

      localStorage.setItem('leo_token', res.body.token);
      login(user);
      navigate('/owner/admin/tenants', { replace: true });
    } catch {
      setError('Could not connect to the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`${styles.page} ${styles.saasOwnerPortal}`}>
      <section className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}><LeoMark /></div>
          <div className={styles.brand}>Leo <span>POS</span></div>
        </div>
        <div className={styles.portalHeading}>
          <span className={styles.portalIcon}><MdShield size={20} /></span>
          <span>Leo system setup</span>
        </div>
        <p className={styles.sub}>
          Create the private platform owner account used to manage Leo and its shop accounts.
        </p>

        {loadingStatus ? (
          <p className={styles.sub} role="status">Checking whether first-time setup is available…</p>
        ) : !setupStatus?.setupAvailable ? (
          <div>
            <div className={styles.error} role="status">
              {statusMessage}
            </div>
          </div>
        ) : (
          <>
            {error && <div className={styles.error} role="alert">{error}</div>}
            <form onSubmit={handleSubmit} className={styles.form}>
              {setupStatus.setupKeyRequired && (
                <label>System setup key *
                  <input
                    type="password"
                    value={form.setupKey}
                    onChange={e => setForm({ ...form, setupKey: e.target.value })}
                    autoComplete="off"
                    required
                  />
                </label>
              )}
              <label>Platform owner username *
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  autoComplete="username"
                  required
                />
              </label>
              <label>Email address
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="email"
                />
              </label>
              <label>Password *
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <label>Confirm password *
                <input
                  type="password"
                  value={form.confirm_password}
                  onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
              <button type="submit" className={styles.btn} disabled={submitting}>
                {submitting ? 'Setting up Leo…' : 'Create platform owner account'}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
