import React, { useRef, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, Navigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Helmet } from 'react-helmet-async';

export default function Login() {
  const { signIn, resetPassword, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const inProgressRef = useRef(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inProgressRef.current || loading || resetting) return;

    inProgressRef.current = true;
    setLoading(true);
    setError(null);
    setMessage(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (import.meta.env.DEV) {
      console.info(`[AUTH] LOGIN_ATTEMPT_START email=${normalizedEmail}`);
    }

    try {
      const { error } = await signIn(normalizedEmail, password);
      if (error) throw error;
    } catch (err) {
      const rawMessage = err?.message || '';
      const messageLower = rawMessage.toLowerCase();
      if (messageLower.includes('invalid login credentials')) {
        setError('That email/password does not match an account in this app yet. Try Sign up first.');
      } else if (messageLower.includes('email not confirmed')) {
        setError('Please confirm your email first, then sign in.');
      } else {
        setError(rawMessage || 'Unable to sign in right now.');
      }
    } finally {
      if (import.meta.env.DEV) {
        console.info(`[AUTH] LOGIN_ATTEMPT_END email=${normalizedEmail}`);
      }
      inProgressRef.current = false;
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (loading || resetting) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Enter your email address first, then click Forgot password.');
      setMessage(null);
      return;
    }

    setError(null);
    setMessage(null);
    setResetting(true);
    try {
      const { error: resetError } = await resetPassword(normalizedEmail);
      if (resetError) throw resetError;
      setMessage('Password reset link sent. Check your email.');
    } catch (err) {
      setError(err?.message || 'Unable to send password reset email.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <Helmet>
        <title>Login - Keto Contractor</title>
      </Helmet>
      
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center">
            {/* Fixed Logo URL */}
            <img 
                src="https://horizons-cdn.hostinger.com/dcac26d1-acf4-4e36-b028-056c34ad9fa9/5540cb1f979b0d437737bdd9bbc95052.png" 
                alt="Keto Contractor Logo" 
                className="w-24 h-24 mb-6 rounded-xl shadow-lg shadow-cyan-500/20 object-contain bg-slate-900 p-2" 
            />
            <h1 className="text-3xl font-bold text-white tracking-tight">Keto Contractor</h1>
            <p className="text-slate-400 mt-2">Welcome back to your meal planner.</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {message ? (
                <Alert className="bg-emerald-900/20 border-emerald-800 text-emerald-300">
                  <AlertTitle>Check your inbox</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading || resetting}
                  className="bg-slate-950 border-slate-800 focus:border-cyan-600"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline disabled:opacity-60"
                  disabled={loading || resetting}
                  onClick={handleForgotPassword}
                >
                  {resetting ? 'Sending reset link…' : 'Forgot password?'}
                </button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading || resetting}
                  className="bg-slate-950 border-slate-800 focus:border-cyan-600"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white" 
                disabled={loading || resetting}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-800 pt-6">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/signup" className="text-cyan-500 hover:text-cyan-400 hover:underline">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}