import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center text-cyan-500">
      <Loader2 className="h-10 w-10 animate-spin mb-4" />
      <p className="text-slate-400 text-sm font-medium animate-pulse">Loading System...</p>
    </div>
  );
}