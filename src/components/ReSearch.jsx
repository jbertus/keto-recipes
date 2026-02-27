
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useCredits } from '@/hooks/useCredits';
import { RefreshCw, Sparkles, Loader2 } from 'lucide-react';

export default function ReSearch({ onSearch, className = "" }) {
  const [includeAi, setIncludeAi] = useState(false);
  const [loading, setLoading] = useState(false);
  const { consumeCredits } = useCredits();

  const handleReSearch = async () => {
    setLoading(true);
    
    // Check credits ONLY if AI is enabled
    if (includeAi) {
        const result = await consumeCredits(5, 're_search_ai');
        if (!result) {
            setLoading(false);
            return;
        }
    } else {
        // Standard search (0 credits in this specific spec, though usually search costs)
        // Task 6 says: "If AI disabled: 0 units"
    }

    // Trigger parent search handler
    // In a real implementation, you'd pass the includeAi flag to the search function
    if (onSearch) {
        await onSearch({ includeAi });
    }
    
    setLoading(false);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-2 rounded-md border border-slate-800">
            <Checkbox 
                id="research-ai"
                checked={includeAi}
                onCheckedChange={setIncludeAi}
                className="border-slate-600 data-[state=checked]:bg-purple-600"
            />
            <label htmlFor="research-ai" className="text-xs font-medium text-purple-400 flex items-center gap-1 cursor-pointer select-none">
                <Sparkles className="w-3 h-3" /> Include AI
            </label>
        </div>

        <Button 
            onClick={handleReSearch} 
            disabled={loading}
            variant="outline"
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Re-Search
        </Button>
    </div>
  );
}
