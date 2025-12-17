'use client';

import { useEffect, useState, useRef } from 'react';

export function useTabVisibility() {
  const [wasTabInactive, setWasTabInactive] = useState(false);
  const isVisibleRef = useRef(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        setWasTabInactive(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const resetTracking = () => {
    setWasTabInactive(false);
    isVisibleRef.current = true;
  };

  return { wasTabInactive, resetTracking, isTabActive: isVisibleRef.current };
}
