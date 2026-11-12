import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import LeoMark from '../../components/branding/LeoMark';
import FormWizard from '../../components/forms/FormWizard';
import { useFeedback } from '../../context/useFeedback';
import styles from './Auth.module.css';

const registrationSteps = ['Shop details', 'Owner details', 'Password'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { beginSaving } = useFeedback();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    businessName: '',
    businessType: 'Retail Store',
    businessLocation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const continueToNextStep = () => {
    setError('');
    setStep(current => current + 1);
  };

  const returnToPreviousStep = () => {
    setError('');
    setStep(current => Math.max(0, current - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    const saveStatus = beginSaving({ title: 'Setting up your business' });
    try {
      const res = await api.post('/auth/register', form);
      if (res.success) {
        saveStatus.complete({
          title: 'Account created!',
          message: 'Your shop account is ready. Redirecting to shop owner sign in...',
        });
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        const message = res.message || 'Shop registration failed';
        setError(message);
        saveStatus.dismiss();
      }
    } catch {
      const message = 'Could not connect to server. Check backend connection.';
      setError(message);
      saveStatus.dismiss();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.registerCard}`}>
        <div className={styles.brandRow}>
          <div className={styles.brandIcon}><LeoMark /></div>
          <div className={styles.brand}>Leo <span>POS</span></div>
        </div>
        <p className={`${styles.sub} ${styles.registerIntro}`}>
          {step === 0 && 'Add the basic details about your shop.'}
          {step === 1 && 'Set up the owner account for your shop.'}
          {step === 2 && 'Create a secure password for your owner account.'}
        </p>

        <FormWizard
          open
          embedded
          title="Create your shop account"
          steps={registrationSteps}
          step={step}
          onClose={() => navigate('/')}
          onBack={returnToPreviousStep}
          onNext={continueToNextStep}
          onSubmit={handleSubmit}
          submitLabel="Create shop account"
          submitting={loading}
        >
          <div className={styles.form}>
            {error && <div className={styles.error} role="alert">{error}</div>}
            {step === 0 ? (
              <div className={styles.formStep}>
                <label>Business name *
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={e => setForm({ ...form, businessName: e.target.value })}
                    placeholder="e.g. Apex Electronics & Hardware"
                    autoComplete="organization"
                    required
                  />
                </label>
                <div className={styles.businessDetails}>
                  <label>Business type
                    <input
                      type="text"
                      value={form.businessType}
                      onChange={e => setForm({ ...form, businessType: e.target.value })}
                      placeholder="e.g. Pharmacy, Agrovet"
                    />
                  </label>
                  <label>Location
                    <input
                      type="text"
                      value={form.businessLocation}
                      onChange={e => setForm({ ...form, businessLocation: e.target.value })}
                      placeholder="e.g. Nairobi CBD"
                    />
                  </label>
                </div>
              </div>
            ) : step === 1 ? (
              <div className={styles.formStep}>
                <label>Your username *
                  <input
                    type="text"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="Choose a username"
                    autoComplete="username"
                    required
                  />
                </label>

                <label>Email address
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@yourbusiness.com"
                    autoComplete="email"
                  />
                </label>
              </div>
            ) : (
              <div className={styles.formStep}>
                <label>Password *
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter a secure password"
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
            )}
          </div>
        </FormWizard>

        <p className={styles.registerLogin}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
