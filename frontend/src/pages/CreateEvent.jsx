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
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
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

    // Client-side validations
    if (!formData.title.trim()) {
      setError('Please provide an event title.');
      return;
    }
    if (formData.title.trim().length < 3) {
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
      setError('Please provide the organizer committee or club name.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/events', formData);
      if (res.data.success) {
        setSubmittedEvent(res.data.event);
      }
    } catch (err) {
      console.error('Event submission error:', err);
      setError(err.response?.data?.message || 'Failed to submit event. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  // Submission Success Modal / State
  if (submittedEvent) {
    const isPending = submittedEvent.status === 'pending';
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center space-y-5">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-sm ${
            isPending ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}
        >
          {isPending ? <ShieldAlert className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
        </div>

        <div>
          <span
            className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
              isPending ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isPending ? 'Status: Pending Admin Approval' : 'Status: Published'}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {isPending ? 'Event Submitted for Review!' : 'Event Successfully Published!'}
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
            {isPending
              ? `Your event "${submittedEvent.title}" has been placed in the approval queue. An administrator will review and approve it shortly before it appears on the public campus feed.`
              : `Your event "${submittedEvent.title}" is live and visible to campus attendees.`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left space-y-2 text-xs text-slate-600 max-w-md mx-auto">
          <p>
            <strong className="text-slate-800">Event Title:</strong> {submittedEvent.title}
          </p>
          <p>
            <strong className="text-slate-800">Category:</strong> {submittedEvent.category} •{' '}
            {submittedEvent.branch === 'ALL' ? 'College-wide' : `${submittedEvent.branch} Branch`}
          </p>
          <p>
            <strong className="text-slate-800">Venue:</strong> {submittedEvent.venue}
          </p>
          <p>
            <strong className="text-slate-800">Date & Time:</strong>{' '}
            {new Date(submittedEvent.date).toLocaleDateString()} ({submittedEvent.startTime} -{' '}
            {submittedEvent.endTime})
          </p>
        </div>

        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/events/my-events"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 shadow-sm transition-colors"
          >
            View in My Submissions
          </Link>
          <Link
            to="/events"
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors"
          >
            Back to Events Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/events"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events Feed</span>
        </Link>
        <span className="text-xs font-semibold text-slate-400">
          Organizer Portal • Host Event
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Campus Event Proposal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Campus Event
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Submit an official or club event. Student submissions will be reviewed and verified by campus administrators.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm font-medium">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Event Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Event Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Annual Code Marathon 2026"
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Category & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Branch Access (Audience) *
              </label>
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
              >
                {branches.map((b) => (
                  <option key={b} value={b}>
                    {b === 'ALL' ? 'College-wide (All Branches)' : `${b} Branch Only`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Start Time, End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Event Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Start Time *
              </label>
              <input
                type="text"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                placeholder="10:00 AM"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                End Time *
              </label>
              <input
                type="text"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                placeholder="02:00 PM"
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Venue & Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Venue / Campus Location *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="e.g. Auditorium / CS Lab 3"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Organizing Club / Department *
              </label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleChange}
                placeholder="e.g. Coding Club / CSE Department"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Full Event Description *
            </label>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide event overview, registration details, prerequisites, and schedule..."
              required
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-y"
            ></textarea>
          </div>

          {/* Poster Image Upload */}
          <div className="space-y-2">
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData((prev) => ({ ...prev, image: url }))}
              label="Event Image / Banner"
              description="Upload an event poster from your device (Max 10 MB)"
              aspectRatio="banner"
            />

            {/* Image Presets */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs pt-1">
              <span className="text-slate-400 font-semibold text-[11px] shrink-0">
                Or pick a preset:
              </span>
              {sampleImages.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, image: preset.url }))}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 text-slate-600 hover:text-blue-700 whitespace-nowrap text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notice for Student Submissions */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-800">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="block text-amber-900 font-bold mb-0.5">
                Approval Notice
              </strong>
              {isAdmin
                ? 'As an Administrator, this event will be published immediately upon submission.'
                : 'Student & faculty proposals are submitted with status = PENDING. Campus administrators will verify details and approve the event before it becomes visible to students.'}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-200 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Submit Event for Approval</span>
                  <Send className="w-4 h-4" />
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
