import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';

const RequireAuth: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const auth = useAuth() as any;
  const { isAuthenticated, initializing } = auth ?? { isAuthenticated: false, initializing: true };
  const location = useLocation();

  // While auth is initializing (rehydrating session), render a loader instead of redirecting.
  if (initializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-64">
          <p className="text-center mb-4">Loading…</p>
          <Progress value={50} />
        </div>
      </div>
    );
  }

  // If not authenticated after initialization, redirect to /login and preserve the attempted path in state
  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} state={{ from: location }} replace />;
  }

  return children;
};

export default RequireAuth;
