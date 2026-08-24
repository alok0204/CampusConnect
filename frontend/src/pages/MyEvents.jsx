import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageViewerModal from '../components/ImageViewerModal';
import { getImageUrl } from '../utils/imageUrl';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Sparkles,
  Ban,
  AlertTriangle,
  Trash2,
  Maximize2,
} from 'lucide-react';

export const MyEvents = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/events/my-events');
      if (res.data.success) {
        setEvents(res.data.events);
      }
    } catch (err) {
      console.error('Error fetching my events:', err);
      setError('Could not load your submitted events.');
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (activeTab === 'all') return true;
    return e.status === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approved</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 text-[11px] font-extrabold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 text-[11px] font-extrabold uppercase tracking-wider">
            <Ban className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return null;
    }
  };

  const counts = {
    all: events.length,
    pending: events.filter((e) => e.status === 'pending').length,
    approved: events.filter((e) => e.status === 'approved').length,
    rejected: events.filter((e) => e.status === 'rejected').length,
    cancelled: events.filter((e) => e.status === 'cancelled').length,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Creator Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            My Submitted Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your event proposals, view administrative review status, and inspect approval feedback.
          </p>
        </div>

        <div>
          <Link
            to="/events/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Host New Event</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
        {[
          { key: 'all', label: 'All Submissions', count: counts.all },
          { key: 'pending', label: 'Pending Review', count: counts.pending },
          { key: 'approved', label: 'Approved & Live', count: counts.approved },
          { key: 'rejected', label: 'Rejected', count: counts.rejected },
          { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
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
                activeTab === tab.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse p-4"></div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Events Found</h3>
          <p className="text-xs text-slate-500">
            You don't have any {activeTab !== 'all' ? activeTab : ''} event submissions.
          </p>
          <div className="pt-2">
            <Link
              to="/events/create"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 inline-block"
            >
              Host an Event Now
            </Link>
          </div>
        </div>
      ) : (
        /* Event Submissions List */
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              onClick={() => navigate(`/events/${event._id}`)}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 transition-all hover:border-blue-300 hover:shadow-md space-y-4 cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/events/${event._id}`);
                }
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 cursor-zoom-in relative group/img"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (event.image) {
                        setPreviewImage({ url: getImageUrl(event.image), title: event.title });
                      }
                    }}
                    title="Click to view full image"
                  >
                    <img
                      src={getImageUrl(event.image)}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[11px] font-bold">
                        {event.category}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs text-slate-500 font-medium">
                        Target: {event.branch === 'ALL' ? 'All Branches' : `${event.branch} Only`}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{event.title}</h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
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

                <div className="flex flex-row sm:flex-col sm:items-end justify-between items-center gap-2 shrink-0">
                  {getStatusBadge(event.status)}
                  <span className="text-[11px] text-slate-400 font-medium">
                    Submitted: {new Date(event.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Rejection alert box if rejected */}
              {event.status === 'rejected' && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-900">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Administrator Feedback:</span>
                  </div>
                  <p className="pl-5 text-red-700">{event.rejectionReason}</p>
                </div>
              )}

              {/* Footer action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Organizer: <strong className="text-slate-700">{event.organizer}</strong>
                </span>

                <Link
                  to={`/events/${event._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                >
                  <span>Manage Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full-screen Image Lightbox Modal */}
      <ImageViewerModal
        isOpen={!!previewImage}
        imageUrl={previewImage?.url}
        title={previewImage?.title}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
};

export default MyEvents;
