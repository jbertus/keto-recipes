import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Helmet } from 'react-helmet-async';
import { Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';

const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function SignUp() {
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(signUpSchema)
  });

  // We have removed the useEffect that automatically redirects logged-in users to '/'.
  // This is to prevent a race condition where a successful signup (which might establish a session)
  // redirects the user to the dashboard before they can see the Email Confirmation page.
  // By handling navigation exclusively in onSubmit, we ensure the correct flow.

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    
    try {
      const normalizedEmail = data.email.trim().toLowerCase();
      const { error } = await signUp(normalizedEmail, data.password);
      
      if (error) {
        setServerError(error.message || "Failed to create account.");
        setLoading(false);
      } else {
        // Explicitly navigate to confirmation page upon success
        // We do this immediately to ensure the user sees the instruction
        navigate('/confirmation');
      }
    } catch (err) {
      console.error("Signup error:", err);
      setServerError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Sign Up | Keto Contractor</title>
      </Helmet>
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#131B2D] border border-slate-800 rounded-2xl p-8 shadow-[0_0_60px_rgba(8,145,178,0.1)]">
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
               <img 
                src="https://i.imgur.com/ketocontractor.png" 
                alt="Keto Contractor Logo" 
                className="h-40 w-auto object-contain drop-shadow-[0_0_25px_rgba(234,179,8,0.2)]"
              />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-2">Create Account</h1>
            <p className="text-slate-400 text-sm">Join the contractor-grade meal planning platform</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {serverError && (
              <Alert variant="destructive" className="bg-red-500/10 border-red-500/50 text-red-400">
                 <AlertCircle className="h-4 w-4" />
                 <AlertDescription>
                   {serverError}
                 </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="email">Email</Label>
              <Input 
                id="email" 
                {...register("email")}
                className="bg-[#0B1120] border-slate-700 text-white focus:border-cyan-500 transition-colors h-11" 
                placeholder="you@example.com" 
                autoComplete="email" 
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                {...register("password")}
                className="bg-[#0B1120] border-slate-700 text-white focus:border-cyan-500 transition-colors h-11" 
                placeholder="••••••••" 
                autoComplete="new-password" 
              />
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider" htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password"
                {...register("confirmPassword")}
                className="bg-[#0B1120] border-slate-700 text-white focus:border-cyan-500 transition-colors h-11" 
                placeholder="••••••••" 
                autoComplete="new-password" 
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(8,145,178,0.3)] hover:shadow-[0_0_30px_rgba(8,145,178,0.5)] border-none mt-2" 
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              CREATE ACCOUNT
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors hover:underline">
              Sign in instead
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}