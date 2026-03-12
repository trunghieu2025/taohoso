import { useState, useEffect } from 'react';

const PIN_KEY = 'taohoso_pin_hash';

/** Simple hash for PIN — NOT cryptographically secure, but sufficient for casual protection */
async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + '_taohoso_salt');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function isPinSet(): boolean {
  return !!localStorage.getItem(PIN_KEY);
}

export async function setPin(pin: string): Promise<void> {
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_KEY, hash);
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY);
  if (!stored) return true; // No PIN set
  const hash = await hashPin(pin);
  return hash === stored;
}

export function removePin(): void {
  localStorage.removeItem(PIN_KEY);
}

/** PIN Lock Screen — renders over the app until correct PIN is entered */
export default function PinLock({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if PIN is set and session is not already unlocked
    const pinSet = isPinSet();
    const unlocked = sessionStorage.getItem('taohoso_unlocked') === 'yes';
    setLocked(pinSet && !unlocked);
    setChecking(false);
  }, []);

  const handleSubmit = async () => {
    setError('');
    const ok = await verifyPin(pin);
    if (ok) {
      sessionStorage.setItem('taohoso_unlocked', 'yes');
      setLocked(false);
    } else {
      setError('Sai mã PIN. Vui lòng thử lại.');
      setPin('');
    }
  };

  if (checking) return null;
  if (!locked) return <>{children}</>;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
    }}>
      <div style={{
        background: 'white', borderRadius: 16, padding: '2.5rem', textAlign: 'center',
        maxWidth: 360, width: '90%', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔒</div>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.3rem', color: '#1e293b' }}>
          TạoHồSơ đã khóa
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Nhập mã PIN để tiếp tục
        </p>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Nhập PIN..."
          maxLength={20}
          autoFocus
          style={{
            width: '100%', padding: '0.85rem 1rem', fontSize: '1.2rem', textAlign: 'center',
            border: `2px solid ${error ? '#ef4444' : '#e2e8f0'}`, borderRadius: 10,
            outline: 'none', letterSpacing: '0.3em', fontWeight: 600,
          }}
        />
        {error && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>{error}</p>}
        <button
          onClick={handleSubmit}
          style={{
            width: '100%', marginTop: '1rem', padding: '0.75rem',
            background: '#10b981', color: 'white', border: 'none',
            borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Mở khóa 🔓
        </button>
      </div>
    </div>
  );
}
