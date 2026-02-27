// CRITICAL: This file is no longer a standalone page for Admin Users.
// Its content has been moved and integrated into the `Preferences` page as the "User Management" tab.
// This file is now deprecated and will not be used.
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function AdminUsers() {
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8 animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
      <Helmet>
        <title>Admin Users (Deprecated) | Keto Contractor</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <h1 className="text-3xl font-bold text-white mb-4">Admin Users Section Deprecated</h1>
        <p className="text-lg">This functionality has been integrated into the Preferences page under the "User Management" tab.</p>
      </div>
    </div>
  );
}