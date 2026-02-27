
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import MainLayout from '@/components/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import PaymentRequiredBlocker from '@/components/PaymentRequiredBlocker';
import { Loader2 } from 'lucide-react';
import { ApiKeysProvider } from '@/contexts/ApiKeysContext';
import { PreferencesProvider } from '@/contexts/PreferencesContext';
import { SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';

// Pages
import PlannerPage from '@/pages/PlannerPage';
import RecipeLibrary from '@/pages/RecipeLibrary';
import AIRecipeGenerator from '@/pages/AIRecipeGenerator/AIRecipeGenerator';
import ShoppingList from '@/pages/ShoppingList';
import Pantry from '@/pages/Pantry';
import RecipeBuilder from '@/pages/RecipeBuilder';
import ProgressTracker from '@/pages/ProgressTracker';
import BarcodeScanner from '@/pages/BarcodeScanner';
import Reports from '@/pages/Reports';
import Preferences from '@/pages/Preferences';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import EmailConfirmation from '@/pages/EmailConfirmation';
import AuthCallback from '@/pages/AuthCallback';
import SetPassword from '@/pages/SetPassword';
import DataImport from '@/pages/DataImport';

// Admin Pages/Components
import AdminEventsPage from '@/pages/AdminEventsPage';
import SmokeTestAlert from '@/pages/dev/SmokeTestAlert';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminAlertsPreferences from '@/components/admin/AdminAlertsPreferences';
import ApiKeysTab from '@/components/admin/ApiKeysTab';

// Simple wrapper to check for blocked access
const AccessGate = ({ children }) => {
  const { accessState, refreshAccessState, loading, user } = useAuth();

  if (!SUPABASE_CONFIGURED) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B1120] text-white p-4 text-center">
        <div className="max-w-md w-full bg-[#131B2D] p-8 rounded-lg border border-slate-800 shadow-xl">
          <h1 className="text-2xl font-bold mb-2 text-red-400">Supabase not configured</h1>
          <p className="text-slate-400">
            This app cannot function without Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (user && accessState?.access_allowed === false) {
    return <PaymentRequiredBlocker onAccessRestored={refreshAccessState} />;
  }

  return children;
};

const App = () => {
  return (
    <ApiKeysProvider>
      <PreferencesProvider>
        <AccessGate>
          <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/confirmation" element={<EmailConfirmation />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/set-password" element={<SetPassword />} />

          {/* Authenticated App (layout uses Outlet) */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<PlannerPage />} />
            <Route path="/recipes" element={<RecipeLibrary />} />
            <Route path="/ai-recipe-generator" element={<AIRecipeGenerator />} />
            <Route path="/shopping-list" element={<ShoppingList />} />
            <Route path="/pantry" element={<Pantry />} />
            <Route path="/builder" element={<RecipeBuilder />} />
            <Route path="/progress" element={<ProgressTracker />} />
            <Route path="/scanner" element={<BarcodeScanner />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/data-import" element={<DataImport />} />
          </Route>

          {/* Admin (admin gate + layout Outlet) */}
          <Route
            element={
              <AdminRoute>
                <MainLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin/users" element={<AdminUserManagement />} />
            <Route path="/admin/alerts" element={<AdminAlertsPreferences />} />
            <Route path="/admin/events" element={<AdminEventsPage />} />
            <Route path="/admin/api-keys" element={<ApiKeysTab />} />
          </Route>

          {/* Dev Only */}
          <Route
            path="/dev/smoke-test-alert"
            element={
              <AdminRoute>
                <SmokeTestAlert />
              </AdminRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AccessGate>
      </PreferencesProvider>
    </ApiKeysProvider>
  );
};

export default App;
