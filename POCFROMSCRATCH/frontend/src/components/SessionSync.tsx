'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionStore } from '@/store/useSessionStore';

export default function SessionSync() {
  const router = useRouter();
  const pathname = usePathname();
  
  const role = useSessionStore((s) => s.role);
  const activeBoard = useSessionStore((s) => s.activeBoard);
  const activeTabId = useSessionStore((s) => s.activeTabId);
  const setActiveTabId = useSessionStore((s) => s.setActiveTabId);
  const sortField = useSessionStore((s) => s.sortField);
  const setSortField = useSessionStore((s) => s.setSortField);
  const sortDir = useSessionStore((s) => s.sortDir);
  const setSortDir = useSessionStore((s) => s.setSortDir);
  const pageSize = useSessionStore((s) => s.pageSize);
  const setPageSize = useSessionStore((s) => s.setPageSize);
  const setActiveBoard = useSessionStore((s) => s.setActiveBoard);

  const prevRole = useRef(role);
  const isHydrating = useRef(false);

  // Sync role change -> fetch last board -> navigate
  useEffect(() => {
    if (prevRole.current !== role) {
      prevRole.current = role;
      fetch(`http://localhost:3001/preferences/${role}/last-board`)
        .then(async (res) => {
          if (!res.ok) return null;
          const text = await res.text();
          return text ? JSON.parse(text) : null;
        })
        .then((data) => {
          if (data && data.board_id) {
            router.push(`/board/${data.board_id}`);
          }
        })
        .catch(console.error);
    }
  }, [role, router]);

  // Sync on mount or board change -> fetch preferences for this board
  useEffect(() => {
    if (!pathname.startsWith('/board/')) return;
    const boardId = pathname.split('/board/')[1];
    
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
          if (boardPref.active_tab_id) setActiveTabId(boardPref.active_tab_id);
          if (boardPref.sort_field) setSortField(boardPref.sort_field);
          if (boardPref.sort_dir) setSortDir(boardPref.sort_dir);
          if (boardPref.page_size) setPageSize(boardPref.page_size);
        }
        
        // Also ensure activeBoard is correct in store
        if (activeBoard !== boardId) setActiveBoard(boardId);
        
        // Let the state setters finish before unblocking writes
        setTimeout(() => {
          isHydrating.current = false;
        }, 100);
      })
      .catch((err) => {
        console.error(err);
        isHydrating.current = false;
      });
  }, [pathname, role]); // Only on route or role change

  // Write changes to backend
  useEffect(() => {
    if (isHydrating.current) return;
    if (!activeBoard) return;

    const timeout = setTimeout(() => {
      fetch(`http://localhost:3001/preferences/${role}/${activeBoard}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active_tab_id: activeTabId,
          sort_field: sortField,
          sort_dir: sortDir,
          page_size: pageSize,
        }),
      }).catch(console.error);
    }, 500); // debounce writes

    return () => clearTimeout(timeout);
  }, [activeBoard, activeTabId, sortField, sortDir, pageSize, role]);

  return null;
}
