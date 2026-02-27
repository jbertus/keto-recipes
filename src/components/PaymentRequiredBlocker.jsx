
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CreditCard, ExternalLink, Mail, LogOut, Loader2 } from 'lucide-react';
import { logEvent } from '@/lib/logEvent';

const PaymentRequiredBlocker = ({ onAccessRestored }) => {
  const { accessState, refreshAccessState, signOut } = useAuth();
  const [isPolling, setIsPolling] = useState(true);

  // Initial Log on Mount
  useEffect(() => {
    logEvent({
      event_type: 'access_blocked',
      severity: 'warning',
      source: 'blocker',
      reason: accessState.reason,
      access_allowed: false,
      metadata: { billing_provider: accessState.billing_provider }
    });
  }, [accessState.reason, accessState.billing_provider]);

  // Polling Logic
  useEffect(() => {
    let intervalId;
    
    if (isPolling) {
      // Poll every 60 seconds as requested
      intervalId = setInterval(async () => {
        await refreshAccessState();
      }, 60000); 
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, refreshAccessState]);

  // Check if access restored
  useEffect(() => {
    if (accessState.access_allowed) {
      setIsPolling(false); // Stop polling
      logEvent({
        event_type: 'access_restored',
        severity: 'info',
        source: 'blocker',
        reason: 'polling_success',
        access_allowed: true
      });
      if (onAccessRestored) onAccessRestored();
    }
  }, [accessState.access_allowed, onAccessRestored]);

  // Handle RPC Error state transition logging
  useEffect(() => {
    if (accessState.reason === 'rpc_error') {
      logEvent({
        event_type: 'rpc_error',
        severity: 'error',
        source: 'blocker',
        reason: 'rpc_error_state_active'
      });
    }
  }, [accessState.reason]);

  const handleContactSupport = () => {
    logEvent({
      event_type: 'contact_support_clicked',
      source: 'blocker',
      metadata: { reason: accessState.reason }
    });
    window.location.href = 'mailto:support@ketocontractor.com?subject=Payment%20Issue%20-%20Account%20Paused';
  };

  const handleUpdatePayment = () => {
    if (accessState.update_payment_url) {
      logEvent({
        event_type: 'update_payment_clicked',
        source: 'blocker',
        metadata: { url: accessState.update_payment_url }
      });
      window.open(accessState.update_payment_url, '_blank');
    }
  };

  const isRpcError = accessState.reason === 'rpc_error';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md border-red-900/50 bg-slate-900 text-slate-200 shadow-2xl animate-in fade-in zoom-in duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-950/50 border border-red-900/50">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            {isRpcError ? "Account Paused — Verification Unavailable" : "Action Required"}
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2 text-base leading-relaxed">
            {isRpcError 
              ? "We can't verify your billing status right now. For security reasons, access is temporarily paused. Please try again shortly or contact support."
              : "Your account access has been temporarily paused due to a billing issue. Please update your payment method to restore access immediately."}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isRpcError && accessState.update_payment_url && (
            <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-800 text-sm text-slate-400">
               Updating your payment takes just a moment. Once confirmed, this screen will disappear automatically.
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
            <span className="opacity-70">Verifying status...</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {/* Show Update Payment ONLY if URL exists and NOT in RPC error */}
          {!isRpcError && accessState.update_payment_url && (
            <Button 
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold h-11" 
              onClick={handleUpdatePayment}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Update Payment Method
              <ExternalLink className="ml-2 h-3 w-3 opacity-70" />
            </Button>
          )}

          <div className="flex w-full gap-3">
            <Button 
              variant="outline" 
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={handleContactSupport}
            >
              <Mail className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            
            <Button 
              variant="outline" 
              className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              onClick={signOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentRequiredBlocker;
