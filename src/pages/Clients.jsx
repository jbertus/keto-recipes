// CRITICAL: This file previously contained the "Clients" management page.
// The "CLIENTS" section, including all client management features, has been permanently removed
// from the application as it is explicitly not part of the product vision.
// This file is now empty to reflect its removal from the application.
// Under no circumstances should this file be populated with client-related functionality again.
import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Clients() {
  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8 animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
      <Helmet>
        <title>Clients (Removed) | Keto Contractor</title>
      </Helmet>
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <h1 className="text-3xl font-bold text-white mb-4">Clients Section Removed</h1>
        <p className="text-lg">This feature has been removed as it is not part of the product vision.</p>
        <p className="text-sm">User Management features are now located within the Preferences page.</p>
      </div>
    </div>
  );
}