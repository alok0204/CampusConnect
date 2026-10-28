import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ImageUpload from '../components/ImageUpload';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldAlert,
  Send,
} from 'lucide-react';

export const CreateEvent = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical',
    date: '',
    startTime: '10:00 AM',
    endTime: '01:00 PM',
    venue: '',
    organizer: '',
    targetAudience: 'ALL',
    branch: user?.branch || 'ALL',
    image:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittedEvent, setSubmittedEvent] = useState(null);

  const categories = [
    'Technical',
    'Hackathon',
    'Workshop',
    'Seminar',
    'Cultural',
    'Sports',
    'Fest',
    'Other',
  ];

  const branches = ['ALL', 'CSE', 'ECE', 'ME', 'CE', 'IT', 'EE', 'AIDS'];

  const sampleImages = [
    {
      label: 'Hackathon / Coding',
      url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Workshop / Lab',
      url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Seminar / Keynote',
      url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80',
    },
    {
      label: 'Cultural / Fest',
      url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    },
  ];

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || formData.title.trim().length < 3) {
      setError('Event title must be at least 3 characters.');
      return;
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('Please provide a detailed event description (at least 10 characters).');
      return;
    }
    if (!formData.date) {
      setError('Please select an event date.');
      return;
    }
    if (!formData.venue.trim()) {
      setError('Please specify the event venue or classroom/lab.');
      return;
    }
    if (!formData.organizer.trim()) {
      setError('Please provide the organizing club or department.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/events', formData);
      if (res.data?.success) {
        setSubmittedEvent(res.data.event);
      }
    } catch (err) {
      console.error('Event submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit event. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  if (submittedEvent) {
    const isPending = submittedEvent.status === 'pending';
    return (
      <div className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card p-8 sm:p-10 text-center space-y-4">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto shadow-subtle ${
            isPending
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600'
          }`}
        >
          {isPending ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
        </div>

        <div>
          <span
            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
              isPending
                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {isPending ? 'Pending Moderation' : 'Published'}
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            {isPending ? 'Event Submitted for Review!' : 'Event Published Successfully!'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            {isPending
              ? `Your event "${submittedEvent.title}" will be reviewed by campus administrators before appearing on the public feed.`
              : `Your event "${submittedEvent.title}" is now live on the campus events feed.`}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 text-left space-y-1.5 text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
          <p>
            <strong className="text-slate-800 dark:text-slate-100">Title:</strong> {submittedEvent.title}
          </p>
          <p>
            <strong className="text-slate-800 dark:text-slate-100">Category:</strong> {submittedEvent.category} •{' '}
            {submittedEvent.branch === 'ALL' ? 'College-wide' : `${submittedEvent.branch} Dept`}
          </p>
          <p>
            <strong className="text-slate-800 dark:text-slate-100">Venue:</strong> {submittedEvent.venue}
          </p>
          <p>
            <strong className="text-slate-800 dark:text-slate-100">Date:</strong>{' '}
            {new Date(submittedEvent.date).toLocaleDateString()} ({submittedEvent.startTime} -{' '}
            {submittedEvent.endTime})
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <Link
            to="/events/my-events"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs shadow-subtle transition-colors"
          >
            View My Submissions
          </Link>
          <Link
            to="/events"
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events Feed</span>
        </Link>
        <span className="text-[11px] text-slate-400 font-medium">Campus Event Proposal</span>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-card p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Host a Campus Event
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Submit a symposium, workshop, hackathon, or cultural fest for campus promotion.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Annual Code Marathon 2026"
              required
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-brand-600 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Department Access *
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b === 'ALL' ? 'College-wide (All Departments)' : `${b} Dept Only`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="text"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                placeholder="10:00 AM"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="text"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                placeholder="01:00 PM"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Venue Location *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="Auditorium / CS Lab 3"
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Organizer / Society *
              </label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                placeholder="Coding Club / CSE Society"
                required
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe event details, prerequisites, and agenda..."
              required
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="space-y-2">
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              label="Event Poster / Cover Photo"
              description="Upload a banner from your computer or choose a preset"
              aspectRatio="banner"
            />

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold shrink-0">
                Preset covers:
              </span>
              {sampleImages.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-brand-500 whitespace-nowrap text-[11px] font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              {isAdmin
                ? 'As an Administrator, this event will be published immediately upon submission.'
                : 'Student submissions require administrative moderation before they appear on the public calendar.'}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white font-semibold text-xs shadow-subtle flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Submit Event</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
