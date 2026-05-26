'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSessionStore } from '@/modules/m05-account-intelligence/store/useSessionStore';

/**
 * SessionSync — syncs board preferences (sort, pageSize) to/from the backend.
 * 
 * IMPORTANT: This component does NOT handle role-change redirects.
 * Role-change redirect is handled by the role button onClick in the board page.
 * Putting it here caused false redirects because Zustand hydration from
 * localStorage looks identical to a user-initiated role change.
 */
export default function SessionSync() {
  const pathname = usePathname();
  
  const role = useSessionStore((s) => s.role);
  const activeTabId = useSessionStore((s) => s.activeTabId);
  const sortField = useSessionStore((s) => s.sortField);
  const setSortField = useSessionStore((s) => s.setSortField);
  const sortDir = useSessionStore((s) => s.sortDir);
  const setSortDir = useSessionStore((s) => s.setSortDir);
  const pageSize = useSessionStore((s) => s.pageSize);
  const setPageSize = useSessionStore((s) => s.setPageSize);
  const setActiveBoard = useSessionStore((s) => s.setActiveBoard);

  const isHydrating = useRef(false);

  // Read preferences (sort, pageSize) for the current board from backend
  useEffect(() => {
    if (!pathname.startsWith('/board/')) return;
    const boardId = pathname.split('/board/')[1];
    if (!boardId) return;
    
    isHydrating.current = true;
    fetch(`http://localhost:3001/preferences/${role}`)
      .then(async (res) => {
        if (!res.ok) return {};
        const text = await res.text();
        return text ? JSON.parse(text) : {};
      })
      .then((data) => {
        const prefs = data.preferences || [];
        const boardPref = prefs.find((p: any) => p.board_id === boardId);
        
        if (boardPref) {
          if (boardPref.sort_field) setSortField(boardPref.sort_field);
          if (boardPref.sort_dir) setSortDir(boardPref.sort_dir);
          if (boardPref.page_size) setPageSize(boardPref.page_size);
        }
        
        // Ensure activeBoard in store matches the URL
        setActiveBoard(boardId);
        
        setTimeout(() => {
          isHydrating.current = false;
        }, 100);
      })
      .catch((err) => {
        console.error(err);
        isHydrating.current = false;
      });
  }, [pathname, role]);

  // Write preference changes to backend (debounced)
  useEffect(() => {
    if (isHydrating.current) return;
    if (!pathname.startsWith('/board/')) return;
    const boardSlug = pathname.split('/board/')[1];
    if (!boardSlug) return;

    const timeout = setTimeout(() => {
      fetch(`http://localhost:3001/preferences/${role}/${boardSlug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_tab_id: activeTabId,
          sort_field: sortField,
          sort_dir: sortDir,
          page_size: pageSize,
        }),
      }).catch(console.error);
    }, 500);

    return () => clearTimeout(timeout);
  }, [activeTabId, sortField, sortDir, pageSize, role, pathname]);

  return null;
}
