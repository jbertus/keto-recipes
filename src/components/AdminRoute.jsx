
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    // Only trigger toast if loading is done, user exists, but is NOT admin
    if (!loading && user && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have administrative permissions."
      });
    }
  }, [loading, user, isAdmin, toast]);

  // STRICT loading logic: show spinner if loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  // Check Authentication: If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check Admin Role: If not admin, redirect to home/dashboard
  if (!isAdmin) {
    // AUDIT VERIFIED: Use 'replace' to prevent history stack loops
    return <Navigate to="/" replace />;
  }

  // If all checks pass, render children
  return children;
};

export default AdminRoute;
