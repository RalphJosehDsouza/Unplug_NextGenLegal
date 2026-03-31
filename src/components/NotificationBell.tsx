import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bell, Check } from 'lucide-react';

import api from '@/api/axios';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  type: 'compliance' | 'booking' | 'system';
  resource_id: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const prevUnreadRef = useRef<number>(0);

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/api/notifications')).data.data as { unreadCount: number; notifications: NotificationRow[] },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const unread = query.data?.unreadCount ?? 0;
  const notifications = query.data?.notifications ?? [];

  useEffect(() => {
    const prev = prevUnreadRef.current;
    if (unread > prev) {
      // Ask permission once on increase.
      if ('Notification' in window) {
        const show = () => {
          try {
            const latest = notifications.find((n) => !n.read);
            if (latest) {
              new window.Notification(latest.title, { body: latest.body });
            }
          } catch {
            // ignore
          }
        };

        if (window.Notification.permission === 'granted') {
          show();
        } else if (window.Notification.permission === 'default') {
          window.Notification.requestPermission().then((p) => {
            if (p === 'granted') show();
          });
        }
      }
    }
    prevUnreadRef.current = unread;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread]);

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      toast.success('Marked all as read');
      query.refetch();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
      toast.error(message);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-gray-700" />
          {unread > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] font-bold flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-900">Notifications</div>
          <button onClick={markAllRead} className="text-xs text-red-600 hover:text-red-700 font-semibold">
            Mark all read
          </button>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {query.isLoading ? (
            <div className="text-sm text-gray-500 py-8 text-center">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">No notifications</div>
          ) : (
            notifications.slice(0, 10).map((n) => (
              <div key={n.id} className="border border-gray-100 rounded-xl p-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                      {!n.read ? <span className="w-2 h-2 rounded-full bg-red-600" /> : <Check className="w-3.5 h-3.5 text-gray-300" />}
                      {n.title}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">{n.body}</div>
                  </div>
                  <div className="text-[11px] text-gray-400 whitespace-nowrap">{timeAgo(n.created_at)}</div>
                </div>
                <div className="mt-2">
                  <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-100">
                    {n.type}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-3">
          <Button variant="outline" className="w-full border-red-200 text-red-700 hover:bg-red-50" onClick={() => (window.location.href = '/compliance')}>
            View compliance dashboard
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

