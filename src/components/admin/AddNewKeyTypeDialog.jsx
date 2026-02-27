
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AddNewKeyTypeDialog({ open, onOpenChange, onSave }) {
  const [typeName, setTypeName] = useState('');

  const handleSave = () => {
    if (typeName.trim()) {
      onSave(typeName.trim());
      setTypeName('');
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f172a] border-slate-800 text-slate-200 w-[95vw] max-w-sm">
        <DialogHeader>
          <DialogTitle>Add Custom Service Type</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the name of the new API service provider (e.g., "Midjourney", "Stability AI").
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="type-name">Service Name</Label>
            <Input 
              id="type-name"
              value={typeName}
              onChange={(e) => setTypeName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Midjourney"
              className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              autoFocus
              autoComplete="off"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!typeName.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Service Type
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
