import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/api';
import { MdStorefront, MdPointOfSale } from 'react-icons/md';
import { useFeedback } from '../../context/useFeedback';
import styles from './Auth.module.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { beginSaving } = useFeedback();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'OWNER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const usernameRef = useRef(null);
  const emailRef = useRef(null);

  const continueToPassword = () => {
    const fields = [usernameRef.current, emailRef.current];
    const invalidField = fields.find(field => field && !field.checkValidity());

    if (invalidField) {
      invalidField.reportValidity();
      return;
    }

    setError('');
    setStep(2);
  };

  const returnToAccountDetails = () => {
    setError('');
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const saveStatus = beginSaving({ title: 'Creating your account' });
    try {
      const res = await api.post('/auth/register', form);
      if (res.success) {
        saveStatus.complete({
          title: 'Registration successful',
          message: res.message || 'Registration successful! Redirecting to login...',
        });
        setTimeout(() => {
          navigate('/login');
        }, 1800);
      } else {
        setError('');
        saveStatus.fail({ message: res.message || 'Registration failed' });
      }
    } catch {
      setError('');
      saveStatus.fail({ message: 'Could not connect to server. Check backend connection.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}>L</div>
          <div className={styles.brand}>Leo <span>POS</span></div>
        </div>
        <h2>Create Account</h2>
        <p className={styles.sub}>
          {step === 1 ? 'Start with your account details' : 'Choose a password to secure your account'}
        </p>

        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.stepProgress} aria-label={`Step ${step} of 2`}>
          <div className={`${styles.stepIndicator} ${step === 1 ? styles.stepCurrent : styles.stepComplete}`}>
            <span>1</span>
            <span>Account details</span>
          </div>
          <div className={`${styles.stepConnector} ${step === 2 ? styles.stepConnectorComplete : ''}`} />
          <div className={`${styles.stepIndicator} ${step === 2 ? styles.stepCurrent : ''}`}>
            <span>2</span>
            <span>Password</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {step === 1 ? (
            <>
              <div className={styles.formStep}>
                <div className={styles.rolePicker}>
                  <button
                    type="button"
                    className={`${styles.rolePill} ${form.role === 'OWNER' ? styles.roleActive : ''}`}
                    onClick={() => setForm({ ...form, role: 'OWNER' })}
                    aria-pressed={form.role === 'OWNER'}
                  >
                    <MdStorefront size={18} />
                    <span>Shop Owner</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.rolePill} ${form.role === 'STAFF' ? styles.roleActive : ''}`}
                    onClick={() => setForm({ ...form, role: 'STAFF' })}
                    aria-pressed={form.role === 'STAFF'}
                  >
                    <MdPointOfSale size={18} />
                    <span>Cashier</span>
                  </button>
                </div>

                <label>Username *
                  <input
                    ref={usernameRef}
                    type="text"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="e.g. jdoe_admin"
                    autoComplete="username"
                    required
                  />
                </label>

                <label>Email Address
                  <input
                    ref={emailRef}
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@company.com"
                    autoComplete="email"
                  />
                </label>
              </div>

              <button type="button" className={styles.btn} onClick={continueToPassword}>
                Continue to password
              </button>
            </>
          ) : (
            <>
              <div className={styles.formStep}>
                <label>Password *
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter a password"
                    autoComplete="new-password"
                    required
                  />
                </label>

                <label>Confirm Password *
                  <input
                    type="password"
                    value={form.confirm_password}
                    onChange={e => setForm({ ...form, confirm_password: e.target.value })}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    required
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button type="button" className={styles.backBtn} onClick={returnToAccountDetails}>
                  Back
                </button>
                <button type="submit" className={styles.btn} disabled={loading}>
                  {loading ? 'Creating Account...' : `Register as ${form.role === 'OWNER' ? 'Shop Owner' : 'Cashier'}`}
                </button>
              </div>
            </>
          )}
        </form>

        <p className={styles.foot}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
