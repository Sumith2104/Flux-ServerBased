
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Progress } from '@/components/ui/progress';

export function PageLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // This effect handles the start of navigation.
    // We use a state `loading` to track if a route change is in progress.
    // The `pathname` dependency ensures this runs on every URL change.
    setLoading(true);
    setProgress(10); // Start the progress bar
    
    // We don't have a direct `routeChangeStart` event here, but the change in pathname
    // serves as the starting signal for our loader.
  }, [pathname]);

  useEffect(() => {
    // This effect manages the progress bar animation and completion.
    if (loading) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(timer);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 200);

      // This is a simulation of `routeChangeComplete`.
      // We assume loading is done when the component has re-rendered
      // and a short delay has passed. A real app might use more complex state management.
      const completeTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
            setLoading(false);
        }, 500); // Wait a bit after 100% to let user see it's done
      }, 1500); // Simulate a minimum load time

      return () => {
        clearInterval(timer);
        clearTimeout(completeTimer);
      };
    }
  }, [loading]);

  if (!loading) return null;

  return (
    <div className="fixed bottom-4 right-4 w-64 z-50">
      <div className="p-3 bg-card border rounded-lg shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">Loading page...</p>
        <Progress value={progress} className="w-full" />
      </div>
    </div>
  );
}
