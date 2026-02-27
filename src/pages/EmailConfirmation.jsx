import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function EmailConfirmation() {
  return (
    <>
      <Helmet>
        <title>Confirm Email | Keto Contractor</title>
      </Helmet>
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#131B2D] border border-slate-800 rounded-2xl p-8 shadow-[0_0_60px_rgba(8,145,178,0.1)] text-center">
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="mb-6 transform hover:scale-105 transition-transform duration-300">
               <img 
                src="https://horizons-cdn.hostinger.com/dcac26d1-acf4-4e36-b028-056c34ad9fa9/1e46931a5ba22180cb7204064a7e8980.png" 
                alt="Keto Contractor Logo" 
                className="h-32 w-auto object-contain drop-shadow-[0_0_25px_rgba(234,179,8,0.2)]"
              />
            </div>
            <div className="h-16 w-16 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-cyan-500/20">
              <Mail className="h-8 w-8 text-cyan-500" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight mb-3">Check your inbox</h1>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              We've sent a verification link to your email address. Please verify your account to access your contractor-grade meal plan.
            </p>
             <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-800 mb-8">
              <p className="text-xs text-slate-500">
                Didn't receive the email? Check your spam folder or try signing in again to request a new link.
              </p>
            </div>
            
            <Link to="/login" className="w-full block">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 shadow-lg shadow-cyan-900/20">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}