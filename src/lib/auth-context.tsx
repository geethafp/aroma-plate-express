import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextValue = {
  isLoading: boolean;
  session: Session | null;
  user: User | null;
  displayName: string;
  avatarUrl: string | null;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getDisplayName = (user: User | null) => {
  if (!user) return '';

  const metadata = user.user_metadata ?? {};
  return (
    metadata.full_name ||
    metadata.name ||
    metadata.user_name ||
    user.email?.split('@')[0] ||
    user.phone ||
    'My Account'
  );
};

const getAvatarUrl = (user: User | null) => {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  return metadata.avatar_url || metadata.picture || null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    };

    bootstrap();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        session,
        user,
        displayName: getDisplayName(user),
        avatarUrl: getAvatarUrl(user),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};
