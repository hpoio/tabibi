'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { api } from '@/lib/api';

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  items: NotificationItem[];
  total: number;
  unreadCount: number;
};

function playBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.error('Audio playback failed:', e);
  }
}

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const prevUnread = useRef<number | null>(null);

  const fetchNotifications = async () => {
    try {
      const data = await api.get<NotificationsResponse>('/notifications');
      setItems(data.items);
      if (prevUnread.current !== null && data.unreadCount > prevUnread.current) {
        playBeep();
      }
      prevUnread.current = data.unreadCount;
      setUnreadCount(data.unreadCount);
    } catch (e) {
      console.error('fetchNotifications failed:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (e) {
      console.error('markRead failed:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (e) {
      console.error('markAllRead failed:', e);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="الإشعارات"
        className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-accent-soft text-foreground/60 relative"
      >
        <Bell className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-background rounded-xl border border-border shadow-lg z-20">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <span className="text-sm font-medium">الإشعارات</span>
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            </div>

            {items.length === 0 && (
              <p className="p-4 text-center text-sm text-foreground/40">لا توجد إشعارات</p>
            )}

            {items.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                className={`px-3 py-2.5 border-b border-border last:border-b-0 ${
                  n.isRead ? '' : 'bg-accent-soft cursor-pointer'
                }`}
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-foreground/50 mt-0.5">{n.message}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
