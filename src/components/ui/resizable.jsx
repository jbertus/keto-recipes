import React from 'react';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

const ResizablePanelGroup = ({ children, direction = "horizontal", className, ...props }) => {
  return (
    <div 
      className={cn(
        "flex h-full w-full overflow-hidden", 
        direction === "vertical" ? "flex-col" : "flex-row",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  );
};

const ResizablePanel = ({ children, defaultSize = 50, minSize = 10, maxSize = 90, className, ...props }) => {
  return (
    <div 
      className={cn("relative flex-1 overflow-hidden", className)}
      style={{ flexBasis: `${defaultSize}%` }}
      {...props}
    >
      {children}
    </div>
  );
};

const ResizableHandle = ({ withHandle, className, ...props }) => {
  return (
    <div 
      className={cn(
        "relative flex items-center justify-center bg-slate-200 dark:bg-slate-800 transition-colors hover:bg-cyan-500/50",
        "w-1 cursor-col-resize z-10", 
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </div>
  );
};

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };