import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess('');

    if (!newPassword || !confirmPassword) {
      setError('Please fill out both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setSuccess('Your password has been updated. Redirecting…');
      setTimeout(() => navigate('/', { replace: true }), 900);
    } catch (err) {
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <Helmet>
        <title>Set Password - Keto Contractor</title>
      </Helmet>
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 space-y-4">
        <h1 className="text-xl font-semibold text-white">Set a new password</h1>
        <p className="text-sm text-slate-400">
          Finish account recovery by setting the password you want to use for future logins.
        </p>

        {error ? (
          <Alert variant="destructive" className="bg-red-900/20 border-red-900">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {success ? <p className="text-sm text-emerald-400">{success}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
              className="bg-slate-950 border-slate-800 focus:border-cyan-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              disabled={loading}
              required
              className="bg-slate-950 border-slate-800 focus:border-cyan-600"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white"
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update Password
          </Button>
        </form>

        <div className="text-sm text-slate-400 text-center">
          Need another reset link?{' '}
          <Link to="/login" className="text-cyan-500 hover:text-cyan-400 hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
