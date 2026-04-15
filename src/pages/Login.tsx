import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import BreadcrumbTrail from '@/components/BreadcrumbTrail';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

const transition = { duration: 0.3, ease: [0.2, 0, 0, 1] as const };
const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID?.trim();
const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH?.trim();
const MSG91_BODY_1 = import.meta.env.VITE_MSG91_BODY_1?.trim();
const MSG91_BUTTON_1 = import.meta.env.VITE_MSG91_BUTTON_1?.trim();

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
  }
}

const loadMsg91Widget = async () => {
  if (typeof window === 'undefined') {
    throw new Error('MSG91 widget can only be used in the browser.');
  }

  if (typeof window.initSendOTP === 'function') {
    return;
  }

  const scriptUrls = [
    'https://verify.msg91.com/otp-provider.js',
    'https://verify.phone91.com/otp-provider.js',
  ];

  for (const url of scriptUrls) {
    try {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed loading ${url}`));
        document.head.appendChild(script);
      });

      if (typeof window.initSendOTP === 'function') {
        return;
      }
    } catch {
      // Try the next URL.
    }
  }

  throw new Error('Unable to load MSG91 OTP widget.');
};

const extractWidgetAccessToken = (payload: Record<string, unknown>) =>
  typeof payload['access-token'] === 'string'
    ? payload['access-token']
    : typeof payload.accessToken === 'string'
      ? payload.accessToken
      : typeof payload.access_token === 'string'
        ? payload.access_token
        : typeof payload.token === 'string'
          ? payload.token
          : payload.data && typeof payload.data === 'object'
            ? extractWidgetAccessToken(payload.data as Record<string, unknown>)
            : null;

const Login = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<'phone' | 'success'>('phone');
  const [sending, setSending] = useState(false);

  if (user) {
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
            <h2 className="mb-2 font-serif-display text-3xl tracking-tight text-foreground">You are already signed in.</h2>
            <p className="mb-6 text-muted-foreground">Open your account to view saved addresses and order history.</p>
            <button onClick={() => navigate('/account')} className="rounded-xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground">
              Go to My Account
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10 || sending) return;

    if (!MSG91_WIDGET_ID || !MSG91_TOKEN_AUTH) {
      toast.error('MSG91 widget is not configured. Add VITE_MSG91_WIDGET_ID and VITE_MSG91_TOKEN_AUTH.');
      return;
    }

    setSending(true);
    try {
      await loadMsg91Widget();

      const configuration: Record<string, unknown> = {
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        identifier: `91${phone}`,
        exposeMethods: false,
        success: () => {
          toast.success('OTP submitted. Confirming verification...');
        },
        failure: (error: unknown) => {
          console.error('MSG91 verification failed:', error);
          toast.error('OTP verification failed. Please try again.');
          setSending(false);
        },
      };

      if (MSG91_BODY_1) {
        configuration.body_1 = MSG91_BODY_1;
      }

      if (MSG91_BUTTON_1) {
        configuration.button_1 = MSG91_BUTTON_1;
      }

      configuration.success = async (data: unknown) => {
        try {
          const payload = typeof data === 'object' && data ? (data as Record<string, unknown>) : {}
          const accessToken = extractWidgetAccessToken(payload)

          if (!accessToken) {
            throw new Error('MSG91 widget did not return an access token.')
          }

          const { data: verificationData, error } = await supabase.functions.invoke('verify-msg91-widget', {
            body: {
              'access-token': accessToken,
              widgetResponse: payload,
            },
          })

          if (error || verificationData?.error || !verificationData?.verified) {
            throw new Error(verificationData?.error || 'Unable to verify the OTP response.')
          }

          toast.success('WhatsApp number verified successfully.');
          setStep('success');
        } catch (error) {
          console.error('MSG91 access-token verification failed:', error)
          const message = error instanceof Error ? error.message : 'Unable to verify OTP.'
          toast.error(message)
        } finally {
          setSending(false)
        }
      };

      window.initSendOTP?.(configuration);
    } catch {
      toast.error('Unable to start WhatsApp OTP verification. Please try again.');
      setSending(false);
    } finally {
      if (step !== 'success') {
        setSending(false);
      }
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
            Login
          </h2>
          <p className="text-muted-foreground mb-8">
            Enter your mobile number to receive OTP on WhatsApp.
          </p>

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
                {sending ? 'Opening OTP...' : 'Send OTP via WhatsApp'}
              </button>
            </form>

            <div className="rounded-2xl bg-card/70 px-4 py-3 text-sm text-muted-foreground">
              The OTP screen will open through the MSG91 verification widget.
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: {
                    redirectTo: window.location.origin,
                  },
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
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
