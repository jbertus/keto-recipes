import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

/**
 * Enhanced Image component with lazy loading, fallback, and loading states.
 */
const LazyImage = ({ src, alt, className, containerClassName }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-slate-800", containerClassName)}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 animate-pulse">
           <ImageIcon className="w-8 h-8 text-slate-600 opacity-50" />
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
          <ImageIcon className="w-8 h-8 text-slate-600" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
        />
      )}
    </div>
  );
};

export default LazyImage;