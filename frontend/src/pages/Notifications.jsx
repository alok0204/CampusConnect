import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Calendar,
  SearchCheck,
  Megaphone,
  Users,
  Shield,
  Clock,
  Check,
  Trash2,
  ExternalLink,
  Filter,
  Flame,
  Activity,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const Notifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'event', 'lost_found', 'announcement', 'club', 'activity'
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Activity Stream State
  const [activities, setActivities] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivityStream();
    } else {
      fetchNotifications();
    }
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (activeTab === 'unread') {
        params.append('isRead', 'false');
      } else if (activeTab !== 'all') {
        params.append('type', activeTab);
      }

      const res = await api.get(`/notifications?${params.toString()}`);
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityStream = async () => {
    try {
      setLoadingActivity(true);
      const res = await api.get('/notifications/activity');
      if (res.data.success) {
        setActivities(res.data.activities);
      }
    } catch (err) {
      console.error('Error loading activity stream:', err);
      setError('Could not load recent activity history.');
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.put('/notifications/mark-all-read');
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        setSuccessMsg('All notifications marked as read.');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setError('Failed to mark all as read.');
    }
  };

  const handleDeleteNotification = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif._id);
    }
    if (notif.metadata?.actionUrl) {
      navigate(notif.metadata.actionUrl);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'event':
        return <Calendar className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      case 'lost_found':
        return <SearchCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-slate-700 dark:text-slate-300" />;
      case 'club':
        return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getTypeBadge = (type) => {
    const map = {
      event: { label: 'Event', bg: 'bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#333333]' },
      lost_found: { label: 'Lost & Found', bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60' },
      announcement: { label: 'Notice', bg: 'bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border-slate-200 dark:border-[#333333]' },
      club: { label: 'Club', bg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60' },
      system: { label: 'System', bg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
      admin: { label: 'Admin', bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60' },
    };
    const style = map[type] || map.system;
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase border ${style.bg}`}>
        {style.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 text-[10px] font-semibold uppercase animate-pulse">
          <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          <span>Urgent</span>
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-semibold uppercase">
          Important
        </span>
      );
    }
    return null;
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tabs = [
    { id: 'all', label: 'All Notifications' },
    { id: 'unread', label: `Unread (${unreadCount})` },
    { id: 'event', label: 'Events' },
    { id: 'lost_found', label: 'Lost & Found' },
    { id: 'announcement', label: 'Announcements' },
    { id: 'club', label: 'Clubs' },
    { id: 'activity', label: 'Activity Center' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Activity & Notification Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Notifications & Updates
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-normal text-xs sm:text-sm mt-1 max-w-xl">
            Stay informed on event approvals, ownership claim verifications, official circular broadcasts, and club memberships.
          </p>
        </div>

        {unreadCount > 0 && activeTab !== 'activity' && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs transition-colors shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-black shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#212121] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.id === 'activity' && <Activity className="w-3.5 h-3.5" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content */}
      {activeTab === 'activity' ? (
        /* ACTIVITY CENTER STREAM */
        <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-[#262626] shadow-xs p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Campus Activity Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidated chronological audit trail of your submissions, claims, and club memberships.
            </p>
          </div>

          {loadingActivity ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading recent activity timeline...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-[#262626] rounded-xl">
              No recent campus activity recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-[#262626] space-y-5 my-4">
              {activities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-white dark:bg-[#121212] border-2 border-slate-900 dark:border-white group-hover:scale-125 transition-transform"></div>

                  <div className="bg-slate-50 dark:bg-[#181818] hover:bg-slate-100/70 dark:hover:bg-[#212121] border border-slate-200 dark:border-[#262626] hover:border-slate-300 dark:hover:border-[#383838] rounded-xl p-4 transition-all">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#212121] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#333333] font-semibold text-[10px] uppercase">
                          {act.module}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{act.action}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{act.title}</p>
                      {act.actionUrl && (
                        <Link
                          to={act.actionUrl}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-900 dark:text-white hover:underline shrink-0"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* NOTIFICATIONS LIST */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading notification updates...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-14 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Notifications Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You're all caught up! Updates regarding events, items, announcements, and clubs will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 flex items-start gap-3.5 transition-colors cursor-pointer hover:bg-slate-50/80 dark:hover:bg-[#181818] ${
                  !notif.isRead
                    ? 'bg-slate-100/60 dark:bg-[#1a1a1a] border-l-3 border-slate-900 dark:border-white'
                    : ''
                }`}
              >
                {/* Module Icon */}
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#212121] flex items-center justify-center shrink-0">
                  {getTypeIcon(notif.type)}
                </div>

                {/* Content Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {getTypeBadge(notif.type)}
                    {getPriorityBadge(notif.priority)}
                    <span className="text-[11px] text-slate-400 font-medium ml-auto">
                      {formatTimeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                    {notif.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.metadata?.actionUrl && (
                    <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-slate-900 dark:text-white hover:underline">
                      <span>Take Action</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#262626] transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notif._id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
