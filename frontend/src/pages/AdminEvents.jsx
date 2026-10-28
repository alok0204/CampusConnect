import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import Avatar from '../components/Avatar';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Calendar,
  MapPin,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

export const AdminEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');

  // Reject modal state
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  useEffect(() => {
    fetchAdminEvents();
  }, [activeTab]);

  const fetchAdminEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.append('status', activeTab);
      if (search && search.trim()) params.append('search', search.trim());

      const res = await api.get(`/events/admin/all?${params.toString()}`);
      if (res.data.success) {
        setEvents(res.data.events);
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load admin events:', err);
      setError('Could not fetch events for administrative review.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      const res = await api.put(`/events/${id}/approve`);
      if (res.data.success) {
        setActionMsg('Event approved successfully! It is now visible to students in the feed.');
        fetchAdminEvents();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingId) return;

    try {
      setActionLoading(true);
      const res = await api.put(`/events/${rejectingId}/reject`, { rejectionReason });
      if (res.data.success) {
        setActionMsg('Event rejected. Rejection notice dispatched to the student creator.');
        setRejectingId(null);
        setRejectionReason('');
        fetchAdminEvents();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this event?')) return;
    try {
      setActionLoading(true);
      const res = await api.delete(`/events/${id}`);
      if (res.data.success) {
        setActionMsg('Event deleted from system.');
        fetchAdminEvents();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1">
            <Ban className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold mb-2 border border-rose-200/60 dark:border-rose-800/60">
            <Shield className="w-3.5 h-3.5 text-rose-500" />
            <span>Campus Admin Console</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Event Moderation & Approvals
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl font-normal">
            Review student and club event proposals, verify schedule compliance, and approve listings for the campus feed.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/events"
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Live Events Feed →
          </Link>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        {[
          { key: 'pending', label: 'Pending Approvals', count: counts.pending, alert: counts.pending > 0 },
          { key: 'approved', label: 'Approved Events', count: counts.approved },
          { key: 'rejected', label: 'Rejected Events', count: counts.rejected },
          { key: 'cancelled', label: 'Cancelled Events', count: counts.cancelled },
          { key: 'all', label: 'All Submissions', count: counts.all },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 px-3.5 text-xs font-semibold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                tab.alert
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                  : activeTab === tab.key
                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse p-5"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Queue is Clear!</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No events found in {activeTab !== 'all' ? activeTab : ''} category.
          </p>
        </div>
      ) : (
        /* Events Table / Cards */
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 transition-all hover:border-slate-300 dark:hover:border-slate-700 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200/80 dark:border-slate-700/80">
                    <img
                      src={getImageUrl(event.image)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold uppercase">
                        {event.category}
                      </span>
                      <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                      <span className="text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
                        Audience: {event.branch === 'ALL' ? 'College-wide' : `${event.branch} Only`}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">{event.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {event.startTime} - {event.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {event.venue}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submitter details and Status */}
                <div className="flex flex-row lg:flex-col lg:items-end justify-between items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                  {getStatusBadge(event.status)}
                  <div className="flex items-center gap-2 text-right text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {event.creator?.name}
                      </p>
                      <p className="text-slate-400">
                        {event.creator?.email}
                      </p>
                    </div>
                    <Avatar user={event.creator} size="sm" />
                  </div>
                </div>
              </div>

              {/* Rejection reason display if rejected */}
              {event.status === 'rejected' && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">Rejection Reason: </strong>
                    <span>{event.rejectionReason}</span>
                  </div>
                </div>
              )}

              {/* Administrative Action Bar */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Organizer: <strong className="text-slate-700 dark:text-slate-300">{event.organizer}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/events/${event._id}`}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    View Details
                  </Link>

                  {/* If pending: Approve / Reject buttons */}
                  {event.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          setRejectingId(event._id);
                          setRejectionReason('');
                        }}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-semibold text-xs transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(event._id)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
                      >
                        Approve
                      </button>
                    </>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(event._id)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Reject Event Submission</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter an administrative reason for rejection. This feedback will be sent directly to the creator's dashboard.
            </p>
            <form onSubmit={handleReject} className="space-y-3">
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Schedule clash with college mid-term exam schedule."
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              ></textarea>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
