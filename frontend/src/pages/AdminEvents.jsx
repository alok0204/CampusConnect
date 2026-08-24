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
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'pending':
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1">
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
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            <span>Campus Admin Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Event Moderation & Approvals
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Review student and club event proposals, verify safety and schedule compliance, and approve listings for the campus feed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/events"
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs hover:bg-slate-700 transition-colors"
          >
            Live Events Feed →
          </Link>
        </div>
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
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
            className={`pb-3 px-3.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] ${
                tab.alert
                  ? 'bg-amber-100 text-amber-800 font-extrabold'
                  : activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse p-5"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Queue is Clear!</h3>
          <p className="text-xs text-slate-500">
            No events found in {activeTab !== 'all' ? activeTab : ''} category.
          </p>
        </div>
      ) : (
        /* Events Table / Cards */
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 transition-all hover:border-slate-300 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={getImageUrl(event.image)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-extrabold uppercase">
                        {event.category}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        Audience: {event.branch === 'ALL' ? 'College-wide' : `${event.branch} Only`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{event.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl">
                      {event.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
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
                <div className="flex flex-row lg:flex-col lg:items-end justify-between items-center gap-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                  {getStatusBadge(event.status)}
                  <div className="flex items-center gap-2 text-right text-[11px] text-slate-500">
                    <div>
                      <p className="font-semibold text-slate-700">
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
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Rejection Reason: </strong>
                    <span>{event.rejectionReason}</span>
                  </div>
                </div>
              )}

              {/* Administrative Action Bar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400">
                  Organizer: <strong className="text-slate-700">{event.organizer}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/events/${event._id}`}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
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
                        className="px-3.5 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(event._id)}
                        disabled={actionLoading}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        Approve
                      </button>
                    </>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(event._id)}
                    disabled={actionLoading}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reject Event Submission</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Enter an administrative reason for rejection. This feedback will be sent directly to the creator's dashboard.
            </p>
            <form onSubmit={handleReject} className="space-y-3">
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Schedule clash with college mid-term exam schedule."
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:bg-white"
              ></textarea>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
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
