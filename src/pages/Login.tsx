import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import Header from '@/components/Header';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';

const transition = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };

const Login = () => {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10 || sending) return;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { phone },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Failed to send OTP');
        return;
      }

      toast.success('OTP sent to your WhatsApp!');
      setStep('otp');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
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
      verifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const verifyOtp = async (otpCode: string) => {
    if (verifying) return;
    setVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-whatsapp-otp', {
        body: { phone, otp: otpCode },
      });

      if (error || data?.error) {
        toast.error(data?.error || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '']);
        document.getElementById('otp-0')?.focus();
        return;
      }

      if (data?.verified) {
        setStep('success');
      }
    } catch {
      toast.error('Verification failed. Please try again.');
      setOtp(['', '', '', '']);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-otp', {
        body: { phone },
      });
      if (error || data?.error) {
        toast.error('Failed to resend OTP');
      } else {
        toast.success('OTP resent to your WhatsApp!');
      }
    } catch {
      toast.error('Something went wrong.');
    } finally {
      setSending(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <BreadcrumbTrail />
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
      <BreadcrumbTrail />
      <div className="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transition}
          className="w-full max-w-sm"
        >
          {step === 'otp' && (
            <button onClick={() => { setStep('phone'); setOtp(['', '', '', '']); }} className="mb-6 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <h2 className="font-serif-display text-3xl tracking-tight text-foreground mb-2">
            {step === 'phone' ? 'Login' : 'Verify OTP'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {step === 'phone'
              ? 'Enter your mobile number to receive OTP on WhatsApp.'
              : `We sent a 4-digit code to your WhatsApp (+91 ${phone})`}
          </p>

          {step === 'phone' ? (
            <div className="space-y-6">
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
                  disabled={phone.length !== 10 || sending}
                  className="w-full rounded-xl bg-[#25D366] py-3.5 text-sm font-medium text-white disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  {sending ? 'Sending...' : 'Send OTP via WhatsApp'}
                </button>
              </form>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <button
                onClick={async () => {
                  const { error } = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (error) console.error('Google sign-in error:', error);
                }}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3.5 text-sm font-medium text-foreground hover:bg-accent transition-colors active:scale-[0.98]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </div>
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
                    disabled={verifying}
                  />
                ))}
              </div>
              {verifying && (
                <p className="text-center text-sm text-muted-foreground animate-pulse">Verifying...</p>
              )}
              <button
                onClick={handleResendOtp}
                disabled={sending}
                className="w-full text-center text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {sending ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
