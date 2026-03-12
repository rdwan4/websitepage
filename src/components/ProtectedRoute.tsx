import React from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({
  allow,
  loading,
  children,
}: {
  allow: boolean;
  loading: boolean;
  children: React.ReactNode;
}) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg pt-32 pb-20 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-app-card px-6 py-4 text-app-text shadow-xl">
          <Loader2 className="w-5 h-5 animate-spin text-app-accent" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!allow) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
