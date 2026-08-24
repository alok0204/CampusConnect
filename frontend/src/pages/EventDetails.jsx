import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageViewerModal from '../components/ImageViewerModal';
import Avatar from '../components/Avatar';
import { getImageUrl } from '../utils/imageUrl';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Trash2,
  Ban,
  Building,
  Sparkles,
  Share2,
  AlertTriangle,
  Maximize2,
} from 'lucide-react';

export const EventDetails = () => {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/events/${id}`);
      if (res.data.success) {
        setEvent(res.data.event);
      }
    } catch (err) {
      console.error('Failed to load event details:', err);
      setError(
        err.response?.data?.message ||
          'Could not load event details or you are not authorized to view this event.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const res = await api.put(`/events/${id}/approve`);
      if (res.data.success) {
        setActionMsg('Event approved successfully! It is now live in the campus feed.');
        setEvent(res.data.event);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      const res = await api.put(`/events/${id}/reject`, { rejectionReason });
      if (res.data.success) {
        setShowRejectModal(false);
        setActionMsg('Event rejected. Rejection reason recorded.');
        setEvent(res.data.event);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this event?')) return;
    try {
      setActionLoading(true);
      const res = await api.put(`/events/${id}/cancel`);
      if (res.data.success) {
        setActionMsg('Event has been cancelled.');
        setEvent(res.data.event);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel event.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setActionLoading(true);
      const res = await api.delete(`/events/${id}`);
      if (res.data.success) {
        navigate('/events');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete event.');
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Event Unavailable</h2>
        <p className="text-xs text-slate-500">{error || 'This event could not be found.'}</p>
        <Link
          to="/events"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events Feed</span>
        </Link>
      </div>
    );
  }

  const isCreator =
    user &&
    event.creator &&
    (event.creator._id === user.id || event.creator._id === user._id || event.creator === user.id);

  const formatDate = (d) => {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved & Live</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
            <Ban className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events Feed</span>
        </Link>
        <div className="flex items-center gap-2">{getStatusBadge(event.status)}</div>
      </div>

      {actionMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Rejection Notice Banner (if event is rejected) */}
      {event.status === 'rejected' && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 space-y-2">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span>Administrator Rejection Notice</span>
          </div>
          <p className="text-xs text-red-700 leading-relaxed pl-7">
            <strong>Reason:</strong> {event.rejectionReason || 'No specific reason provided.'}
          </p>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Large Hero Poster */}
        <div
          className="h-64 sm:h-96 relative bg-slate-900 overflow-hidden cursor-zoom-in group"
          onClick={() => {
            if (event.image) setShowImageModal(true);
          }}
          title="Click to view full image"
        >
          <img
            src={getImageUrl(event.image)}
            alt={event.title}
            className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

          {/* Badges on poster */}
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-blue-600/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-sm">
              {event.category}
            </span>
            {event.branch && event.branch !== 'ALL' && (
              <span className="px-3 py-1 rounded-xl bg-purple-600/90 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                {event.branch} Branch
              </span>
            )}
          </div>

          {/* Full-screen zoom button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(true);
            }}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-md transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
            title="View image full screen"
          >
            <Maximize2 className="w-4 h-4" />
            <span className="hidden sm:inline">View Image</span>
          </button>

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-1 pointer-events-none">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider">
              {event.organizer}
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              {event.title}
            </h1>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Date
                </span>
                <p className="text-sm font-bold text-slate-800">{formatDate(event.date)}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-100 text-indigo-700 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Time Schedule
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {event.startTime} - {event.endTime}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3 sm:col-span-2 lg:col-span-1">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Venue / Location
                </span>
                <p className="text-sm font-bold text-slate-800 truncate">{event.venue}</p>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">About This Event</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          </div>

          {/* Organizer & Submitter Details */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar user={event.creator} size="lg" className="shadow-sm" />
              <div>
                <p className="text-sm font-bold text-slate-900">{event.creator?.name}</p>
                <p className="text-xs text-slate-500">
                  Submitted by {event.creator?.role?.toLowerCase()} ({event.creator?.branch || event.creator?.department || 'Central'})
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Target Audience:{' '}
              <strong className="text-slate-800">
                {event.branch === 'ALL' ? 'Open to All Branches' : `${event.branch} Department Only`}
              </strong>
            </div>
          </div>

          {/* Contextual Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Event link copied to clipboard!');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Admin & Creator Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Admin Actions */}
              {isAdmin && event.status === 'pending' && (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs transition-colors"
                  >
                    Reject Submission
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
                  >
                    Approve Event
                  </button>
                </>
              )}

              {/* Cancel event (Admin or Creator for approved events) */}
              {(isAdmin || isCreator) && event.status === 'approved' && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold text-xs transition-colors"
                >
                  Cancel Event
                </button>
              )}

              {/* Delete event */}
              {(isAdmin || isCreator) && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reject Event Submission</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please enter a constructive reason for rejection. This reason will be visible to the student/faculty creator in their submissions dashboard.
            </p>
            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Venue is already booked during this time, or missing faculty supervisor authorization."
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-red-500 focus:bg-white"
              ></textarea>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete This Event?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              This action cannot be undone. All event details and attendee records will be permanently removed.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Viewer Lightbox Modal */}
      <ImageViewerModal
        isOpen={showImageModal}
        imageUrl={getImageUrl(event?.image)}
        title={event?.title}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
};

export default EventDetails;
