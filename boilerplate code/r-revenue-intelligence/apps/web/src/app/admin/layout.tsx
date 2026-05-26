'use client';

import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only load the CSS if it's not already loaded
    if (!document.querySelector('link[href="/m05-styles.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/m05-styles.css';
      link.id = 'm05-poc-css';
      document.head.appendChild(link);
    }
    
    // We intentionally don't remove the CSS on unmount if navigating between POC pages.
    // However, if the user returns to the main boilerplate dashboard ('/'), 
    // the boilerplate doesn't have a reliable way to remove it unless we handle it here.
    return () => {
      // Small timeout to see if we're navigating to another POC page
      setTimeout(() => {
        if (!window.location.pathname.startsWith('/board') && !window.location.pathname.startsWith('/admin')) {
          const cssLink = document.getElementById('m05-poc-css');
          if (cssLink) cssLink.remove();
        }
      }, 100);
    };
  }, []);

  return <>{children}</>;
}
