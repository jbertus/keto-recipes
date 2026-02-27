import React, { useState, useEffect } from 'react';
import { Download, UploadCloud } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

function SettingsModal({ open, onOpenChange, onLoadSampleRecipes, onRefreshCSV }) {
  const { toast } = useToast();
  const [csvUrl, setCsvUrl] = useState('');

  // Load saved URL when modal opens
  useEffect(() => {
    if (open) {
      const savedUrl = localStorage.getItem('recipes_csv_url');
      if (savedUrl) setCsvUrl(savedUrl);
    }
  }, [open]);

  const handleLoadCsv = () => {
    if (!csvUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid CSV URL.",
        variant: "destructive"
      });
      return;
    }

    // Save URL to persistence
    localStorage.setItem('recipes_csv_url', csvUrl.trim());
    
    // Trigger the load in the main App
    onRefreshCSV();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-emerald-500/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-400">Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          
          {/* CSV Input Section */}
          <div className="space-y-2">
            <Label htmlFor="csv-url">CSV File URL</Label>
            <div className="flex w-full gap-2">
              <input
                id="csv-url"
                type="text"
                value={csvUrl}
                onChange={(e) => setCsvUrl(e.target.value)}
                placeholder="https://example.com/recipes.csv"
                className="flex-grow bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-400 transition-colors"
              />
              <Button
                onClick={handleLoadCsv}
                className="bg-emerald-600 hover:bg-emerald-700 text-white whitespace-nowrap"
              >
                <UploadCloud className="h-4 w-4 mr-2" />
                Load CSV
              </Button>
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Required columns: id, name, meal_type, tags, calories, protein_g, fat_g, net_carbs_g, ingredients, instructions.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-500">Or use defaults</span>
            </div>
          </div>

          {/* Sample Data Section */}
          <div className="space-y-2">
            <Button
              onClick={onLoadSampleRecipes}
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              Load Sample Data
            </Button>
            <p className="text-xs text-slate-400 text-center">
              Resets to the built-in starter pack of 6 low-carb recipes.
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsModal;