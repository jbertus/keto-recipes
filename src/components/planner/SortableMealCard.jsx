
import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getRecipeImageUrl } from '@/lib/imageUtils';

export default function SortableMealCard({ meal, index, onRemove, onEdit }) {
  const [isHovered, setIsHovered] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id: meal.id,
    data: meal 
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
  };
  
  const scale = Number(meal.scale) || 1;
  const calories = Math.round((Number(meal.calories) || Number(meal.calories_per_serving) || 0) * scale);
  const protein = Math.round((Number(meal.protein) || Number(meal.protein_per_serving_g) || 0) * scale);
  const carbs = Math.round((Number(meal.carbs) || Number(meal.net_carbs_per_serving_g) || 0) * scale);
  const fat = Math.round((Number(meal.fat) || Number(meal.fat_per_serving_g) || 0) * scale); 

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "relative group mb-3 touch-none", 
        isDragging && "z-50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onEdit && onEdit(meal)} 
    >
      <Card className={cn(
          "bg-[#1E293B] border-slate-800 overflow-hidden hover:border-slate-600 transition-colors",
          isDragging ? "ring-2 ring-cyan-500 border-transparent shadow-xl" : ""
      )}>
        <div className="flex items-stretch h-20">
          {/* Drag Handle */}
          <div 
              {...attributes} 
              {...listeners}
              className="w-10 md:w-8 bg-slate-900/50 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-800 transition-colors border-r border-slate-800/50 touch-none"
              title="Drag to reorder"
              onClick={(e) => e.stopPropagation()} 
          >
              <GripVertical className="w-5 h-5 md:w-4 md:h-4 text-slate-500" />
          </div>

          {/* Image */}
          <div className="w-20 relative shrink-0 cursor-pointer">
              <img 
                src={getRecipeImageUrl(meal)} 
                alt={meal.name}
                className="w-full h-full object-cover"
              />
          </div>
          
          {/* Content */}
          <div className="flex-1 p-2 pl-3 flex flex-col justify-center min-w-0 cursor-pointer">
              <h4 className="font-medium text-slate-200 text-sm truncate pr-6">{meal.name}</h4>
              
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant="secondary" className="bg-slate-900 text-slate-400 text-[10px] px-1.5 h-5 font-normal border border-slate-800">
                  {calories} cal
                </Badge>
                <div className="flex gap-1.5 text-[10px] text-slate-500">
                    <span className="text-blue-400 font-medium">{protein}p</span>
                    <span className="text-emerald-400 font-medium">{carbs}c</span>
                    <span className="text-amber-400 font-medium">{fat}f</span> 
                </div>
              </div>
          </div>

          {/* Remove Button (Hover only) */}
          <div className={cn(
            "absolute top-1 right-1 transition-opacity duration-200", 
            isHovered && !isDragging ? "opacity-100" : "opacity-0 lg:opacity-0"
          )}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full"
              onClick={(e) => {
                e.stopPropagation();
                onRemove && onRemove(meal.id);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
