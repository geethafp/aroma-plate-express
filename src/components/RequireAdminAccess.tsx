import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

const ALLOWED_ADMIN_EMAILS = new Set([
  'gfp.vja@gmail.com',
  'vamseekonkinmalla@gmail.com',
]);

export const RequireAdminAccess = ({ children }: { children: JSX.Element }) => {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center text-sm text-muted-foreground">
        Checking access...
      </div>
    );
  }

  if (!user?.email) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!ALLOWED_ADMIN_EMAILS.has(user.email.toLowerCase())) {
    return <Navigate to="/account" replace />;
  }

  return children;
};

export const isAllowedAdminEmail = (email: string | null | undefined) =>
  !!email && ALLOWED_ADMIN_EMAILS.has(email.toLowerCase());
