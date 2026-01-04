import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const location = useLocation();

  // 1. While the app is loading OR checking admin status, stay on the loader
  // This prevents the "flash" of Access Denied
  if (loading || (requireAdmin && isAdmin === null)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin h-10 w-10 text-primary" />
          <p className="text-muted-foreground animate-pulse">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // 2. If no user is logged in, send to login page
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Only show Access Denied if requireAdmin is true AND isAdmin is explicitly FALSE
  if (requireAdmin && isAdmin === false) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4 max-w-md border p-8 rounded-lg bg-card shadow-sm">
          <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
          <p className="text-muted-foreground">
            Account: <span className="font-mono text-foreground">{user.email}</span>
            <br />
            You don't have administrator permissions.
          </p>
          <button 
            onClick={() => signOut()}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition"
          >
            Sign Out & Try Admin Account
          </button>
        </div>
      </div>
    );
  }

  // 4. Success: User is logged in and (if required) is an admin
  return <>{children}</>;
};