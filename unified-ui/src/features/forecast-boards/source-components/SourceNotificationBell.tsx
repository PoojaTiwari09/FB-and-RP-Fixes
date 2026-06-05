'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { M06_API_BASE } from '../services/m06-api';
import { formatCurrency } from '../source-utils/format';

interface Notification {
  id: string;
  repId: string;
  submissionId: string;
  actionType: 'approved' | 'reopened' | 'overridden';
  dealName: string;
  finalValue: number | null;
  isSeen: boolean;
  createdAt: string;
}

interface Props {
  repUserId: string;
}

export default function SourceNotificationBell({ repUserId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${M06_API_BASE}/boards/notifications/${repUserId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setNotifications(json.data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  const markAsSeen = async (id: string) => {
    try {
      const res = await fetch(`${M06_API_BASE}/boards/notifications/${id}/seen`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (e) {
      console.error('Failed to mark notification as seen:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10s
    return () => clearInterval(interval);
  }, [repUserId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-150 cursor-pointer outline-none"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-extrabold rounded-full h-4 w-4 flex items-center justify-center border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-150 bg-gray-50/50 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-800">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-500 italic">
                No new notifications.
              </div>
            ) : (
              notifications.map((n) => {
                let icon = <Clock size={14} className="text-amber-500" />;
                let title = '';
                let bgClass = 'bg-amber-50/40';

                if (n.actionType === 'approved') {
                  icon = <Check size={14} className="text-green-600" />;
                  title = 'Forecast Approved';
                  bgClass = 'bg-green-50/20';
                } else if (n.actionType === 'reopened') {
                  icon = <RefreshCw size={14} className="text-purple-600" />;
                  title = 'Forecast Reopened';
                  bgClass = 'bg-purple-50/20';
                } else if (n.actionType === 'overridden') {
                  icon = <AlertTriangle size={14} className="text-yellow-600" />;
                  title = 'Forecast Overridden';
                  bgClass = 'bg-yellow-50/20';
                }

                return (
                  <div key={n.id} className={`p-3.5 flex flex-col gap-1.5 transition-colors hover:bg-gray-50/60 ${bgClass}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {icon}
                        <span className="text-[11px] font-bold text-gray-800">{title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => markAsSeen(n.id)}
                        className="text-[10px] text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                      >
                        Mark as Seen
                      </button>
                    </div>
                    <div className="text-[11px] text-gray-600">
                      Your forecast for <span className="font-semibold text-gray-800">{n.dealName}</span>{' '}
                      {n.actionType === 'reopened' ? (
                        <span>has been reopened for editing.</span>
                      ) : (
                        <span>
                          was finalized at{' '}
                          <span className="font-bold text-gray-900">{formatCurrency(n.finalValue ?? 0)}</span>.
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-gray-400 self-end">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
