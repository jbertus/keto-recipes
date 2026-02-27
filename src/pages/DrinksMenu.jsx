import React, { useState, useMemo } from 'react';
import { Search, GlassWater, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import DrinkCard from '@/components/DrinkCard';
import { DRINKS_DATA } from '@/data/drinksData';

export default function DrinksMenu() {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

    const filteredDrinks = useMemo(() => {
        let result = DRINKS_DATA.filter(drink => 
            drink.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            drink.tonic.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
            drink.creamy.desc.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        result.sort((a, b) => {
            return sortOrder === 'asc' 
                ? a.title.localeCompare(b.title)
                : b.title.localeCompare(a.title);
        });

        return result;
    }, [searchQuery, sortOrder]);

    return (
        <div className="min-h-full flex flex-col bg-white dark:bg-[#0B1120]">
            {/* Header & Controls */}
            <div className="sticky top-0 z-20 bg-white dark:bg-[#131B2D] border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between gap-4 items-center max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-3">
                         <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg">
                             <GlassWater className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                         </div>
                         <div>
                             <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-none">Functional Drinks</h1>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">40 targeted blends for every need</p>
                         </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                                placeholder="Find support for..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-700"
                            />
                        </div>
                        <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="shrink-0 border-slate-200 dark:border-slate-700"
                            title="Sort Alphabetically"
                        >
                            <ArrowUpDown className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="flex-1 w-full bg-slate-50/50 dark:bg-[#0B1120]">
                <div className="max-w-7xl mx-auto p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredDrinks.map(drink => (
                            <div key={drink.id} className="h-full">
                                <DrinkCard drink={drink} />
                            </div>
                        ))}
                        
                        {filteredDrinks.length === 0 && (
                            <div className="col-span-full py-12 text-center text-slate-500">
                                <p>No drinks found matching "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}