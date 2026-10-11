import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { NotificationItem } from '../../types';
import { Bell, CheckCheck, Clock, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const NotificationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: responseData, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => api.notifications.list({ limit: 50 }),
  });

  const notifications: NotificationItem[] = responseData?.data || [];

  const markAllMutation = useMutation({
    mutationFn: () => api.notifications.markAllRead(),
    onSuccess: () => {
      toast.success('Marked as Read', 'All notifications marked as read.');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.notifications.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-['Outfit'] flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-[#790D16]" /> In-App Notification Center
          </h1>
          <p className="text-xs text-stone-600 mt-1">
            Real-time alerts for impending regulatory deadlines, overdue tasks, and contract renewals.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            isLoading={markAllMutation.isPending}
          >
            <CheckCheck className="w-4 h-4 mr-1" /> Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <LoadingSkeleton rows={5} />
            </div>
          ) : notifications.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-6 h-6 text-[#790D16]" />}
              title="All caught up"
              description="You have no notifications or urgent compliance reminders at this moment."
            />
          ) : (
            <div className="divide-y divide-stone-100">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) markOneMutation.mutate(n._id);
                  }}
                  className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer ${
                    !n.isRead ? 'bg-[#FAF7F0] hover:bg-[#F5EFE3]' : 'hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        n.type === 'overdue'
                          ? 'bg-rose-100 text-rose-700'
                          : n.type === 'expiry'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#FDF2F3] text-[#790D16]'
                      }`}
                    >
                      {n.type === 'overdue' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : n.type === 'expiry' ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 text-sm">{n.title}</span>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#790D16]" title="Unread" />
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
                        <span className="font-mono">
                          {new Date(n.createdAt).toLocaleDateString()} at{' '}
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {n.link && (
                          <Link
                            to={n.link}
                            className="text-[#790D16] font-semibold hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Open Record →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
