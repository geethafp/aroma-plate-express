import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';

const transition = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) setStep('otp');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
    if (newOtp.every(d => d !== '')) {
      setTimeout(() => setStep('success'), 500);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={transition} className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-serif-display text-3xl tracking-tight text-foreground mb-2">Welcome!</h2>
            <p className="text-muted-foreground mb-6">You're now logged in.</p>
            <button onClick={() => navigate('/')} className="rounded-xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">
              Browse Menu
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="w-full max-w-sm"
        >
          {step === 'otp' && (
            <button onClick={() => setStep('phone')} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <h2 className="font-serif-display text-3xl tracking-tight text-foreground mb-2">
            {step === 'phone' ? 'Login' : 'Verify OTP'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {step === 'phone'
              ? 'Enter your mobile number to continue.'
              : `We sent a 4-digit code to +91 ${phone}`}
          </p>

          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-card card-shadow h-14 px-4">
                <span className="text-sm font-medium text-muted-foreground">+91</span>
                <div className="h-6 w-px bg-border" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground/50 outline-none font-sans-ui"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={phone.length !== 10}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground disabled:opacity-40 active:scale-[0.98] transition-all"
              >
                Send OTP
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="h-14 w-14 rounded-xl bg-card card-shadow text-center text-xl font-bold text-foreground outline-none focus:ring-2 focus:ring-primary transition-all font-mono-price"
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors">
                Resend OTP
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
