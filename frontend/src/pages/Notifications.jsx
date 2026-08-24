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
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'lost_found':
        return <SearchCheck className="w-4 h-4 text-amber-600" />;
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-purple-600" />;
      case 'club':
        return <Users className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeBadge = (type) => {
    const map = {
      event: { label: 'Event', bg: 'bg-blue-50 text-blue-700' },
      lost_found: { label: 'Lost & Found', bg: 'bg-amber-50 text-amber-700' },
      announcement: { label: 'Notice', bg: 'bg-purple-50 text-purple-700' },
      club: { label: 'Club', bg: 'bg-emerald-50 text-emerald-700' },
      system: { label: 'System', bg: 'bg-slate-100 text-slate-700' },
      admin: { label: 'Admin', bg: 'bg-red-50 text-red-700' },
    };
    const style = map[type] || map.system;
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${style.bg}`}>
        {style.label}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold uppercase animate-pulse">
          <Flame className="w-3 h-3 text-red-600" />
          <span>Urgent</span>
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
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
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>Activity & Notification Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Notifications & Updates
          </h1>
          <p className="text-slate-400 font-medium text-xs sm:text-sm mt-1 max-w-xl">
            Stay informed on event approvals, ownership claim verifications, official circular broadcasts, and club memberships.
          </p>
        </div>

        {unreadCount > 0 && activeTab !== 'activity' && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors backdrop-blur-sm shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Your Campus Activity Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidated chronological audit trail of your submissions, claims, and club memberships.
            </p>
          </div>

          {loadingActivity ? (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading recent activity timeline...
            </div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              No recent campus activity recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 my-4">
              {activities.map((act) => (
                <div key={act.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-blue-600 group-hover:scale-125 transition-transform"></div>

                  <div className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200/80 hover:border-blue-200 rounded-2xl p-4 transition-all">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase">
                          {act.module}
                        </span>
                        <span className="text-xs font-bold text-slate-700">{act.action}</span>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatTimeAgo(act.timestamp)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-4">
                      <p className="text-sm font-bold text-slate-900">{act.title}</p>
                      {act.actionUrl && (
                        <Link
                          to={act.actionUrl}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 shrink-0"
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
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
              Loading notification updates...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No Notifications Found</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                You're all caught up! Updates regarding events, items, announcements, and clubs will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                  !notif.isRead ? 'bg-blue-50/40 border-l-4 border-blue-600' : ''
                }`}
              >
                {/* Module Icon */}
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
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

                  <h4 className={`text-sm ${!notif.isRead ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                    {notif.title}
                  </h4>

                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.metadata?.actionUrl && (
                    <div className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
                      <span>Take Action</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  {!notif.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(notif._id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDeleteNotification(notif._id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
