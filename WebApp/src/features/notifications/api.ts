import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { apiRequest } from '@/api/client';
import { qk } from '@/api/queryKeys';
import { useAppMutation } from '@/api/useAppMutation';
import type { AppNotification, Page } from '@/domain/types';

export type NotificationFilter = { filter?: 'unread'; type?: 'BOOKING' | 'PAYMENT' | 'SYSTEM' };

const enc = encodeURIComponent;

export const notificationsService = {
  list: (f: NotificationFilter, cursor?: string | null) =>
    apiRequest<Page<AppNotification>>('/api/notifications', { query: { ...f, cursor: cursor ?? undefined, limit: 20 } }),
  get: (id: string) => apiRequest<AppNotification>(`/api/notifications/${enc(id)}`),
  unreadCount: () => apiRequest<{ count: number }>('/api/notifications/unread-count'),
  markRead: (id: string) => apiRequest<AppNotification>(`/api/notifications/${enc(id)}/read`, { method: 'POST' }),
  markUnread: (id: string) => apiRequest<AppNotification>(`/api/notifications/${enc(id)}/unread`, { method: 'POST' }),
  markAllRead: () => apiRequest<void>('/api/notifications/read-all', { method: 'POST' }),
};

export function useNotifications(f: NotificationFilter) {
  return useInfiniteQuery({
    queryKey: [...qk.notifications, 'list', f],
    queryFn: ({ pageParam }) => notificationsService.list(f, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: 30_000,
  });
}

export function useNotification(id: string) {
  return useQuery({ queryKey: [...qk.notifications, 'detail', id], queryFn: () => notificationsService.get(id) });
}

export function useUnreadCount() {
  return useQuery({ queryKey: [...qk.notifications, 'unread'], queryFn: notificationsService.unreadCount, staleTime: 30_000, refetchInterval: 120_000 });
}

export function useMarkRead() {
  return useAppMutation({ mutationFn: notificationsService.markRead, invalidate: [qk.notifications], errorTitle: "Couldn't update notification" });
}

export function useMarkUnread() {
  return useAppMutation({ mutationFn: notificationsService.markUnread, invalidate: [qk.notifications], successMessage: 'Marked as unread', errorTitle: "Couldn't update notification" });
}

export function useMarkAllRead() {
  return useAppMutation({ mutationFn: notificationsService.markAllRead, invalidate: [qk.notifications], successMessage: 'All caught up', errorTitle: "Couldn't update notifications" });
}
